import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Linking,
  NativeModules,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {LAMPORTS_PER_SOL, PublicKey, Transaction} from '@solana/web3.js';
import {Buffer} from 'buffer';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import QRCode from 'react-native-qrcode-svg';
import {fromUint8Array} from 'js-base64';
import {transact, Web3MobileWallet} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';

import ConnectButton from '../components/ConnectButton';
import {Account, useAuthorization} from '../components/providers/AuthorizationProvider';
import {NETWORK_LABEL, RPC_ENDPOINT, useConnection} from '../components/providers/ConnectionProvider';
import {createClaimMessage, encodeClaimMemo, EventClaim, parseEventClaim, parseHistoricalMemo} from '../util/eventClaim';

// Keep receipts isolated by cluster so old practice-cluster records never look
// like mainnet receipts after a network change.
const RECEIPTS_KEY = `openmic.passport.receipts.${RPC_ENDPOINT}.v1`;
const TRUSTED_ISSUERS_KEY = 'openmic.passport.trusted-issuers.v1';
const ISSUED_CLAIMS_KEY = 'openmic.passport.issued-claims.v1';
type ReceiptStatus = 'pending' | 'verified' | 'failed';
type Receipt = {
  id: string;
  eventId: string;
  eventName: string;
  issuerName: string;
  issuerAddress: string;
  wallet: string;
  signature: string;
  memo: string;
  status: ReceiptStatus;
  createdAt: string;
  slot?: number;
  error?: string;
};
type PreparedReceipt = {
  eventId: string;
  nonce: string;
  wallet: string;
  transaction: Transaction;
  feeLamports: number;
  lastValidBlockHeight: number;
};
type Screen = 'passport' | 'organizer' | 'issued' | 'review' | 'receipt' | 'history';
const short = (value: string) => `${value.slice(0, 5)}…${value.slice(-5)}`;
const explorer = (sig: string) => `https://explorer.solana.com/tx/${sig}?cluster=${RPC_ENDPOINT}`;

async function readReceipts(): Promise<Receipt[]> {
  try {
    const raw = await AsyncStorage.getItem(RECEIPTS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed as Receipt[] : [];
  } catch { return []; }
}

export default function MainScreen() {
  const {connection} = useConnection();
  const {selectedAccount, authorizeSession, authorizationLoaded} = useAuthorization();
  const [screen, setScreen] = useState<Screen>('passport');
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [claim, setClaim] = useState<EventClaim | null>(null);
  const [issuedClaims, setIssuedClaims] = useState<EventClaim[]>([]);
  const [trustedIssuers, setTrustedIssuers] = useState<string[]>([]);
  const [eventNameInput, setEventNameInput] = useState('');
  const [issuerNameInput, setIssuerNameInput] = useState('');
  const [recipientInput, setRecipientInput] = useState('');
  const [currentReceiptSignature, setCurrentReceiptSignature] = useState<string | null>(null);
  const [preparedReceipt, setPreparedReceipt] = useState<PreparedReceipt | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [noticeError, setNoticeError] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const sentAttempt = useRef<Receipt | null>(null);

  const walletAddress = selectedAccount?.publicKey.toBase58() ?? '';
  const accountReceipts = useMemo(
    () => walletAddress ? receipts.filter(item => item.wallet === walletAddress) : [],
    [receipts, walletAddress],
  );
  const currentReceipt = accountReceipts.find(item => item.signature === currentReceiptSignature) ?? accountReceipts[0];
  const persist = useCallback(async (next: Receipt[]) => {
    setReceipts(next);
    await AsyncStorage.setItem(RECEIPTS_KEY, JSON.stringify(next));
  }, []);

  useEffect(() => {
    void Promise.all([
      readReceipts(),
      AsyncStorage.getItem(TRUSTED_ISSUERS_KEY).then(raw => raw ? JSON.parse(raw) as string[] : []),
      AsyncStorage.getItem(ISSUED_CLAIMS_KEY).then(raw => raw ? JSON.parse(raw) as EventClaim[] : []),
    ]).then(([savedReceipts, savedTrust, savedIssued]) => {
      setReceipts(savedReceipts);
      setTrustedIssuers(Array.isArray(savedTrust) ? savedTrust : []);
      setIssuedClaims(Array.isArray(savedIssued) ? savedIssued : []);
    }).catch(() => {});
  }, []);
  useEffect(() => {
    let alive = true;
    if (selectedAccount) {
      void connection.getBalance(selectedAccount.publicKey, 'confirmed')
        .then(value => { if (alive) setBalance(value); })
        .catch(() => { if (alive) setBalance(null); });
    } else setBalance(null);
    return () => { alive = false; };
  }, [connection, selectedAccount]);

  const verifyReceipt = useCallback(async (receipt: Receipt): Promise<Receipt> => {
    const status = await connection.getSignatureStatuses([receipt.signature], {searchTransactionHistory: true});
    const chainStatus = status.value[0];
    if (!chainStatus) return receipt;
    if (chainStatus.err) return {...receipt, status: 'failed', error: 'Solana finalized this transaction with an error.'};
    if (chainStatus.confirmationStatus !== 'finalized') return receipt;
    const parsed = await connection.getParsedTransaction(receipt.signature, {
      commitment: 'finalized', maxSupportedTransactionVersion: 0,
    });
    if (!parsed) return receipt;
    if (parsed.meta?.err) return {...receipt, status: 'failed', error: 'Solana reports a failed transaction.'};
    const walletSigned = parsed.transaction.message.accountKeys.some(
      key => key.pubkey.toBase58() === receipt.wallet && key.signer,
    );
    const memoFound = parsed.transaction.message.instructions.some(instruction =>
      'parsed' in instruction && instruction.program === 'spl-memo' &&
      typeof instruction.parsed === 'string' && instruction.parsed === receipt.memo,
    );
    if (!walletSigned || !memoFound) return {...receipt, status: 'failed', error: 'On-chain receipt did not match the wallet and event.'};
    return {...receipt, status: 'verified' as const, slot: parsed.slot, error: undefined};
  }, [connection]);

  useEffect(() => {
    if (!receipts.some(item => item.status === 'pending')) return;
    let alive = true;
    void Promise.all(receipts.map(item => item.status === 'pending' ? verifyReceipt(item).catch(() => item) : item))
      .then(next => { if (alive && next.some((item, index) => item !== receipts[index])) void persist(next); });
    return () => { alive = false; };
  }, [persist, receipts, verifyReceipt]);

  const scan = useCallback(async () => {
    if (!walletAddress) { setNoticeError(true); setNotice('Connect your Solana wallet before scanning a claim issued to it.'); return; }
    setNotice(''); setNoticeError(false); setBusy(true);
    try {
      const raw = await NativeModules.OpenMicQrScanner.scan() as string | null;
      if (!raw) return;
      const parsedClaim = parseEventClaim(raw, walletAddress);
      if (accountReceipts.some(item => item.eventId === parsedClaim.eventId && item.status !== 'failed')) {
        throw new Error('This event already has a receipt or pending attempt in your passport history.');
      }
      setPreparedReceipt(null); setClaim(parsedClaim); setScreen('review');
    } catch (error) {
      setNoticeError(true);
      setNotice(error instanceof Error ? error.message : 'Could not read this event QR.');
    } finally { setBusy(false); }
  }, [accountReceipts, walletAddress]);

  const issueClaim = useCallback(async () => {
    if (!selectedAccount || busy) return;
    setNotice(''); setNoticeError(false);
    if (!eventNameInput.trim() || !issuerNameInput.trim()) {
      setNoticeError(true); setNotice('Enter the event and organizer names.'); return;
    }
    let recipient: PublicKey;
    try { recipient = new PublicKey(recipientInput.trim()); }
    catch { setNoticeError(true); setNotice('Enter a valid recipient Solana wallet address.'); return; }
    setBusy(true); setNotice('Review and sign this issuer claim in your wallet…');
    try {
      const now = Date.now();
      const nonce = fromUint8Array(nacl.randomBytes(18)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const unsigned: EventClaim = {
        version: 1,
        eventId: `event-${now.toString(36)}-${nonce.slice(0, 6)}`,
        eventName: eventNameInput.trim(),
        issuerName: issuerNameInput.trim(),
        issuerAddress: selectedAccount.publicKey.toBase58(),
        recipient: recipient.toBase58(),
        nonce,
        issuedAt: new Date(now).toISOString(),
        expiresAt: new Date(now + 10 * 60 * 1000).toISOString(),
        signature: '',
      };
      const payload = new TextEncoder().encode(createClaimMessage(unsigned));
      if (payload.length > 450) throw new Error('Shorten the event or organizer name so the signed receipt fits on Solana.');
      const issued = await transact(async (wallet: Web3MobileWallet) => {
        const account = await authorizeSession(wallet);
        if (account.publicKey.toBase58() !== unsigned.issuerAddress) throw new Error('Connected issuer wallet changed.');
        const [signedMessage] = await wallet.signMessages({addresses: [account.address], payloads: [payload]});
        if (!signedMessage) {
          throw new Error('Wallet did not return a signature for this claim.');
        }
        // MWA specifies the original message followed by its Ed25519 signature.
        // Some wallet versions return only the 64-byte signature; accept that
        // form only when it verifies against this exact claim and issuer key.
        let signature: Uint8Array;
        if (signedMessage.length === payload.length + 64) {
          const returnedPayload = signedMessage.slice(0, payload.length);
          if (returnedPayload.some((byte, index) => byte !== payload[index])) {
            throw new Error('Wallet returned a signature for different claim content.');
          }
          signature = signedMessage.slice(payload.length);
        } else if (signedMessage.length === 64) {
          signature = signedMessage;
        } else {
          throw new Error(`Wallet returned ${signedMessage.length} signed bytes; expected the claim plus a 64-byte signature.`);
        }
        if (!nacl.sign.detached.verify(payload, signature, account.publicKey.toBytes())) {
          throw new Error('Wallet signature did not match the event claim.');
        }
        return {...unsigned, signature: fromUint8Array(signature)};
      });
      const nextIssued = [issued, ...issuedClaims.filter(item => item.nonce !== issued.nonce)].slice(0, 20);
      await AsyncStorage.setItem(ISSUED_CLAIMS_KEY, JSON.stringify(nextIssued));
      setIssuedClaims(nextIssued); setClaim(issued); setScreen('issued'); setNotice('Signed by your connected wallet. Share this QR with the named recipient.');
    } catch (error) {
      setNoticeError(true);
      setNotice(error instanceof Error ? error.message : 'Wallet did not issue this claim.');
    } finally { setBusy(false); }
  }, [authorizeSession, busy, eventNameInput, issuedClaims, issuerNameInput, recipientInput, selectedAccount]);

  const trustCurrentIssuer = useCallback(async () => {
    if (!claim) return;
    const next = Array.from(new Set([...trustedIssuers, claim.issuerAddress]));
    await AsyncStorage.setItem(TRUSTED_ISSUERS_KEY, JSON.stringify(next));
    setTrustedIssuers(next);
    setNotice('Issuer key trusted on this device. You can now review and claim this event.');
    setNoticeError(false);
  }, [claim, trustedIssuers]);

  const verifyAndSave = useCallback(async (receipt: Receipt) => {
    const checked = await verifyReceipt(receipt);
    const current = await readReceipts();
    await persist(current.map(item => item.signature === receipt.signature ? checked : item));
    setCurrentReceiptSignature(receipt.signature);
    if (checked.status === 'verified') {
      setNotice(`Receipt is finalized and independently checked on Solana ${NETWORK_LABEL.toLowerCase()}.`);
      setNoticeError(false);
    }
    setScreen('receipt');
  }, [persist, verifyReceipt]);

  const prepareClaim = useCallback(async () => {
    if (!claim || !selectedAccount || busy) return;
    setBusy(true); setNotice('Estimating the mainnet network fee…'); setNoticeError(false);
    try {
      const latest = await connection.getLatestBlockhash('confirmed');
      const memo = encodeClaimMemo(claim);
      const transaction = new Transaction({...latest, feePayer: selectedAccount.publicKey}).add({
        keys: [{pubkey: selectedAccount.publicKey, isSigner: true, isWritable: false}],
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        data: Buffer.from(memo, 'utf8'),
      });
      const fee = await connection.getFeeForMessage(transaction.compileMessage(), 'confirmed');
      if (fee.value == null) throw new Error('Solana could not estimate this transaction fee. Try again before opening your wallet.');
      if (balance != null && balance < fee.value) throw new Error(`This account needs at least ${(fee.value / LAMPORTS_PER_SOL).toFixed(6)} SOL for the estimated network fee.`);
      setPreparedReceipt({
        eventId: claim.eventId, nonce: claim.nonce,
        wallet: selectedAccount.publicKey.toBase58(), transaction,
        feeLamports: fee.value, lastValidBlockHeight: latest.lastValidBlockHeight,
      });
      setNotice(`Estimated network fee: ${(fee.value / LAMPORTS_PER_SOL).toFixed(6)} SOL. No SOL is transferred. Review the exact memo and final fee in Jupiter before approving.`);
    } catch (error) {
      setPreparedReceipt(null); setNoticeError(true);
      setNotice(error instanceof Error ? error.message : 'Could not estimate the mainnet network fee.');
    } finally { setBusy(false); }
  }, [balance, busy, claim, connection, selectedAccount]);

  const submitClaim = useCallback(async () => {
    if (!claim || !selectedAccount || !preparedReceipt || busy) return;
    if (preparedReceipt.eventId !== claim.eventId || preparedReceipt.nonce !== claim.nonce ||
        preparedReceipt.wallet !== selectedAccount.publicKey.toBase58()) {
      setPreparedReceipt(null); setNoticeError(true); setNotice('The account or claim changed. Recalculate the fee before continuing.'); return;
    }
    setBusy(true); setNotice('Waiting for your wallet approval…'); setNoticeError(false);
    sentAttempt.current = null;
    let rpcAccepted = false;
    try {
      const outcome = await transact(async (wallet: Web3MobileWallet) => {
        const account: Account = await authorizeSession(wallet);
        if (account.publicKey.toBase58() !== claim.recipient) throw new Error('Wallet account changed. Scan a claim issued to the selected wallet.');
        const blockHeight = await connection.getBlockHeight('confirmed');
        if (blockHeight > preparedReceipt.lastValidBlockHeight) throw new Error('The fee estimate expired before approval. Return and refresh it before signing.');
        const transaction = preparedReceipt.transaction;
        const memo = encodeClaimMemo(claim);
        const signed = await wallet.signTransactions({transactions: [transaction]});
        const serialized = signed[0].serialize();
        const signature = signed[0].signature ? bs58.encode(signed[0].signature) : '';
        if (!signature) throw new Error('Wallet returned a transaction without the expected signature.');
        const record: Receipt = {
          id: `${claim.eventId}:${claim.nonce}`, eventId: claim.eventId,
          eventName: claim.eventName, issuerName: claim.issuerName,
          issuerAddress: claim.issuerAddress, wallet: account.publicKey.toBase58(),
          signature, memo, status: 'pending', createdAt: new Date().toISOString(),
        };
        const existing = await readReceipts();
        sentAttempt.current = record;
        // Save the deterministic transaction signature before network submission. If the
        // process is interrupted after broadcast, history can reconcile this exact attempt.
        await AsyncStorage.setItem(RECEIPTS_KEY, JSON.stringify([record, ...existing.filter(item => item.signature !== signature)]));
        const returnedSignature = await connection.sendRawTransaction(serialized, {preflightCommitment: 'confirmed'});
        if (returnedSignature !== signature) throw new Error('RPC returned a different transaction signature.');
        rpcAccepted = true;
        return record;
      });
      await verifyAndSave(outcome);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Claim did not complete.';
      setNoticeError(true);
      const submittedAttempt = sentAttempt.current as Receipt | null;
      if (submittedAttempt) {
        const recoverable = {
          ...submittedAttempt,
          error: rpcAccepted ? undefined : 'RPC did not confirm submission. This exact signed transaction is saved; check its status before retrying.',
        };
        const savedReceipts = await readReceipts();
        await persist(savedReceipts.map(item => item.signature === recoverable.signature ? recoverable : item));
        setNotice(rpcAccepted
          ? `RPC accepted the transaction; final verification is pending: ${message}`
          : `Wallet signed the transaction, but submission status is unknown. The exact signature is saved; do not send a second attempt until it is checked. ${message}`);
        setCurrentReceiptSignature(submittedAttempt.signature);
        setScreen('receipt');
      } else setNotice(/cancel|reject|declin/i.test(message) ? 'Wallet approval was cancelled. No receipt was submitted.' : message);
    } finally { setBusy(false); }
  }, [authorizeSession, busy, claim, connection, preparedReceipt, selectedAccount, verifyAndSave]);

  const restoreHistory = useCallback(async () => {
    if (!selectedAccount || busy) return;
    setBusy(true); setNotice(`Reading your recent finalized ${NETWORK_LABEL.toLowerCase()} transactions…`); setNoticeError(false);
    try {
      const signatures: string[] = [];
      let parsedTransactions: (Awaited<ReturnType<typeof connection.getParsedTransactions>>)[number][] = [];
      let before: string | undefined;
      for (let page = 0; page < 5; page += 1) {
        const options: {limit: number; before?: string} = {limit: 100};
        if (before) options.before = before;
        const rows = await connection.getSignaturesForAddress(selectedAccount.publicKey, options, 'finalized');
        if (!rows.length) break;
        const pageSignatures = rows.map(row => row.signature);
        signatures.push(...pageSignatures);
        parsedTransactions.push(...await connection.getParsedTransactions(pageSignatures, {
          commitment: 'finalized', maxSupportedTransactionVersion: 0,
        }));
        before = rows[rows.length - 1].signature;
        if (rows.length < 100) break;
      }
      const recovered: Receipt[] = [];
      for (let index = 0; index < parsedTransactions.length; index += 1) {
        const transaction = parsedTransactions[index];
        if (!transaction || transaction.meta?.err) continue;
        const signer = transaction.transaction.message.accountKeys.some(
          key => key.pubkey.equals(selectedAccount.publicKey) && key.signer,
        );
        if (!signer) continue;
        for (const instruction of transaction.transaction.message.instructions) {
          if (!('parsed' in instruction) || instruction.program !== 'spl-memo' ||
              typeof instruction.parsed !== 'string' || !instruction.parsed.startsWith('OPENMIC|v1|')) continue;
          try {
            const claimRecord = parseHistoricalMemo(instruction.parsed, walletAddress, transaction.blockTime, new Set(trustedIssuers));
            recovered.push({
              id: `${claimRecord.eventId}:${claimRecord.nonce}`, eventId: claimRecord.eventId,
              eventName: claimRecord.eventName, issuerName: claimRecord.issuerName,
              issuerAddress: claimRecord.issuerAddress, wallet: walletAddress,
              signature: signatures[index], memo: instruction.parsed, status: 'verified',
              createdAt: new Date((transaction.blockTime ?? 0) * 1000).toISOString(),
              slot: transaction.slot,
            });
          } catch { /* Ignore memos that fail issuer, recipient, time, or signature validation. */ }
        }
      }
      const existing = await readReceipts();
      const known = new Set(existing.map(item => item.signature));
      const additions = recovered.filter(item => !known.has(item.signature));
      await persist([...additions, ...existing]);
      setNotice(additions.length
        ? `Restored ${additions.length} issuer-verified receipt${additions.length === 1 ? '' : 's'} from the latest ${signatures.length} wallet transactions.`
        : `No additional verified OpenMic receipts found in the latest ${signatures.length} wallet transactions.`);
      setNoticeError(false);
    } catch (error) {
      setNotice(error instanceof Error ? `Could not restore history: ${error.message}` : `Could not restore history from ${NETWORK_LABEL.toLowerCase()}.`);
      setNoticeError(true);
    } finally { setBusy(false); }
  }, [busy, connection, persist, selectedAccount, trustedIssuers, walletAddress]);

  const verifiedCount = useMemo(() => accountReceipts.filter(item => item.status === 'verified').length, [accountReceipts]);
  const preparedForCurrentClaim = Boolean(
    claim && selectedAccount && preparedReceipt &&
    preparedReceipt.eventId === claim.eventId && preparedReceipt.nonce === claim.nonce &&
    preparedReceipt.wallet === selectedAccount.publicKey.toBase58(),
  );
  const openExplorer = (signature: string) => { void Linking.openURL(explorer(signature)); };

  return (
    <View style={s.shell}>
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={s.topline}><Text style={s.eyebrow}>OPENMIC / PASSPORT</Text><Text style={s.network}>SOLANA {NETWORK_LABEL}</Text></View>
      <Text style={s.headline}>{screen === 'history' ? 'Your history.' : screen === 'organizer' ? 'Issue a claim.' : screen === 'issued' ? 'Share your claim.' : screen === 'review' ? 'Review claim.' : screen === 'receipt' ? 'Claim receipt.' : 'Your communities, remembered.'}</Text>
      <Text style={s.subhead}>Issuer-authorized event records, claimed with your wallet.</Text>

      {!authorizationLoaded ? <View style={s.card}><ActivityIndicator color="#ffb64d" /><Text style={s.body}>Restoring wallet session…</Text></View> : selectedAccount ? (
        <View style={s.wallet}><View style={s.row}><Text style={s.label}>SAVED WALLET</Text><Text style={s.live}>ACCOUNT ON FILE</Text></View>
          <Text selectable style={s.address}>{short(walletAddress)}</Text>
          <Text style={s.balance}>{balance === null ? `${NETWORK_LABEL[0]}${NETWORK_LABEL.slice(1).toLowerCase()} balance unavailable` : `${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL · ${NETWORK_LABEL.toLowerCase()}`}</Text>
        </View>
      ) : <View style={s.card}><Text style={s.cardTitle}>Connect your wallet</Text><Text style={s.body}>Your wallet approves each claim and keeps your private key.</Text><ConnectButton title="Connect with wallet" /></View>}

      {!!notice && <View style={[s.notice, noticeError && s.error]}><Text style={s.body}>{notice}</Text></View>}

      {screen === 'passport' && <>
        <View style={s.hero}><Text style={s.kicker}>YOUR PASSPORT</Text><Text style={s.count}>{verifiedCount.toString().padStart(2, '0')}</Text><Text style={s.body}>verified event {verifiedCount === 1 ? 'receipt' : 'receipts'}</Text></View>
        <Pressable disabled={busy || !selectedAccount} onPress={() => void scan()} style={[s.primary, (!selectedAccount || busy) && s.disabled]}>
          {busy ? <ActivityIndicator color="#15130f" /> : <Text style={s.primaryText}>Scan an event claim  →</Text>}
        </Pressable>
        <Pressable onPress={() => setScreen('history')} style={s.secondary}><Text style={s.secondaryText}>View passport history ({accountReceipts.length})</Text></Pressable>
        <Pressable onPress={() => setScreen('organizer')} style={s.secondary}><Text style={s.secondaryText}>I organize events → Issue a claim</Text></Pressable>
        <View style={s.card}><Text style={s.kicker}>HOW A CLAIM WORKS</Text><Text style={s.body}>Scan a claim issued for your wallet. OpenMic checks the issuer signature and expiry before asking you to approve a public Solana receipt.</Text></View>
      </>}

      {screen === 'organizer' && <>
        <View style={s.card}>
          <Text style={s.kicker}>ISSUER WORKSPACE</Text>
          <Text style={s.cardTitle}>Create a wallet-signed event claim</Text>
          <Text style={s.body}>Your connected wallet is the issuer; its public address is the issuer key. CLOCK IN has not published an event issuer key, so this app cannot create an official CLOCK IN claim. For your own event, sign a short-lived claim for one attendee. This only asks for a message signature and does not send a transaction.</Text>
          <Text style={s.inputLabel}>EVENT NAME</Text>
          <TextInput value={eventNameInput} onChangeText={setEventNameInput} maxLength={120} placeholder="e.g. Community listening session" placeholderTextColor="#727783" style={s.input} />
          <Text style={s.inputLabel}>ORGANIZER NAME</Text>
          <TextInput value={issuerNameInput} onChangeText={setIssuerNameInput} maxLength={80} placeholder="Name attendees recognize" placeholderTextColor="#727783" style={s.input} />
          <Text style={s.inputLabel}>ATTENDEE WALLET</Text>
          <TextInput value={recipientInput} onChangeText={setRecipientInput} autoCapitalize="none" autoCorrect={false} placeholder="Paste the attendee's public address" placeholderTextColor="#727783" style={s.input} />
          <Pressable disabled={!selectedAccount || busy} onPress={() => void issueClaim()} style={[s.primary, (!selectedAccount || busy) && s.disabled]}>{busy ? <ActivityIndicator color="#15130f" /> : <Text style={s.primaryText}>Sign claim with wallet →</Text>}</Pressable>
          {!selectedAccount ? <Text style={s.errorText}>Connect an issuer wallet before creating a QR.</Text> : null}
        </View>
        <View style={s.card}><Text style={s.kicker}>YOUR RECENT CLAIMS</Text>{issuedClaims.length === 0 ? <Text style={s.body}>Signed QR claims stay on this device. They are not event attendance records until the attendee claims them.</Text> : issuedClaims.slice(0, 5).map(item => <Pressable key={item.nonce} onPress={() => { setClaim(item); setScreen('issued'); }} style={s.savedClaim}><Text style={s.cardTitle}>{item.eventName}</Text><Text style={s.body}>{short(item.recipient)} · expires {new Date(item.expiresAt).toLocaleTimeString()}</Text></Pressable>)}</View>
      </>}

      {screen === 'issued' && claim && <>
        <View style={s.qrCard}><Text style={s.kicker}>SIGNED BY {claim.issuerName.toUpperCase()}</Text><Text style={s.qrTitle}>{claim.eventName}</Text><View style={s.qrWrap}><QRCode value={JSON.stringify(claim)} size={224} quietZone={12} ecl="M" /></View><Text style={s.body}>Recipient {short(claim.recipient)}</Text><Text style={s.body}>Expires {new Date(claim.expiresAt).toLocaleTimeString()}</Text></View>
        <View style={s.notice}><Text style={s.kicker}>SHARE IN PERSON</Text><Text style={s.body}>This signed QR contains no attendee name. Show it to the named wallet holder. Share this issuer address separately through a channel attendees already trust, or display it at the event. The QR proves this wallet signed the claim; it does not prove who controls the wallet or that the attendee was physically present.</Text><Text selectable style={s.signature}>{claim.issuerAddress}</Text></View>
        <Pressable onPress={() => setScreen('organizer')} style={s.secondary}><Text style={s.secondaryText}>Back to organizer workspace</Text></Pressable>
      </>}

      {screen === 'review' && claim && <>
        <View style={s.card}><Text style={s.kicker}>EVENT · {claim.eventId}</Text><Text style={s.cardTitle}>{claim.eventName}</Text><Text style={s.body}>Issued by {claim.issuerName}</Text><Text style={s.body}>Claim expires {new Date(claim.expiresAt).toLocaleString()}</Text><Text style={s.body}>Recipient {short(claim.recipient)}</Text></View>
        <View style={s.notice}><Text style={s.kicker}>PUBLIC MAINNET RECEIPT</Text><Text style={s.body}>If you continue, your wallet will be asked to sign and submit a Solana Memo transaction. The event ID, nonce, issuer address, and signed claim message become public on mainnet. The transaction does not transfer SOL, but it uses a network fee. Review the fee and exact Memo in Jupiter before approving. This receipt does not prove physical attendance.</Text></View>
        {!trustedIssuers.includes(claim.issuerAddress) ? <View style={s.trustCard}><Text style={s.kicker}>NEW ISSUER — SIGNATURE IS VALID</Text><Text style={s.body}>The signature proves this wallet signed this claim. It does not prove who controls the wallet. Compare this full address with one shared separately by the event organizer (for example, an official event page or an address displayed at the venue). If the organizer has not shared it, ask the organizer through a known channel before trusting it.</Text><Text selectable style={s.signature}>{claim.issuerAddress}</Text><Pressable onPress={() => void trustCurrentIssuer()} style={s.trustButton}><Text style={s.secondaryText}>I checked this address independently — trust on this device</Text></Pressable></View> : preparedForCurrentClaim ? <>
          <View style={s.card}><Text style={s.kicker}>MAINNET TRANSACTION REVIEW</Text><Text style={s.body}>From {short(selectedAccount?.publicKey.toBase58() ?? '')}</Text><Text style={s.body}>Estimated network fee: {((preparedReceipt?.feeLamports ?? 0) / LAMPORTS_PER_SOL).toFixed(6)} SOL</Text><Text style={s.body}>SOL transferred: 0</Text><Text style={s.body}>Public Memo: event ID, issuer address, signed claim and nonce. The wallet prompt is the final fee and transaction review.</Text></View>
          <Pressable disabled={busy} onPress={() => void submitClaim()} style={[s.primary, busy && s.disabled]}>{busy ? <ActivityIndicator color="#15130f" /> : <Text style={s.primaryText}>Open Jupiter to review and approve →</Text>}</Pressable>
          <Pressable disabled={busy} onPress={() => void prepareClaim()} style={s.secondary}><Text style={s.secondaryText}>Refresh fee estimate</Text></Pressable>
        </> : <Pressable disabled={busy} onPress={() => void prepareClaim()} style={[s.primary, busy && s.disabled]}>{busy ? <ActivityIndicator color="#15130f" /> : <Text style={s.primaryText}>Estimate mainnet fee →</Text>}</Pressable>}
        <Pressable disabled={busy} onPress={() => { setPreparedReceipt(null); setClaim(null); setScreen('passport'); }} style={s.secondary}><Text style={s.secondaryText}>Cancel claim</Text></Pressable>
      </>}

      {screen === 'receipt' && <>
        {currentReceipt ? <View key={currentReceipt.signature} style={s.card}><Text style={s.kicker}>{currentReceipt.status === 'verified' ? 'FINALIZED · VERIFIED' : currentReceipt.status === 'failed' ? 'FAILED CHECK' : 'PENDING VERIFICATION'}</Text><Text style={s.cardTitle}>{currentReceipt.eventName}</Text><Text style={s.body}>Issued by {currentReceipt.issuerName}</Text><Text selectable style={s.signature}>{currentReceipt.signature}</Text><Pressable onPress={() => openExplorer(currentReceipt.signature)}><Text style={s.link}>Open Solana Explorer ↗</Text></Pressable>{currentReceipt.error ? <Text style={s.errorText}>{currentReceipt.error}</Text> : null}</View> : null}
        {currentReceipt?.status === 'pending' ? <Pressable disabled={busy} onPress={() => { setBusy(true); void verifyAndSave(currentReceipt).catch(error => { setNotice(error instanceof Error ? error.message : 'Verification is still unavailable.'); setNoticeError(true); }).finally(() => setBusy(false)); }} style={[s.primary, busy && s.disabled]}><Text style={s.primaryText}>{busy ? `Checking ${NETWORK_LABEL.toLowerCase()}…` : 'Check receipt status again'}</Text></Pressable> : null}
        <Pressable onPress={() => { setNotice(''); setScreen('passport'); }} style={s.secondary}><Text style={s.secondaryText}>Back to passport</Text></Pressable>
        <Pressable onPress={() => setScreen('history')} style={s.secondary}><Text style={s.secondaryText}>View full history</Text></Pressable>
      </>}

      {screen === 'history' && <>
        {selectedAccount ? <Pressable disabled={busy} onPress={() => void restoreHistory()} style={[s.secondary, busy && s.disabled]}><Text style={s.secondaryText}>{busy ? `Reading ${NETWORK_LABEL.toLowerCase()}…` : `Restore from ${NETWORK_LABEL.toLowerCase()} (latest 500)`}</Text></Pressable> : null}
        {accountReceipts.length === 0 ? <View style={s.card}><Text style={s.cardTitle}>No claims yet</Text><Text style={s.body}>Verified receipts you claim will appear here on this device or can be restored from {NETWORK_LABEL.toLowerCase()}.</Text></View> : accountReceipts.map(receipt => <Pressable key={receipt.signature} onPress={() => { setNotice(''); setCurrentReceiptSignature(receipt.signature); setScreen('receipt'); }} style={s.historyCard}><View style={s.row}><Text style={s.kicker}>{receipt.status.toUpperCase()}</Text><Text style={s.kicker}>{new Date(receipt.createdAt).toLocaleDateString()}</Text></View><Text style={s.cardTitle}>{receipt.eventName}</Text><Text style={s.body}>{receipt.issuerName} · {short(receipt.signature)}</Text></Pressable>)}
        <Pressable onPress={() => setScreen('passport')} style={s.secondary}><Text style={s.secondaryText}>Back to passport</Text></Pressable>
      </>}
      <Text style={s.footer}>Wallet-controlled · Issuer signature required · Receipt status follows {NETWORK_LABEL.toLowerCase()} finality</Text>
    </ScrollView>
    <View style={s.bottomNav} accessibilityRole="tablist">
      <Pressable accessibilityRole="tab" accessibilityState={{selected: screen === 'passport' || screen === 'receipt' || screen === 'review'}} android_ripple={{color: '#3a3d47'}} onPress={() => { setNotice(''); setScreen('passport'); }} style={s.navItem}>
        <Text style={[s.navIcon, (screen === 'passport' || screen === 'receipt' || screen === 'review') && s.navActive]}>◈</Text><Text style={[s.navLabel, (screen === 'passport' || screen === 'receipt' || screen === 'review') && s.navActive]}>Passport</Text>
      </Pressable>
      <Pressable accessibilityRole="tab" accessibilityState={{selected: screen === 'history'}} android_ripple={{color: '#3a3d47'}} onPress={() => { setNotice(''); setScreen('history'); }} style={s.navItem}>
        <Text style={[s.navIcon, screen === 'history' && s.navActive]}>▤</Text><Text style={[s.navLabel, screen === 'history' && s.navActive]}>History</Text>
      </Pressable>
      <Pressable accessibilityRole="tab" accessibilityState={{selected: screen === 'organizer' || screen === 'issued'}} android_ripple={{color: '#3a3d47'}} onPress={() => { setNotice(''); setScreen('organizer'); }} style={s.navItem}>
        <Text style={[s.navIcon, (screen === 'organizer' || screen === 'issued') && s.navActive]}>＋</Text><Text style={[s.navLabel, (screen === 'organizer' || screen === 'issued') && s.navActive]}>Issue</Text>
      </Pressable>
    </View>
    </View>
  );
}

const s = StyleSheet.create({
  shell: {backgroundColor: '#0d0f14', flex: 1},
  content: {backgroundColor: '#0d0f14', flexGrow: 1, padding: 20, paddingBottom: 26},
  topline: {alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 8},
  eyebrow: {color: '#ffb64d', fontSize: 10, fontWeight: '900', letterSpacing: 1.5},
  network: {color: '#83d9ff', fontSize: 9, fontWeight: '800', letterSpacing: 1},
  headline: {color: '#f4f0e8', fontSize: 32, fontWeight: '900', letterSpacing: -1.1, lineHeight: 38, marginTop: 24},
  subhead: {color: '#aeb2bc', fontSize: 14, lineHeight: 21, marginBottom: 20, marginTop: 7},
  bottomNav: {backgroundColor: '#171a22', borderTopColor: '#30333c', borderTopWidth: 1, flexDirection: 'row', elevation: 10, paddingBottom: Platform.OS === 'android' ? 4 : 0, paddingTop: 5},
  navItem: {alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 58},
  navIcon: {color: '#9397a2', fontSize: 19, fontWeight: '700', lineHeight: 22},
  navLabel: {color: '#9397a2', fontSize: 10, fontWeight: '700', marginTop: 3},
  navActive: {color: '#ffbd59'},
  wallet: {backgroundColor: '#171a22', borderColor: '#2d303a', borderRadius: 18, borderWidth: 1, marginBottom: 14, padding: 15},
  row: {alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between'},
  label: {color: '#9a9eaa', fontSize: 9, fontWeight: '800', letterSpacing: 1},
  live: {color: '#85d8ff', fontSize: 9, fontWeight: '900'},
  address: {color: '#e1ded8', fontSize: 15, fontWeight: '700', marginTop: 10},
  balance: {color: '#a5a8b1', fontSize: 11, marginTop: 8},
  hero: {alignItems: 'center', backgroundColor: '#171a22', borderColor: '#2d303a', borderRadius: 22, borderWidth: 1, marginBottom: 14, padding: 22},
  kicker: {color: '#ffbd59', fontSize: 9, fontWeight: '900', letterSpacing: 1.15},
  count: {color: '#f7f3eb', fontSize: 54, fontWeight: '900', letterSpacing: -2, marginTop: 4},
  card: {backgroundColor: '#171a22', borderColor: '#2d303a', borderRadius: 19, borderWidth: 1, marginBottom: 14, padding: 17},
  historyCard: {backgroundColor: '#171a22', borderColor: '#2d303a', borderRadius: 17, borderWidth: 1, marginBottom: 10, padding: 15},
  cardTitle: {color: '#f4f0e8', fontSize: 18, fontWeight: '800', marginTop: 10},
  body: {color: '#b0b3bd', fontSize: 12, lineHeight: 18, marginTop: 7},
  inputLabel: {color: '#a5a8b2', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 16},
  input: {backgroundColor: '#20232d', borderColor: '#383b46', borderRadius: 12, borderWidth: 1, color: '#f4f0e8', fontSize: 14, marginTop: 7, minHeight: 48, paddingHorizontal: 13, paddingVertical: 10},
  savedClaim: {borderTopColor: '#30333c', borderTopWidth: 1, marginTop: 12, paddingTop: 4},
  qrCard: {alignItems: 'center', backgroundColor: '#171a22', borderColor: '#2d303a', borderRadius: 20, borderWidth: 1, marginBottom: 14, padding: 18},
  qrTitle: {color: '#f4f0e8', fontSize: 19, fontWeight: '800', marginBottom: 15, marginTop: 10, textAlign: 'center'},
  qrWrap: {alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 12, justifyContent: 'center', padding: 8},
  trustCard: {backgroundColor: '#352b1e', borderColor: '#705327', borderRadius: 17, borderWidth: 1, marginBottom: 12, padding: 15},
  trustButton: {alignItems: 'center', borderColor: '#726047', borderRadius: 12, borderWidth: 1, justifyContent: 'center', marginTop: 14, minHeight: 48, padding: 10},
  notice: {backgroundColor: '#292319', borderRadius: 15, marginBottom: 14, padding: 14},
  error: {backgroundColor: '#352126'},
  errorText: {color: '#ff997f', fontSize: 11, lineHeight: 16, marginTop: 8},
  primary: {alignItems: 'center', backgroundColor: '#ffb347', borderRadius: 15, justifyContent: 'center', marginBottom: 9, minHeight: 54, padding: 14},
  primaryText: {color: '#1c1711', fontSize: 15, fontWeight: '900'},
  disabled: {opacity: 0.5},
  secondary: {alignItems: 'center', borderColor: '#343741', borderRadius: 14, borderWidth: 1, justifyContent: 'center', marginBottom: 9, minHeight: 48, padding: 12},
  secondaryText: {color: '#d8d5ce', fontSize: 13, fontWeight: '700'},
  signature: {color: '#d6d2ca', fontSize: 10, lineHeight: 15, marginTop: 12},
  link: {color: '#80d7ff', fontSize: 13, fontWeight: '800', marginTop: 12},
  footer: {color: '#787d89', fontSize: 10, lineHeight: 15, marginTop: 20, textAlign: 'center'},
});
