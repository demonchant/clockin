# OpenMic Passport — CLOCK IN submission

OpenMic Passport is intended to let people keep issuer-authenticated, independently verifiable records of events they participate in. **The event claim/passport product is not implemented yet.** The current app is only an Android/MWA/mainnet feasibility screen. It must not be presented as an event receipt product.

## Current implementation and evidence

- Native Android application built from Solana Mobile's React Native dApp scaffold.
- A mainnet-only Memo transaction flow is present in source. Its real MWA authorization, wallet signing, submission, finality, and independent verification are **not yet proven**.
- Mainnet release APK builds: `ClockInSpike/android/app/build/outputs/apk/release/app-release.apk` (19,659,717 bytes; SHA-256 `9C5898748A4DF9CEA6AA88E4B91A06BB3B94F2B1BAFB22478C91C7CA85492C1A`).
- ADB sees a physical TECNO KL5 running Android 14 / API 34. The rebuilt release APK has been installed and launched (`com.clockinspike/.MainActivity`). Its current SHA-256 is `C308508781A4E1B7CF70321280FBF7AC17B201D5F6CDF6E7CEB34BD7DAB02D53`.
- Solflare is installed. The app's real MWA handoff reached Solflare and the user reports an OpenMic connection request. Wallet authorization is still pending; no transaction has been signed or submitted.
- No event QR, issuer, attendance claim, event receipt, or passport history is live.
- **No testnet flow or mock transaction is intended for the submission.** Unit tests do use fixture transaction objects to exercise deterministic verifier logic; these tests are not represented as live evidence.

## Build the Android release APK

Versions used: Windows 11, Eclipse Temurin JDK 17.0.20.1, Node 24.18.0 / npm 11.16.0, Android compile SDK 33, build-tools 33.0.0, Gradle wrapper 7.5.1, Android Gradle Plugin 7.3.1, React Native 0.71.4, and dependencies pinned in `ClockInSpike/package-lock.json`.

```powershell
cd ClockInSpike
npm ci
$env:JAVA_HOME = 'C:\path\to\jdk-17'
$env:ANDROID_HOME = 'C:\path\to\Android\Sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
cd android
.\gradlew.bat assembleRelease
```

The APK is written to `ClockInSpike/android/app/build/outputs/apk/release/app-release.apk`. A clean checkout build and production distribution signing still need verification.

## Local deterministic checks

```powershell
cd ClockInSpike
npx tsc --noEmit
npm test -- --runInBand
```

The two suites / six tests cover deterministic validation with fixture data. They do not prove wallet interoperability, mainnet submission, or an on-chain event record.

## What remains before this is a submission

1. Enable the device's user-controlled USB install setting and install/launch the APK on the TECNO.
2. Install a genuine MWA-compatible wallet from its official source.
3. With the user reviewing and explicitly approving the wallet prompt and disclosed fee, verify an actual mainnet MWA transaction and independent finalized RPC readback.
4. Obtain a real event and issuer-signed payload; implement the native scan, validation, claim, durable pending state, verified receipt, and replay/expiry handling against live mainnet only.
5. Record failure behavior, physical-device evidence, demo video (maximum three minutes), pitch deck, and final submission links.

No claim that an event has been attended or physically verified is supported. See [`docs/feasibility-spike.md`](docs/feasibility-spike.md) for the evidence log. Submission eligibility and completeness have not been established.
