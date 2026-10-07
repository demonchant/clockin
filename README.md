# OpenMic Passport

OpenMic is a mobile check-in app for wallet-signed event claims. An organizer creates a recipient-bound, expiring claim and shows it as a QR code. The attendee scans the event QR, reviews the issuer and claim, approves a wallet transaction, and gets a receipt that OpenMic checks against Solana mainnet.

The demo uses an organizer's own wallet to issue a test claim. It does not claim that the event was sponsored by CLOCK IN or that a particular person was physically present.

## Demo and submission files

- [Portrait demo video](evidence/OpenMic_Demo.mp4) — 1 minute 45 seconds; shows the organizer QR and attendee scan together, followed by the attendee review and receipt flow.
- [Pitch deck](evidence/OpenMic_Pitch_Deck.pdf) — four-slide product and technical overview, including the test-claim and trust boundaries.
- [Android APK, version 1.1.1](evidence/OpenMic_Android_1.1.1.apk) — installable release build tested on a TECNO KL5 running Android 14. SHA-256: `4B683B90C68EFD492BD564B6B7B0EA23490D755220D3A39F7A387FAC48AE4170`.

The demo is captured from Android devices, not an emulator. The project team reports that its security review is complete. Jupiter displayed a malicious-app warning during the recorded run; the team plans to register OpenMic with the wallet/app directory for publisher recognition. The warning remains visible in the demo until registration and wallet behavior are confirmed. The captured claim transaction is a Memo with no SOL transfer; a network fee still applies. Review the exact wallet prompt before approving it.

## What the demonstrated flow does

1. The organizer connects a Solana wallet and enters the event and attendee wallet details.
2. The organizer wallet signs a short-lived claim addressed to that attendee; OpenMic displays the signed claim as a QR code.
3. The attendee connects a wallet and scans the event QR.
4. OpenMic displays the event, issuer, recipient, and expiry for review. The attendee can choose whether to trust that issuer key on this device.
5. The attendee reviews and approves the Memo transaction in their wallet. OpenMic checks the finalized mainnet transaction and receipt fields before showing the result in the passport.

## Implementation

- React Native Android UI with Passport, History, and Issue screens; the app is not a WebView.
- Mobile Wallet Adapter requests wallet authorization and signing. OpenMic does not receive wallet private keys.
- QR scanning uses Google Play services Code Scanner through a native Android bridge.
- The signed claim is recipient-bound and time-limited. The app verifies the issuer signature before presenting it for approval.
- A Solana Memo records the claim receipt. The app persists pending receipts and reconciles them against finalized mainnet transactions.

## Trust and design limits

- The organizer claim in the demo is self-issued. CLOCK IN did not supply an official issuer key or signed event claim, so the demo makes no CLOCK IN sponsorship claim.
- A valid signature shows that the issuer wallet signed the claim. It does not establish the wallet controller's real-world identity.
- Issuer trust is a local user choice. Attendees should verify the issuer address through a separate trusted channel.
- A QR can be copied. This design does not enforce global one-time use or prove physical presence at an event.
- Do not put attendee personal data in a claim. A network fee applies when an attendee records a receipt, even though the Memo transaction transfers no SOL.

## Build from source

Requirements: Node.js/npm, JDK 17, and Android SDK Platform-Tools plus the Android platform used by the project.

```powershell
cd ClockInSpike
npm ci
$env:JAVA_HOME = 'C:\path\to\jdk-17'
$env:ANDROID_HOME = 'C:\path\to\Android\Sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
cd android
.\gradlew.bat assembleRelease
```

The APK is written to `ClockInSpike/android/app/build/outputs/apk/release/app-release.apk`. Build signing configuration is local and is not committed. See [the claim protocol](ClockInSpike/docs/claim-protocol.md) and [issuer and event setup](ClockInSpike/docs/issuer-and-event-setup.md) for implementation details.

## CLOCK IN entry alignment

The [Solana Mobile announcement](https://solanamobile.com/blog/clock-in-the-solana-mobile-hackathon) requests a functional Android APK, GitHub source repository, demo video, and pitch deck or short presentation. This repository includes all four. The demo is under three minutes and shows the app running on Android phones. Winners will have time after results to prepare dApp Store publication.

The announcement lists judging around product-market fit and stickiness, user experience, innovation, and presentation. This submission demonstrates the mobile flow and its wallet/chain integration; the self-issued test run does not establish adoption or official event sponsorship.
