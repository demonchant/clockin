import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

export function Header() {
  return (
    <View accessibilityRole="header" style={styles.header}>
      <View style={styles.mark}>
        <Text style={styles.markText}>O</Text>
      </View>
      <View>
        <Text style={styles.title}>OpenMic</Text>
        <Text style={styles.subtitle}>PASSPORT</Text>
      </View>
      <View style={styles.mainnetPill}>
        <View style={styles.dot} />
        <Text style={styles.mainnetText}>MAINNET</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    backgroundColor: '#12141b',
    flexDirection: 'row',
    minHeight: 72,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  mark: {
    alignItems: 'center',
    backgroundColor: '#ffb347',
    borderRadius: 13,
    height: 42,
    justifyContent: 'center',
    marginRight: 11,
    width: 42,
  },
  markText: {color: '#1c1711', fontSize: 25, fontWeight: '900'},
  title: {color: '#f4f0e8', fontSize: 18, fontWeight: '800', letterSpacing: -0.3},
  subtitle: {color: '#a8abb5', fontSize: 9, fontWeight: '800', letterSpacing: 2},
  mainnetPill: {
    alignItems: 'center',
    borderColor: '#45434a',
    borderRadius: 99,
    borderWidth: 1,
    flexDirection: 'row',
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  dot: {backgroundColor: '#7bd7ff', borderRadius: 4, height: 7, marginRight: 7, width: 7},
  mainnetText: {color: '#d4d7df', fontSize: 9, fontWeight: '800', letterSpacing: 0.8},
});
