# Issuer keys and signed event claims

## CLOCK IN does not provide an OpenMic issuer key

The CLOCK IN hackathon registration and submission portal is not an event credential service. It does not provide OpenMic with an issuer key or a signed attendance claim. Do not invent a Solana Mobile or Radiants key, and do not describe a self-issued claim as proof that someone attended CLOCK IN.

OpenMic is an event-organizer tool. For an event that adopts it, the issuer is the organizer's own Solana wallet. The public wallet address is the issuer key; the private key remains in the wallet. The organizer uses the app to sign a different, recipient-bound claim for each attendee. The wallet signs the claim message through Mobile Wallet Adapter. The app never reads or stores the private key.

## Organizer workflow

1. Install and open OpenMic on an Android device. Connect the organizer's Solana wallet.
2. In **Issue**, enter the event name, the organizer name, and the attendee's public Solana wallet address. The attendee address is public and is used to bind this QR to that wallet.
3. Tap **Sign claim with wallet**. Review the wallet prompt. It requests a signature over event details, the organizer wallet address, the attendee address, a random nonce, and a ten-minute validity period. It does not submit a transaction or spend SOL.
4. The app displays a QR and the organizer's full public address. Show the QR to that attendee. Share the public address separately through a channel the attendee already trusts, or display it at the event.

The `issuerAddress` in the QR is the connected wallet's public address. `signature` is the wallet's Ed25519 signature over the canonical message in [claim-protocol.md](claim-protocol.md). There is no separate signed event file for the user to download.

## Attendee workflow

1. Connect the wallet that the organizer used as the claim recipient.
2. Scan the QR while it is still valid. OpenMic checks its structure, recipient address, time window, and issuer signature.
3. On the first claim from that wallet, compare the full issuer address shown by OpenMic against the address shared separately by the organizer. If the organizer has not shared it, ask the organizer through a known channel before trusting the QR. A QR cannot authenticate its own issuer.
4. After independently checking the address, choose **I checked this address independently**. This records a local trust choice on this phone; it is not a global endorsement or proof of attendance.
5. Review the transaction details in the wallet before approving. The recording build uses Solana mainnet: it publishes the receipt permanently and pays a network fee, although it does not transfer SOL. OpenMic shows a receipt only after checking finality, signer, and exact memo contents against Solana RPC. Cancel if the wallet shows an unexpected account, transaction, memo, or fee.

## What this proves, and what it does not

- The QR signature proves that the private key corresponding to `issuerAddress` signed the exact claim fields.
- Comparing the address through a separate trusted channel helps establish that the key belongs to the event organizer.
- The recipient binding prevents another wallet from claiming that QR.
- The ten-minute expiry limits how long a copied QR can be used.
- A finalized Memo receipt proves that the attendee wallet submitted the claim data to Solana and that the transaction matches the expected message.
- The flow does not independently prove physical presence, globally prevent duplicate claims, or establish that CLOCK IN organizers endorsed an event. The issuer must check the attendee at the event and issue the QR to them.

## Honest CLOCK IN demo

If no CLOCK IN organizer provides an issuer key and attendee claims, demo OpenMic with an event whose organizer actually controls the connected wallet, and label it as an OpenMic sample event. Do not use CLOCK IN branding to imply organizer approval, and do not claim the sample receipt proves CLOCK IN attendance. To demonstrate an official CLOCK IN credential, obtain the organizer's public wallet address through a verified official channel and have an authorized organizer issue the attendee's signed claim.
