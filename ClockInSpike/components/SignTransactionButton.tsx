import {Buffer} from 'buffer';
import React, {useCallback, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';

import {useAuthorization} from './providers/AuthorizationProvider';
import {useConnection} from './providers/ConnectionProvider';
import {alertAndLog} from '../util/alertAndLog';
import {hasVerifiedMemoReceipt, MEMO_PROGRAM_ID} from '../util/verifyMemoReceipt';

type ProofState =
  | 'READY'
  | 'AWAITING_WALLET'
  | 'SUBMITTING'
  | 'SUBMITTED'
  | 'PENDING_VERIFICATION'
  | 'CONFIRMED'
  | 'USER_REJECTED'
  | 'FAILED';

const stateCopy: Record<ProofState, string> = {
  READY: 'Ready to test a real wallet transaction.',
  AWAITING_WALLET: 'Waiting for wallet approval…',
  SUBMITTING: 'Wallet signed. Sending to Solana devnet…',
  SUBMITTED: 'Submitted. Checking the network independently…',
  PENDING_VERIFICATION: 'Submitted; waiting for finalized verification.',
  CONFIRMED: 'Finalized and independently verified on devnet.',
  USER_REJECTED: 'Wallet approval was cancelled. No transaction was submitted.',
  FAILED: 'The transaction could not be verified. Review the details and retry.',
};

const explorerUrl = (signature: string) =>
  `https://explorer.solana.com/tx/${signature}?cluster=devnet`;

export default function SignTransactionButton() {
  const {connection} = useConnection();
  const {authorizeSession} = useAuthorization();
  const busy = useRef(false);
  const attempt = useRef<{signature: string; memo: string; wallet: PublicKey} | null>(null);
  const [state, setState] = useState<ProofState>('READY');
  const [detail, setDetail] = useState<string | null>(null);

  const verify = useCallback(
    async (signature: string, memo: string, wallet: PublicKey) => {
      setState('PENDING_VERIFICATION');
      setDetail(null);
      try {
        const statusResponse = await connection.getSignatureStatuses(
          [signature],
          {searchTransactionHistory: true},
        );
        const status = statusResponse.value[0];
        if (!status) {
          setDetail('Signature is not available from the RPC yet.');
          return;
        }
        if (status.err) {
          setState('FAILED');
          setDetail('Solana reports an error for this transaction.');
          return;
        }
        if (status.confirmationStatus !== 'finalized') {
          setDetail(`Network status: ${status.confirmationStatus ?? 'processed'}.`);
          return;
        }

        const transaction = await connection.getParsedTransaction(signature, {
          commitment: 'finalized',
          maxSupportedTransactionVersion: 0,
        });
        if (!hasVerifiedMemoReceipt(transaction, signature, wallet, memo)) {
          setDetail('Finalized transaction is not yet available with the expected receipt.');
          return;
        }
        setState('CONFIRMED');
      } catch (error) {
        setDetail(
          error instanceof Error
            ? `Network lookup failed: ${error.message}`
            : 'Network lookup failed. Try verification again.',
        );
      }
    },
    [connection],
  );

  const submit = useCallback(async () => {
    if (busy.current) {
      return;
    }
    busy.current = true;
    setDetail(null);
    setState('AWAITING_WALLET');

    const memo = `CLOCKIN_SPIKE|${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    let walletAddress: PublicKey | null = null;
    let submittedSignature: string | null = null;

    try {
      const result = await transact(async (wallet: Web3MobileWallet) => {
        const account = await authorizeSession(wallet);
        walletAddress = account.publicKey;
        const latestBlockhash = await connection.getLatestBlockhash('confirmed');
        const transaction = new Transaction({
          ...latestBlockhash,
          feePayer: account.publicKey,
        }).add(
          new TransactionInstruction({
            keys: [],
            programId: MEMO_PROGRAM_ID,
            data: Buffer.from(memo, 'utf8'),
          }),
        );

        const signed = await wallet.signTransactions({transactions: [transaction]});
        setState('SUBMITTING');
        const signature = await connection.sendRawTransaction(signed[0].serialize(), {
          preflightCommitment: 'confirmed',
        });
        return {signature, wallet: account.publicKey};
      });

      submittedSignature = result.signature;
      walletAddress = result.wallet;
      attempt.current = {signature: result.signature, memo, wallet: result.wallet};
      setState('SUBMITTED');
      await verify(result.signature, memo, result.wallet);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const rejected = /reject|cancel|declin|user abort/i.test(message);
      setState(rejected ? 'USER_REJECTED' : 'FAILED');
      setDetail(message);
      if (submittedSignature && walletAddress) {
        attempt.current = {signature: submittedSignature, memo, wallet: walletAddress};
        setState('PENDING_VERIFICATION');
        setDetail(`Submitted signature retained. ${message}`);
      } else {
        alertAndLog(rejected ? 'Wallet approval cancelled' : 'Wallet transaction failed', message);
      }
    } finally {
      busy.current = false;
    }
  }, [authorizeSession, connection, verify]);

  const retryVerification = useCallback(() => {
    if (!attempt.current || busy.current) {
      return;
    }
    busy.current = true;
    void verify(
      attempt.current.signature,
      attempt.current.memo,
      attempt.current.wallet,
    ).finally(() => {
      busy.current = false;
    });
  }, [verify]);

  const inProgress =
    state === 'AWAITING_WALLET' || state === 'SUBMITTING' || state === 'SUBMITTED';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.networkPill}>
          <View style={styles.networkDot} />
          <Text style={styles.networkText}>SOLANA DEVNET</Text>
        </View>
        <Text style={styles.stepLabel}>LIVE SPIKE</Text>
      </View>

      <Text style={styles.title}>Wallet → verified receipt</Text>
      <Text style={styles.description}>
        Approve a small memo transaction. The app reports confirmed only after it
        finds the finalized transaction and checks your wallet signature and memo.
      </Text>

      <View
        accessibilityLiveRegion="polite"
        accessibilityRole="text"
        style={[
          styles.statusBox,
          state === 'CONFIRMED' && styles.statusSuccess,
          (state === 'FAILED' || state === 'USER_REJECTED') && styles.statusFailure,
          state === 'PENDING_VERIFICATION' && styles.statusPending,
        ]}>
        {inProgress && <ActivityIndicator color="#183c34" size="small" />}
        {state === 'CONFIRMED' && <Text style={styles.statusIcon}>✓</Text>}
        {state === 'FAILED' && <Text style={styles.statusIcon}>!</Text>}
        {state === 'USER_REJECTED' && <Text style={styles.statusIcon}>×</Text>}
        <View style={styles.statusCopy}>
          <Text style={styles.statusTitle}>{stateCopy[state]}</Text>
          {detail ? <Text style={styles.detail}>{detail}</Text> : null}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          state === 'PENDING_VERIFICATION' ? 'Check transaction status again' : 'Sign and send a devnet memo'
        }
        disabled={inProgress}
        onPress={state === 'PENDING_VERIFICATION' ? retryVerification : submit}
        style={({pressed}) => [
          styles.action,
          pressed && !inProgress && styles.actionPressed,
          inProgress && styles.actionDisabled,
        ]}>
        <Text style={styles.actionText}>
          {state === 'PENDING_VERIFICATION'
            ? 'Check status again'
            : state === 'CONFIRMED'
              ? 'Send another test receipt'
              : state === 'AWAITING_WALLET' || state === 'SUBMITTING' || state === 'SUBMITTED'
                ? 'Working…'
                : 'Connect wallet & approve'}
        </Text>
        <Text style={styles.actionArrow}>→</Text>
      </Pressable>

      {attempt.current ? (
        <View style={styles.receipt}>
          <Text style={styles.receiptLabel}>TRANSACTION SIGNATURE</Text>
          <Text selectable style={styles.signature}>
            {attempt.current.signature}
          </Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => Linking.openURL(explorerUrl(attempt.current!.signature))}>
            <Text style={styles.explorerLink}>Open devnet explorer ↗</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.warning}>
        <Text style={styles.warningMark}>i</Text>
        <Text style={styles.warningText}>
          Test only. This writes a public devnet memo and pays a devnet fee. No
          private key is stored by this app.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fffdf9',
    borderColor: '#e9e4db',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#162d28',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  headerRow: {alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between'},
  networkPill: {
    alignItems: 'center',
    backgroundColor: '#e9f3ed',
    borderRadius: 99,
    flexDirection: 'row',
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  networkDot: {backgroundColor: '#398364', borderRadius: 4, height: 7, marginRight: 7, width: 7},
  networkText: {color: '#285844', fontSize: 10, fontWeight: '800', letterSpacing: 1},
  stepLabel: {color: '#9b5a41', fontSize: 10, fontWeight: '800', letterSpacing: 1.2},
  title: {color: '#183c34', fontSize: 24, fontWeight: '800', letterSpacing: -0.5, marginTop: 22},
  description: {color: '#67746e', fontSize: 14, lineHeight: 21, marginTop: 9},
  statusBox: {
    alignItems: 'center',
    backgroundColor: '#f2f0eb',
    borderRadius: 16,
    flexDirection: 'row',
    marginTop: 20,
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  statusSuccess: {backgroundColor: '#e8f4eb'},
  statusFailure: {backgroundColor: '#fff0ec'},
  statusPending: {backgroundColor: '#fff5df'},
  statusIcon: {color: '#28644b', fontSize: 20, fontWeight: '800', marginRight: 10},
  statusCopy: {flex: 1, marginLeft: 10},
  statusTitle: {color: '#183c34', fontSize: 13, fontWeight: '700', lineHeight: 18},
  detail: {color: '#69736e', fontSize: 12, lineHeight: 17, marginTop: 4},
  action: {
    alignItems: 'center',
    backgroundColor: '#153f35',
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 54,
    paddingHorizontal: 18,
  },
  actionPressed: {backgroundColor: '#245c4e', transform: [{scale: 0.985}]},
  actionDisabled: {backgroundColor: '#82948d'},
  actionText: {color: '#fffdf9', fontSize: 15, fontWeight: '700'},
  actionArrow: {color: '#d4e2d7', fontSize: 19, marginLeft: 10},
  receipt: {borderTopColor: '#e9e4db', borderTopWidth: 1, marginTop: 19, paddingTop: 16},
  receiptLabel: {color: '#858d87', fontSize: 9, fontWeight: '800', letterSpacing: 1.2},
  signature: {color: '#344b43', fontSize: 11, lineHeight: 17, marginTop: 8},
  explorerLink: {color: '#26735a', fontSize: 13, fontWeight: '700', marginTop: 9},
  warning: {alignItems: 'flex-start', flexDirection: 'row', marginTop: 18},
  warningMark: {color: '#a76b31', fontSize: 13, fontWeight: '800', marginRight: 8},
  warningText: {color: '#85867f', flex: 1, fontSize: 11, lineHeight: 16},
});
