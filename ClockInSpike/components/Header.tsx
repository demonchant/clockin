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
});
