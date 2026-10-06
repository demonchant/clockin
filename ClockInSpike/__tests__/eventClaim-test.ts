import nacl from 'tweetnacl';
import {PublicKey} from '@solana/web3.js';
import {fromUint8Array} from 'js-base64';

import {createClaimMessage, encodeClaimMemo, EventClaim, parseEventClaim, parseHistoricalMemo} from '../util/eventClaim';

const issuer = nacl.sign.keyPair.fromSeed(new Uint8Array(32).fill(23));
const issuerAddress = new PublicKey(issuer.publicKey).toBase58();
const wallet = new PublicKey(new Uint8Array(32).fill(9)).toBase58();

function signedClaim(overrides: Partial<EventClaim> = {}): EventClaim {
  const unsigned: EventClaim = {
    version: 1,
    eventId: 'clock-in-2026',
    eventName: 'CLOCK IN builder meetup',
    issuerName: 'OpenMic Test Issuer',
    issuerAddress,
    recipient: wallet,
    nonce: 'abCDef0123456789_nonce',
    issuedAt: new Date(Date.now() - 30_000).toISOString(),
    expiresAt: new Date(Date.now() + 8 * 60_000).toISOString(),
    signature: '',
    ...overrides,
  };
  const signature = nacl.sign.detached(new TextEncoder().encode(createClaimMessage(unsigned)), issuer.secretKey);
  return {...unsigned, signature: fromUint8Array(signature)};
}

describe('event claim protocol', () => {
  it('accepts a correctly signed, wallet-bound, unexpired claim', () => {
    const claim = signedClaim();
    expect(parseEventClaim(JSON.stringify(claim), wallet)).toEqual(claim);
  });

  it('rejects a claim addressed to a different wallet', () => {
    expect(() => parseEventClaim(JSON.stringify(signedClaim()), issuerAddress)).toThrow(/different wallet/);
  });

  it('rejects a modified signed field', () => {
    const claim = signedClaim();
    expect(() => parseEventClaim(JSON.stringify({...claim, eventName: 'Changed event'}), wallet)).toThrow(/signature is invalid/);
  });

  it('rejects expired and overlong validity windows', () => {
    const expired = signedClaim({issuedAt: new Date(Date.now() - 20 * 60_000).toISOString(), expiresAt: new Date(Date.now() - 10 * 60_000).toISOString()});
    const longLived = signedClaim({issuedAt: new Date(Date.now() - 30_000).toISOString(), expiresAt: new Date(Date.now() + 30 * 60_000).toISOString()});
    expect(() => parseEventClaim(JSON.stringify(expired), wallet)).toThrow(/expired/);
    expect(() => parseEventClaim(JSON.stringify(longLived), wallet)).toThrow(/validity window/);
  });

  it('recovers only a finalized-time memo signed by a trusted issuer for this wallet', () => {
    const claim = signedClaim();
    const trusted = new Set([issuerAddress]);
    const recovered = parseHistoricalMemo(encodeClaimMemo(claim), wallet, Math.floor(Date.now() / 1000), trusted);
    expect(recovered).toMatchObject({eventId: claim.eventId, recipient: wallet, issuerAddress});
    expect(() => parseHistoricalMemo(encodeClaimMemo(claim), wallet, Math.floor(Date.now() / 1000), new Set())).toThrow(/not trusted/);
    expect(() => parseHistoricalMemo(encodeClaimMemo(claim), wallet, null, trusted)).toThrow(/validity window/);
  });
});
