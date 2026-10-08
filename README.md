# OpenMic Passport

OpenMic Passport is a native Android event check in app built around wallet signed event claims on Solana.

An organizer creates a recipient bound, time limited event claim and presents it as a QR code. An attendee scans the claim, reviews the event and issuer details, approves the wallet transaction, and receives a verifiable passport receipt.

The core idea is simple:

**Create a claim → scan it → review it → approve it → verify the receipt on Solana**

## What is demonstrated

The submission provides a complete working Android flow:

1. An organizer connects a Solana wallet.
2. The organizer creates an event claim for a specific attendee wallet.
3. The organizer signs the claim with the connected wallet.
4. OpenMic presents the signed claim as a QR code.
5. The attendee scans the QR code using the Android app.
6. The attendee reviews the event, issuer, recipient, and expiry.
7. The attendee approves the receipt transaction through their wallet.
8. OpenMic checks the finalized Solana transaction.
9. The verified receipt is displayed in the attendee passport.

The demonstration was recorded on physical Android devices rather than an emulator.

## Demo and submission

**Demo video**

[OpenMic Demo](evidence/OpenMic_Demo.mp4)

1 minute 45 seconds showing the organizer and attendee flow, QR exchange, wallet approval, and verified receipt.

**Pitch deck**

[OpenMic Pitch Deck](evidence/OpenMic_Pitch_Deck.pdf)

Four slides covering the product, technical architecture, demonstrated flow, and trust model.

**Android APK**

[OpenMic Android APK 1.1.1](evidence/OpenMic_Android_1.1.1.apk)

Installable Android release tested on a TECNO KL5 running Android 14.

SHA 256:

`4B683B90C68EFD492BD564B6B7B0EA23490D755220D3A39F7A387FAC48AE4170`

## Why the wallet matters

OpenMic is not simply using a wallet as a login screen.

The wallet is part of the event claim and receipt protocol.

The organizer wallet signs a recipient bound claim containing the event information and expiry. The attendee then uses their wallet to approve the on chain receipt. OpenMic subsequently verifies the finalized Solana transaction before presenting the receipt.

This creates a clear separation between:

**Claim creation**

Organizer wallet signs the event claim.

**Claim presentation**

The signed claim is transferred through the QR code.

**Claim acceptance**

The attendee reviews the claim before approving it.

**Receipt verification**

OpenMic independently checks the finalized Solana transaction.

## Implementation

OpenMic is a native React Native Android application rather than a WebView.

### Mobile Wallet Adapter

Mobile Wallet Adapter handles wallet authorization and transaction signing. OpenMic never receives wallet private keys.

### QR scanning

QR scanning uses Google Play services Code Scanner through a native Android bridge.

### Signed claims

Claims are:

* Recipient bound
* Time limited
* Cryptographically signed
* Verified before presentation to the attendee

### Solana receipts

A Solana Memo records the claim receipt. OpenMic persists pending receipts and reconciles them against finalized mainnet transactions before displaying the verified result.

## Security and trust model

The application deliberately separates cryptographic verification from real world identity.

A valid issuer signature proves that the corresponding wallet signed the claim. It does not by itself prove the real world identity of the wallet controller.

Issuer trust is therefore explicit. The attendee can review the issuer address and decide whether to trust that issuer on the device.

The demonstrated claim is self issued for testing the complete protocol. No official CLOCK IN issuer key was provided for the demonstration, so the implementation does not make an unsupported sponsorship claim.

The same distinction applies to physical attendance. A signed QR claim can establish that a particular wallet accepted a particular claim, but a copied QR code by itself cannot prove that someone was physically present at a venue.

These are intentional trust boundaries rather than hidden assumptions in the system.

## Current transaction model

The receipt is recorded through a Solana Memo transaction.

The Memo does not transfer SOL between users. A network fee still applies when the transaction is submitted.

The application checks the finalized transaction and receipt fields before presenting the receipt as verified.

## Demo notes

The recorded demonstration uses an organizer wallet to issue a test event claim and an attendee wallet to accept it.

During the recorded run, Jupiter displayed a malicious app warning because the application was not yet registered in the relevant wallet or app directory. The warning is visible in the demonstration and does not represent a claim that the wallet integration itself is fraudulent.

The application is intended to be registered with the appropriate directory for publisher recognition.

## CLOCK IN hackathon alignment

OpenMic was built for the CLOCK IN Solana Mobile Hackathon requirements.

The submission includes:

* A functional Android APK
* GitHub source code
* A demonstration video
* A pitch deck
* Solana network interaction
* Mobile Wallet Adapter integration
* A mobile first Android experience
* A complete demonstrated check in flow

The application was tested on physical Android hardware and the demonstration shows the complete organizer to attendee flow from signed claim creation through on chain receipt verification.

The project focuses on building a trustworthy mobile primitive for event check ins rather than treating a wallet signature as proof of something it cannot actually prove.

## Build from source

Requirements:

* Node.js/npm
* JDK 17
* Android SDK Platform Tools
* Android SDK platform used by the project

```powershell
cd ClockInSpike
npm ci
$env:JAVA_HOME = 'C:\path\to\jdk-17'
$env:ANDROID_HOME = 'C:\path\to\Android\Sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
cd android
.\gradlew.bat assembleRelease
```

The APK is generated at:

```text
ClockInSpike/android/app/build/outputs/apk/release/app-release.apk
```

Build signing configuration is local and is not committed.

For implementation details, see:

[Claim protocol](ClockInSpike/docs/claim-protocol.md)

[Issuer and event setup](ClockInSpike/docs/issuer-and-event-setup.md)

## Project structure

```text
ClockInSpike/
├── android/
├── docs/
│   ├── claim-protocol.md
│   └── issuer-and-event-setup.md
├── evidence/
│   ├── OpenMic_Demo.mp4
│   ├── OpenMic_Pitch_Deck.pdf
│   └── OpenMic_Android_1.1.1.apk
└── ...
```

## Design principle

OpenMic is built around a simple rule:

**Show the claim. Let the user approve it. Verify the receipt.**

The application does not ask the wallet to prove more than a wallet signature can actually prove, and it verifies the final on chain result instead of treating an approval screen as the end of the process.
