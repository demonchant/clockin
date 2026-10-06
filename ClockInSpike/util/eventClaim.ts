import nacl from 'tweetnacl';
import {PublicKey} from '@solana/web3.js';
import {fromUint8Array, toUint8Array} from 'js-base64';

export type EventClaim = {
  version: 1;
  eventId: string;
  eventName: string;
  issuerName: string;
  issuerAddress: string;
  recipient: string;
  nonce: string;
  issuedAt: string;
  expiresAt: string;
  signature: string;
};

// Bound QR payload size before parsing to keep scanner input predictable.
export const MAX_QR_BYTES = 2048;

export function createClaimMessage(claim: EventClaim): string {
  return [
    'OPENMIC_EVENT_CLAIM_V1',
    claim.eventId,
    claim.eventName,
    claim.issuerName,
    claim.issuerAddress,
    claim.recipient,
    claim.nonce,
    claim.issuedAt,
    claim.expiresAt,
  ].join('\n');
}

export function parseEventClaim(raw: string, walletAddress: string): EventClaim {
  if (!raw || new TextEncoder().encode(raw).length > MAX_QR_BYTES) {
    throw new Error('This QR is empty or exceeds the allowed size.');
  }
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error('This QR is not a valid OpenMic event claim.'); }
  if (!value || typeof value !== 'object') throw new Error('Event claim has an invalid format.');
  const claim = value as EventClaim;
  const fields = [claim.eventId, claim.eventName, claim.issuerName, claim.issuerAddress, claim.recipient, claim.nonce, claim.issuedAt, claim.expiresAt, claim.signature];
  if (claim.version !== 1 || fields.some(field => typeof field !== 'string' || !field.trim())) {
    throw new Error('Event claim is missing required signed fields.');
  }
  if (claim.eventId.length > 96 || claim.eventName.length > 120 || claim.issuerName.length > 80 || claim.nonce.length > 128) {
    throw new Error('Event claim contains an oversized field.');
  }
  if (!/^[A-Za-z0-9_-]+$/.test(claim.eventId) || !/^[A-Za-z0-9_-]{16,128}$/.test(claim.nonce) || /[\u0000-\u001f]/.test(`${claim.eventName}${claim.issuerName}`)) {
    throw new Error('Event claim contains invalid text fields.');
  }
  if (new TextEncoder().encode(createClaimMessage(claim)).length > 450) {
    throw new Error('This event claim is too large for a Solana memo receipt.');
  }
  let issuer: PublicKey;
  let recipient: PublicKey;
  try {
    issuer = new PublicKey(claim.issuerAddress);
    recipient = new PublicKey(claim.recipient);
  } catch { throw new Error('Issuer or recipient address is invalid.'); }
  if (recipient.toBase58() !== walletAddress) throw new Error('This claim was issued for a different wallet.');
  const issuedAt = Date.parse(claim.issuedAt);
  const expiry = Date.parse(claim.expiresAt);
  const now = Date.now();
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiry) || issuedAt > now + 60_000 || expiry <= now || expiry <= issuedAt || expiry - issuedAt > 15 * 60_000) {
    throw new Error('This event claim is expired or has an invalid validity window.');
  }
  let signature: Uint8Array;
  try { signature = toUint8Array(claim.signature); } catch { throw new Error('Issuer signature is malformed.'); }
  if (signature.length !== 64 || !nacl.sign.detached.verify(
    new TextEncoder().encode(createClaimMessage(claim)), signature, issuer.toBytes(),
  )) throw new Error('Issuer signature is invalid.');
  return claim;
}

export function encodeClaimMemo(claim: EventClaim): string {
  // Public on-chain data; intentionally excludes attendee PII.
  return `OPENMIC|v1|${fromUint8Array(new TextEncoder().encode(createClaimMessage(claim)))}|${claim.signature}`;
}

export function parseHistoricalMemo(memo: string, walletAddress: string, blockTime: number | null | undefined, trustedIssuers: ReadonlySet<string>): EventClaim {
  const parts = memo.split('|');
  if (parts.length !== 4 || parts[0] !== 'OPENMIC' || parts[1] !== 'v1') throw new Error('Unsupported receipt memo.');
  let message: string;
  let signature: Uint8Array;
  try {
    message = new TextDecoder().decode(toUint8Array(parts[2]));
    signature = toUint8Array(parts[3]);
  } catch { throw new Error('Receipt memo encoding is invalid.'); }
  const fields = message.split('\n');
  if (fields.length !== 9 || fields[0] !== 'OPENMIC_EVENT_CLAIM_V1') throw new Error('Receipt message schema is invalid.');
  const claim: EventClaim = {
    version: 1, eventId: fields[1], eventName: fields[2], issuerName: fields[3],
    issuerAddress: fields[4], recipient: fields[5], nonce: fields[6],
    issuedAt: fields[7], expiresAt: fields[8], signature: parts[3],
  };
  const issuer = new PublicKey(claim.issuerAddress);
  const recipient = new PublicKey(claim.recipient);
  if (!trustedIssuers.has(issuer.toBase58())) throw new Error('Receipt issuer is not trusted on this device.');
  if (recipient.toBase58() !== walletAddress || signature.length !== 64 ||
      !nacl.sign.detached.verify(new TextEncoder().encode(createClaimMessage(claim)), signature, issuer.toBytes())) {
    throw new Error('Receipt does not match this wallet or has an invalid issuer signature.');
  }
  const issuedAt = Date.parse(claim.issuedAt) / 1000;
  const expiresAt = Date.parse(claim.expiresAt) / 1000;
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || blockTime == null || blockTime < issuedAt - 60 || blockTime > expiresAt) {
    throw new Error('Receipt transaction falls outside the issuer validity window.');
  }
  return claim;
}
