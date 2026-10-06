# OpenMic mainnet demo walkthrough

This runbook is for a real wallet-to-wallet demonstration on Solana mainnet. It uses two user-controlled wallet accounts: the organizer signs a short-lived claim for the attendee address, then the attendee scans that QR and may submit a public Memo receipt.

The CLOCK IN organizers have not supplied an OpenMic issuer key or signed attendee claim. Use an accurately labeled OpenMic sample event unless an authorized CLOCK IN organizer provides and independently confirms the official key. A valid QR proves a wallet signed the claim; it does not prove physical attendance.

## What to prepare

- Two Android devices are the easiest setup. Install OpenMic and the Jupiter wallet on both. Use the organizer wallet on one device and the attendee wallet on the phone you will record. Jupiter is the only wallet reported to connect successfully on the TECNO so far; its connection still needs confirmation on the current mainnet release.
- If only the TECNO is available, generate the claim on it, capture its QR, display that QR on a separate laptop or phone screen, then scan it with the attendee flow on the TECNO. Record the organizer and attendee parts as separate portrait clips.
- Use real accounts controlled by the user. Never share a recovery phrase with OpenMic, a website, or the team. Check that the attendee account has enough mainnet SOL for the fee estimate shown by the app and Jupiter.
- The claim expires after ten minutes. Do one rehearsal first, then create a fresh claim immediately before recording.
- Keep the event name and issuer name free of personal details. The event ID, nonce, issuer address, claim text, and signature are public if the attendee submits the receipt.
- Compare the issuer address on the attendee review screen with the organizer address displayed separately on the organizer device. Do not trust the QR's own address as independent proof.

## Organizer: generate and display the QR

1. Open OpenMic on the organizer device and connect its Jupiter wallet. Confirm the intended organizer account is selected.
2. Open **I organize events → Issue a claim**.
3. Enter a truthful sample event name such as **OpenMic Live Sample**, an organizer label, and the attendee's public wallet address. Obtain that address from the attendee device's receive/copy-address screen; do not copy a seed phrase or private key.
4. Tap **Sign claim with wallet**. In Jupiter, review that this is a message-signing request for the OpenMic event claim and that it asks for no transfer. Approve only if the wallet shows the expected organizer account and claim. This message signature does not submit a transaction or charge a Solana fee.
5. OpenMic verifies the returned signature and displays the QR. Keep the organizer's full public address visible separately for the attendee's issuer check. Do not label the sample as an official CLOCK IN credential.

## Attendee: scan and verify

1. Start the portrait screen recording on the attendee phone. Turn on Do Not Disturb, lock orientation to portrait, and make sure the screen is bright enough for the camera to read the QR on the other display.
2. Open OpenMic and connect the attendee's Jupiter account. Confirm the displayed account is the recipient account used when the organizer created the claim.
3. Tap **Scan an event claim** and point the camera at the organizer QR on the second device or laptop. Keep the QR steady and fully inside the frame.
4. On **Review claim**, check the event, recipient, expiry, and full issuer address. Compare the issuer address with the value shown separately by the organizer. If anything differs, cancel.
5. After the comparison, tap **I checked this address independently**. This saves a local trust decision for that issuer on this device.
6. Tap **Estimate mainnet fee**. Review the estimated SOL fee, the attendee wallet address, and the memo fields OpenMic will publish. No SOL is transferred, but the fee is real and the memo is public and permanent.
7. Tap **Open Jupiter to review and approve**. In Jupiter, verify the recipient account, Solana mainnet, Memo transaction, and fee. Approve only if those details match the OpenMic review. Cancel if Jupiter shows an unexpected transfer, account, network, or fee.
8. Return to OpenMic. Wait for independent RPC verification. The app should show **FINALIZED · VERIFIED** only after mainnet reports finality and OpenMic confirms the signer and exact memo. Open the Solana Explorer link to show the public transaction.

If status stays pending, use **Check receipt status again**. Do not submit a second transaction while the first signature is unresolved.

## Three-minute recording outline

- **0:00–0:20:** Say this is an OpenMic sample event and show the real organizer and attendee wallets. State that the QR proves the issuer signed a recipient-bound claim, not physical attendance.
- **0:20–0:55:** Show the organizer entering the attendee's public address, approving the claim message in Jupiter, and displaying the signed QR.
- **0:55–1:35:** On the attendee phone, show Jupiter connected on mainnet, scan the QR from the separate screen, review the recipient and issuer, and compare the issuer key.
- **1:35–2:20:** Show OpenMic's mainnet fee estimate and transaction summary. Show Jupiter's final review. Approve only after checking the account, Memo, network, and fee.
- **2:20–3:00:** Show OpenMic's finalized verification and the matching mainnet Explorer transaction. Close by stating the public data and fee behavior accurately.

Record each device screen in portrait if you cannot record both at once, then cut between organizer and attendee footage in edit. Keep wallet prompts readable in the original footage. Do not add fake balances, staged approvals, edited transaction details, or claims of official CLOCK IN attendance. Send the original uncut phone captures when ready; the voiceover and edit can be built from those.
