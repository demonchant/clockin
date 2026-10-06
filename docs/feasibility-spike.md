# Feasibility Spike Log

**Updated:** 2026-10-06 (Africa/Lagos). Historical device evidence: one MWA authorization/account return and mainnet balance read on an earlier APK. The current Android-native claim-flow source now builds, passes TypeScript/Jest, and has been installed with Passport/History/Issue screens inspected on the TECNO. Current APK MWA authorization did not return an account. The historical paragraphs below document earlier states; the latest exact evidence and remaining blockers are at the end of this file.

## Environment and pinned scaffold

| Component | Observed |
|---|---|
| Host | Windows 11; user freed disk space; about 27 GB was available before SDK/Gradle install. |
| Java | Eclipse Temurin OpenJDK 17.0.20.1 (`C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot`). |
| Node / npm | Node 24.18.0; npm 11.16.0. |
| React Native | 0.71.4; TypeScript 4.8.4; React 18.2.0. |
| MWA client | `@solana-mobile/mobile-wallet-adapter-protocol` and `...-web3js` 2.2.0. |
| Solana client | `@solana/web3.js` resolved to 1.99.0 from the lockfile. |
| Gradle wrapper | 7.5.1-all. |
| Android Gradle plugin | 7.3.1. |
| Android SDK | Compile SDK 33; build-tools 33.0.0; platform-tools installed. |
| Android Studio / emulator | Android Studio and emulator are not installed; command-line tools 22.0 and ADB are available. |
| Physical device | TECNO KL5 (`TECNO_KL5`), serial `12680154BX022793`, Android 14 / API 34. `adb devices -l` reports state `device`. Initial install was refused with `INSTALL_FAILED_VERIFICATION_FAILURE`; after the device setting was changed, streamed install succeeded and `com.clockinspike/.MainActivity` was observed as the top resumed activity. |
| Wallet | Solflare (`com.solflare.mobile`) was installed from its official Play listing. On the latest run, MWA returned an account to OpenMic and the app fetched its mainnet balance. |
| Solana CLI / Anchor | Not installed. A client Memo proof does not require either. |

The native foundation is based on [Solana Mobile's official dApp scaffold](https://github.com/solana-mobile/solana-mobile-dapp-scaffold). The supplied `demonchant/clockin` repository was empty at clone time. Source is under `clockin-app/ClockInSpike`.

## What was actually tested

- `npm.cmd install` completed; npm reported 44 vulnerabilities (1,343 packages audited: 5 low, 15 moderate, 21 high, 3 critical). This is not a security clearance.
- `npx.cmd tsc --noEmit` passed.
- MWA packages were upgraded to 2.2.0. The installed 2.0.0 native bridge had a timeout path that threw `ExecutionException` across the React Native bridge; device history contains a resulting fatal app crash. The 2.2.0 bridge rejects timeout errors through the promise instead. The app entry now imports a small early polyfill module so Hermes has the `TextEncoder`/`TextDecoder` globals required by the updated JS dependencies.
- Release build after the MWA and polyfill changes: **BUILD SUCCESSFUL** (Gradle 7.5.1 / AGP 7.3.1). `npx.cmd tsc --noEmit` passed after the dependency update.
- Latest release APK: `ClockInSpike/android/app/build/outputs/apk/release/app-release.apk`; 19,969,150 bytes; SHA-256 `3ACB67CE82678E8EC117243B783004547C1736C779688489DD7F2D424260ABFE`. ADB install returned `Success`; the app launched without the prior `TextEncoder` startup crash.
- MWA authorization retest on the updated APK: tapped Connect once; Solflare opened; OpenMic returned to foreground and displayed `Main Wallet`, a shortened public key, and `0.0802 SOL` from the mainnet balance query (device screenshot at approximately 06:11 Africa/Lagos, 2026-10-06). This is observed account-return evidence, not transfer evidence. No wallet transaction was initiated.
- `npm.cmd test -- --runInBand` passed, 2 suites / 6 tests. The verifier tests use fixture transaction objects and do not contact Solana; they are not live-integration evidence.
- Android SDK licenses were accepted after user authorization.
- `gradlew assembleDebug`: **BUILD SUCCESSFUL**, 22m 44s; debug APK was 56,959,647 bytes, SHA-256 `571F8E9D61343181BB22B5F74504E06A03A0E13A99696704A399F7CDD68E4759`. This earlier APK targets devnet and must not be used for the requested demo.
- The later mainnet release attempt first failed because AAPT2 timed out compiling an obsolete generated 8.3 MB scaffold image. The unused source image was removed and a clean rebuild completed successfully.
- Previous release APK (dark/amber UI; header MAINNET indicator and dot removed): 19,659,561 bytes; SHA-256 `FE30E25EB91FB8DA1DE03559105B1BD7ED32591D5EED4D1F2A6769DF7C2EFCEF`. The current APK and its successful authorization retest are recorded above. Release signing is local; clean-checkout build and distribution signing are not verified.
- `adb devices -l`: physical TECNO is visible. `adb install -r` was attempted and rejected by Android with `INSTALL_FAILED_VERIFICATION_FAILURE: Install not allowed for file:///data/app/vmdl1143386231.tmp`.
- After the phone's install-verification setting was changed, `adb install -r app-release.apk` returned **Success**. `adb shell monkey -p com.clockinspike 1` launched the app; `dumpsys activity` reported `com.clockinspike/.MainActivity` as top resumed.
- An earlier MWA attempt opened Solflare but did not return an account. A later failed build revealed a Hermes `TextEncoder` startup crash after the package upgrade; the early polyfill import fixed that launch issue. On the latest updated APK, Solflare authorization did return an account and mainnet balance to OpenMic. The Solana Mobile MWA registry lists Solflare Android (`com.solflare.mobile`): https://github.com/solana-mobile/mobile-wallet-adapter-registry/blob/main/entries/solflare-android.json.
- The redesigned build uses a dark field-terminal palette with signal amber and cyan status accents, derived from the event page's “Radiants Unified Field Terminal”/“CLOCK IN OS” framing. This is an app design choice, not a claim that these exact colors are mandated by the event.
- In the newest source/build, the header `MAINNET` pill and its dot have been removed at the user's request. Transaction-level network and fee disclosures remain visible.
- Device reports Android 14 / API 34. A package-list check for common wallet names returned no match for user 0.

## Hard gate status

| Required proof | Result |
|---|---|
| Mainnet Android APK builds | **PASSED**; hash and size recorded above. |
| APK installs on physical hardware | **PASSED**; ADB streamed installation returned `Success`. |
| APK launches on physical hardware | **PASSED**; top resumed activity is `com.clockinspike/.MainActivity`. |
| App invokes MWA and reaches a compatible wallet | **PASSED**; user confirms Solflare connection prompt appeared. |
| Real compatible wallet authorizes application and returns an account | **PASSED ONCE** on the current local release APK; account label, redacted public key, and live balance rendered in OpenMic. Process-restart recovery remains unverified. |
| User explicitly approves a mainnet transaction | **NOT RUN**. |
| Mainnet accepts transaction | **NOT RUN**. |
| Independent finalized RPC readback checks signer, recipient, and lamports | **NOT RUN**. |
| UI distinguishes submitted, pending, and independently verified live states on device | **NOT RUN**. |
| Complete issuer-authenticated event claim / passport workflow | **NOT IMPLEMENTED**. |

The current spike code constructs a mainnet System Program transfer of 8,271,983 lamports (approximately $1 based on the October 6, 2026 SOL/USD snapshot shown in the app), requests signing through MWA, submits it, and checks finalized status plus signer/recipient/amount through RPC. **This describes code, not a tested integration.** No transfer has been submitted. This is a wallet/network feasibility screen, not an event claim. No event QR, issuer signature, event receipt, user event history, or durable crash recovery exists yet. No event is fabricated for demonstration.

## Next gate

The MWA authorization/account-return gate passed once on the current local APK. The account is held only in memory, so restart recovery remains a gap. Do not start the separate SOL transfer unless the user explicitly elects to proceed after reviewing the exact recipient, 8,271,983-lamport amount, and additional fee. If approved, verify finalized status and the expected signer/recipient/amount independently through mainnet RPC. Do not label the event workflow complete on the basis of this transfer spike.

Following the spike: obtain a real issuer and genuine signed event payload, build the smallest complete event-claim flow without fixtures in the product, persist pending signatures, and verify live mainnet postconditions before showing confirmed. If no real issuer event payload is available, do not fake one or claim the event workflow is done.

**Historical status labels:** earlier fixture memo-verifier test passed; an earlier APK authorized MWA once and displayed a live mainnet balance; the old System Program transfer was never run. See the latest status below for current-source evidence.

## Current implementation after the handoff

The former hardcoded SOL transfer button was removed from the app. Current untested source adds:

- Android QR scanning via Google Play services Code Scanner and a React Native native module.
- Versioned recipient-bound claim parsing with issuer-key allowlisting, Ed25519 signature verification, size/schema checks, and issue/expiry-window checks. The trusted issuer registry is empty until the organizer supplies its real public key.
- Passport home, claim review, explicit wallet handoff, receipt status, and local history screens.
- AsyncStorage persistence for the MWA reauthorization token/account metadata and receipt attempts. The transaction signature is saved before RPC submission for later reconciliation.
- Mainnet RPC checks for finality, transaction error, signer, and exact memo contents.
- `ClockInSpike/docs/claim-protocol.md`, which specifies the input needed from a real issuer and documents the current limits.

The old implementation summary above is superseded by the latest record below.

## Latest source/build/device record — 2026-10-06

- TypeScript `tsc --noEmit`: passed.
- Jest: 3 suites / 11 tests passed (event claim verification, receipt parsing, and app navigation/rendering; no live wallet/RPC integration).
- `assembleRelease`: passed after pinning the compatible `rpc-websockets` version and correcting Code Scanner package imports.
- APK installed/launched on TECNO KL5 / Android 14. Passport, History, and Issue screens plus bottom navigation rendered. No WebView is used.
- MWA test on this APK: tapping Connect launched Solflare; it showed the wallet home and returned no authorized account. Backing out showed cancellation. No account authorization is verified on this source build. The prior success belongs to an earlier binary.
- The native scanner, issuer signature prompt, scanned claim review, transaction approval, and finalized receipt have not been walked through on device. No event claim or transaction has been signed/sent.
- Latest APK: 49,219,899 bytes; SHA-256 `D6CDF5B6CE5A9AE7E21ACEC982D68CFCE9693684661F0A2386E179EA1F9644BC`. Signing certificate SHA-256 `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c` is a debug key, not suitable for distribution.
- MWA Android app identity depends on a domain Digital Asset Links proof that lists the package and certificate. Source now targets `https://demonchant.github.io`; the installed APK predates this URI change. The root-site content is prepared in `github-pages-identity-site/`, including `/.well-known/assetlinks.json` for this debug certificate, but the `demonchant/demonchant.github.io` repository is not available in the current GitHub session and the host has not been published. After the user creates the public root Pages repository, publish the bundle contents there, verify the JSON returns HTTP 200, rebuild/reinstall, and retry authorization. The debug certificate is for development only; distribution requires a stable release signing key and matching asset-links fingerprint. See [official MWA Android identity requirements](https://github.com/solana-mobile/mobile-wallet-adapter/blob/main/spec/spec.md#android).
- The app lets a wallet self-issue test claims, but no official event issuer was supplied or verified. The Memo receipt does not enforce global uniqueness and does not prove physical presence. Mainnet claim submission costs a network fee; it was not attempted.

## MWA identity host and retry — 2026-10-06

- Published the contents of `github-pages-identity-site/` to the new public `demonchant/demonchant.github.io` repository on `main` (root commit `eb96ae5`). GitHub Pages serves `https://demonchant.github.io/.well-known/assetlinks.json` with HTTP 200 and `Content-Type: application/json`.
- Google's Digital Asset Links statements API returns the expected `com.clockinspike` package and debug signing fingerprint. This independently verifies the hosted identity statement.
- Rebuilt release APK after setting the source app identity to `https://demonchant.github.io`; `assembleRelease` succeeded. APK SHA-256: `02CA90E54218EC93BAC0338DF99E98DD0613B2451D2CA4CF93337F2987DE174E`. APK signing fingerprint matches the hosted statement.
- Installed/launched this APK on the TECNO. Tapping Connect opened Solflare, but only its ordinary wallet home appeared. The local MWA WebSocket connection was refused; returning to OpenMic ended the session and displayed the cancellation message. No account was authorized, and no message or transaction was signed or sent.
- Therefore the domain/DAL mismatch is resolved, but MWA still fails on-device. Next diagnose Solflare's MWA intent/session handling, package/version, and native association logs against the official protocol. Do not repeat submission tests or claim authorization until OpenMic displays the returned account and balance.
- Distribution signing remains unresolved: this APK still uses the debug key. The debug fingerprint is appropriate only for this development build.
