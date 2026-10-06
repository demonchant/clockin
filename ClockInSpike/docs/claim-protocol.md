# OpenMic event claim protocol (v1)

This is the input contract used by the Android app's organizer and attendee workflows. It does not imply that a named outside organizer has adopted OpenMic.

## QR JSON

The QR contains one UTF-8 JSON object with these exact signed fields:

```json
{
  "version": 1,
  "eventId": "organizer-event-id",
  "eventName": "Event name",
  "issuerName": "Organizer name",
  "issuerAddress": "base58 Ed25519 public key",
  "recipient": "base58 attendee Solana wallet address",
  "nonce": "unique claim value",
  "issuedAt": "ISO-8601 timestamp",
  "expiresAt": "ISO-8601 timestamp",
  "signature": "base64 Ed25519 signature"
}
```

The QR must be personalized for the recipient wallet. Scanning checks that the detached signature verifies, the recipient matches the currently authorized wallet, and the time window is valid. Before a first claim from an issuer can be submitted, the attendee must explicitly trust that key on this device. The permitted validity window is at most 15 minutes; up to 60 seconds of future clock skew is allowed for `issuedAt`. The signed message must be at most 450 UTF-8 bytes.

The signature is Ed25519 over the UTF-8 bytes of the following newline-separated message, with no trailing newline:

```text
OPENMIC_EVENT_CLAIM_V1
eventId
eventName
issuerName
issuerAddress
recipient
nonce
issuedAt
expiresAt
```

The organizer workflow can create this payload in-app: the organizer enters the event, organizer display name, and attendee wallet, then signs the canonical message with the connected wallet through MWA. The wallet address is the issuer key. CLOCK IN has not supplied an OpenMic issuer key or signed attendee claim; OpenMic must not invent either or present a self-issued claim as official CLOCK IN attendance. For another event, the organizer can use their own wallet. The attendee must compare that full address with one shared separately by the organizer before trusting it. A valid signature alone does not establish the issuer's real-world identity. Trust is stored locally and is only the user's choice on that device.

## Solana receipt

After review, the wallet signs a Memo Program transaction containing `OPENMIC|v1|` followed by base64 of the signed message, `|`, and the issuer signature. It contains no attendee name, email, or other personal data. The recording build submits this transaction to Solana mainnet. It does not transfer SOL, but the wallet pays a network fee. The event ID, nonce, issuer address, signed claim message, and issuer signature become public and permanent. The app records the transaction signature and expected memo before submission, then independently checks mainnet finality, transaction success, wallet signer, and exact memo through RPC. Pending attempts can be reconciled from local storage after restart.

This Memo transaction is a public receipt, not an on-chain claim account. The client checks local duplicate history and can restore up to the latest 500 finalized transactions for the connected wallet by verifying the issuer signature and transaction time. There is no program-level uniqueness constraint; another device could submit the same valid claim again. The receipt also does not prove physical presence. Do not describe this version as replay-proof or attendance verification. A custom program or another independently enforced uniqueness mechanism would be needed for that guarantee.

## App dependencies and limits

Android QR capture delegates scanning to Google Play services Code Scanner; Android 6.0 / API 23 or later is required. On first use, Play services may need to download the scanner UI module. The app needs network access for wallet RPC and mainnet verification. Pending receipts and history are stored locally with AsyncStorage. Wallet authorization and its reauthorization token stay in memory and are cleared when the app restarts; wallet private keys are never stored by OpenMic.
