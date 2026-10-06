# CLOCK IN Android build

This repository currently contains the official Solana Mobile React Native scaffold plus a **feasibility spike** for OpenMic Passport. The APK builds. Physical-device install, real MWA wallet authorization, live Solana transaction, and independent network verification have **not yet passed**. The event scanning/passport product is not implemented yet.

## Build the Android debug APK

Requirements used for the tested build: Windows 11, Eclipse Temurin JDK 17.0.20.1, Node 24.18.0 / npm 11.16.0, Android SDK platform 33, Android build-tools 33.0.0, Gradle wrapper 7.5.1, React Native 0.71.4, and the pinned dependencies in `ClockInSpike/package-lock.json`.

```powershell
cd ClockInSpike
npm ci
$env:JAVA_HOME = 'C:\path\to\jdk-17'
$env:ANDROID_HOME = 'C:\path\to\Android\Sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
cd android
.\gradlew.bat assembleDebug
```

The APK is written to `ClockInSpike/android/app/build/outputs/apk/debug/app-debug.apk`.

## Local checks

```powershell
cd ClockInSpike
npx tsc --noEmit
npm test -- --runInBand
```

The six passing unit tests exercise deterministic parsed-transaction verification with fixture objects. They are not proof of a live wallet or Solana transaction.

## Current spike behavior

The scaffold requests MWA authorization, asks a wallet to sign a small Memo-program transaction for **devnet**, submits it, then checks signature status and the parsed transaction. Its UI distinguishes wallet approval, submission, pending verification, and the local verifier's confirmed state. This is code that has built, not a verified live integration. Do not use mainnet funds or present the test memo as an event receipt.

## Known limits

- No QR/event issuer workflow, passport history, durable pending-transaction recovery, or replay/expiry policy is implemented.
- No phone is currently listed by `adb devices -l`; install and launch on a physical Android device are pending.
- No real compatible wallet, MWA approval, devnet signature, or independent live RPC result has been captured.
- The APK uses the debug signing key. No release signing configuration has been tested.
- Demo and pitch remain planned, not recorded or submitted.

See [`docs/feasibility-spike.md`](docs/feasibility-spike.md) for the evidence log and status. Claims must remain limited to evidence actually captured.
