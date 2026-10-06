/**
 * @format
 */

import 'react-native';
import React from 'react';
import {Text} from 'react-native';
import App from '../App';

// Note: test renderer must be required after react-native.
import renderer from 'react-test-renderer';

jest.setTimeout(15000);

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('react-native-qrcode-svg', () => 'QRCode');
jest.mock('@solana-mobile/mobile-wallet-adapter-protocol-web3js', () => ({
  transact: jest.fn(),
}));

it('renders the Android passport and native bottom navigation', async () => {
  let tree: renderer.ReactTestRenderer;
  await renderer.act(async () => {
    tree = renderer.create(<App />);
    await Promise.resolve();
    await Promise.resolve();
  });
  const visibleText = tree!.root.findAllByType(Text).map(node => node.props.children).flat(Infinity);
  expect(visibleText).toContain('Passport');
  expect(visibleText).toContain('History');
  expect(visibleText).toContain('Issue');
  tree!.unmount();
});
