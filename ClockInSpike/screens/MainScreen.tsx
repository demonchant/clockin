import React, {useCallback, useEffect, useState} from 'react';
import {LAMPORTS_PER_SOL} from '@solana/web3.js';
import {ActivityIndicator, ScrollView, StyleSheet, Text, View} from 'react-native';

import ConnectButton from '../components/ConnectButton';
import SignTransactionButton from '../components/SignTransactionButton';
import {Account, useAuthorization} from '../components/providers/AuthorizationProvider';
import {useConnection} from '../components/providers/ConnectionProvider';

function shortAddress(address: string) {
  return `${address.slice(0, 5)}…${address.slice(-5)}`;
}

export default function MainScreen() {
  const {connection} = useConnection();
  const {selectedAccount} = useAuthorization();
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceError, setBalanceError] = useState(false);

  const fetchBalance = useCallback(
    async (account: Account) => {
      setBalanceError(false);
      try {
        const nextBalance = await connection.getBalance(account.publicKey, 'confirmed');
        setBalance(nextBalance);
      } catch {
        setBalance(null);
        setBalanceError(true);
      }
    },
    [connection],
  );

  useEffect(() => {
    if (selectedAccount) {
      void fetchBalance(selectedAccount);
    }
  }, [fetchBalance, selectedAccount]);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>A WALLET-OWNED EVENT HISTORY</Text>
        <Text style={styles.headline}>Your communities, remembered.</Text>
        <Text style={styles.description}>
          OpenMic Passport is being built around event records an issuer signs
          and you choose to claim with your wallet.
        </Text>
      </View>

      {selectedAccount ? (
        <View style={styles.walletCard}>
          <View style={styles.walletHeading}>
            <View>
              <Text style={styles.cardEyebrow}>CONNECTED WALLET</Text>
              <Text style={styles.walletName}>
                {selectedAccount.label || 'Solana wallet'}
              </Text>
            </View>
            <View style={styles.connectedBadge}>
              <View style={styles.connectedDot} />
              <Text style={styles.connectedText}>CONNECTED</Text>
            </View>
          </View>
          <Text selectable style={styles.address}>
            {shortAddress(selectedAccount.publicKey.toBase58())}
          </Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Mainnet balance</Text>
            {balance === null && !balanceError ? (
              <ActivityIndicator color="#ffb64d" size="small" />
            ) : (
              <Text style={styles.balanceValue}>
                {balanceError
                  ? 'Unavailable'
                  : `${(balance! / LAMPORTS_PER_SOL).toFixed(4)} SOL`}
              </Text>
            )}
          </View>
          {balanceError ? (
            <Text style={styles.balanceHint}>Mainnet RPC could not load your balance.</Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.connectCard}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>01</Text>
          </View>
          <Text style={styles.connectTitle}>Connect your wallet</Text>
          <Text style={styles.connectDescription}>
            Your wallet stays in control. OpenMic never receives or stores your private key.
          </Text>
          <ConnectButton title="Connect with wallet" />
        </View>
      )}

      {selectedAccount ? (
        <>
          <View style={styles.liveNotice}>
            <Text style={styles.noticeLabel}>LIVE MAINNET CHECK</Text>
            <Text style={styles.noticeText}>
              This action creates a public Solana memo and pays a real network
              fee. The event QR claim workflow is not in this build yet.
            </Text>
          </View>
          <SignTransactionButton />
        </>
      ) : null}

      <Text style={styles.footer}>
        Solana mainnet · Wallet approval is always explicit · No attendance claim is made
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {backgroundColor: '#0d0f14', flexGrow: 1, padding: 20, paddingBottom: 32},
  intro: {marginBottom: 20, marginTop: 8},
  eyebrow: {color: '#ffb64d', fontSize: 10, fontWeight: '800', letterSpacing: 1.4},
  headline: {color: '#f4f0e8', fontSize: 31, fontWeight: '800', letterSpacing: -1.1, lineHeight: 36, marginTop: 9},
  description: {color: '#b0b3bd', fontSize: 15, lineHeight: 22, marginTop: 10},
  walletCard: {backgroundColor: '#171a22', borderColor: '#2d303a', borderRadius: 20, borderWidth: 1, marginBottom: 15, padding: 17},
  walletHeading: {alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between'},
  cardEyebrow: {color: '#999da8', fontSize: 9, fontWeight: '800', letterSpacing: 1.2},
  walletName: {color: '#f4f0e8', fontSize: 16, fontWeight: '800', marginTop: 5},
  connectedBadge: {alignItems: 'center', backgroundColor: '#172633', borderRadius: 99, flexDirection: 'row', paddingHorizontal: 9, paddingVertical: 7},
  connectedDot: {backgroundColor: '#7bd7ff', borderRadius: 4, height: 7, marginRight: 6, width: 7},
  connectedText: {color: '#9bddf9', fontSize: 8, fontWeight: '800', letterSpacing: 0.8},
  address: {color: '#a0a3ad', fontSize: 12, marginTop: 12},
  balanceRow: {alignItems: 'center', borderTopColor: '#2d303a', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 12},
  balanceLabel: {color: '#a4a7b0', fontSize: 12},
  balanceValue: {color: '#f4f0e8', fontSize: 13, fontWeight: '800'},
  balanceHint: {color: '#ff9f70', fontSize: 11, marginTop: 7},
  connectCard: {backgroundColor: '#171a22', borderColor: '#2d303a', borderRadius: 20, borderWidth: 1, marginBottom: 15, padding: 18},
  stepNumber: {alignItems: 'center', backgroundColor: '#35291c', borderRadius: 11, height: 38, justifyContent: 'center', width: 38},
  stepNumberText: {color: '#ffbd59', fontSize: 12, fontWeight: '900'},
  connectTitle: {color: '#f4f0e8', fontSize: 18, fontWeight: '800', marginTop: 14},
  connectDescription: {color: '#b0b3bd', fontSize: 13, lineHeight: 19, marginBottom: 15, marginTop: 6},
  liveNotice: {backgroundColor: '#282219', borderRadius: 15, marginBottom: 14, padding: 14},
  noticeLabel: {color: '#ffc66c', fontSize: 9, fontWeight: '900', letterSpacing: 1.1},
  noticeText: {color: '#ddd0b7', fontSize: 12, lineHeight: 18, marginTop: 5},
  footer: {color: '#858994', fontSize: 10, lineHeight: 15, marginTop: 18, textAlign: 'center'},
});
