import React, {useCallback, useState} from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, View} from 'react-native';
import {transact} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';

import {useAuthorization} from './providers/AuthorizationProvider';

type Props = Readonly<{title?: string}>;

export default function ConnectButton({title = 'Connect wallet'}: Props) {
  const {authorizeSession} = useAuthorization();
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleConnectPress = useCallback(async () => {
    if (connecting) {
      return;
    }
    setConnecting(true);
        setMessage('Opening your wallet…');
    try {
      await transact(async wallet => {
        await authorizeSession(wallet);
      });
      setMessage('Wallet connected.');
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      const rejected = /reject|cancel|declin|user abort/i.test(detail);
      setMessage(
        rejected
          ? 'Connection cancelled. No wallet action was approved.'
          : `Could not connect: ${detail}`,
      );
    } finally {
      setConnecting(false);
    }
  }, [authorizeSession, connecting]);

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        disabled={connecting}
        onPress={handleConnectPress}
        style={({pressed}) => [
          styles.button,
          pressed && !connecting && styles.pressed,
          connecting && styles.disabled,
        ]}>
        {connecting ? <ActivityIndicator color="#1c1711" size="small" /> : null}
        <Text style={styles.buttonText}>
          {connecting ? 'Waiting for wallet…' : title}
        </Text>
        {!connecting ? <Text style={styles.arrow}>→</Text> : null}
      </Pressable>
      {message ? (
        <Text accessibilityLiveRegion="polite" style={styles.message}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#ffb347',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
  },
  pressed: {backgroundColor: '#ffc563', transform: [{scale: 0.985}]},
  disabled: {backgroundColor: '#615c62'},
  buttonText: {color: '#1c1711', fontSize: 14, fontWeight: '800'},
  arrow: {color: '#1c1711', fontSize: 18, marginLeft: 9},
  message: {color: '#aeb1bb', fontSize: 11, lineHeight: 16, marginTop: 9},
});
