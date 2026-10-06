import {
  ConnectionProvider,
  RPC_ENDPOINT,
} from './components/providers/ConnectionProvider';
import {clusterApiUrl} from '@solana/web3.js';
import React from 'react';
import {SafeAreaView, StyleSheet, StatusBar} from 'react-native';
import {AuthorizationProvider} from './components/providers/AuthorizationProvider';
import {Header} from './components/Header';

import MainScreen from './screens/MainScreen';

export default function App() {
  return (
    <ConnectionProvider
      config={{commitment: 'processed'}}
      endpoint={clusterApiUrl(RPC_ENDPOINT)}>
      <AuthorizationProvider>
        <SafeAreaView style={styles.shell}>
          <StatusBar backgroundColor="#12141b" barStyle="light-content" />
          <Header />
          <MainScreen />
        </SafeAreaView>
      </AuthorizationProvider>
    </ConnectionProvider>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
});
