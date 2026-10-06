# Feasibility Spike Log

**Updated:** 2026-10-06 (Africa/Lagos). **Result: PARTIAL PASS; mainnet MWA gate remains open.** A signed release APK now builds and its SHA-256 is recorded below. ADB recognizes the physical TECNO KL5 (Android 14 / API 34), but Android currently blocks its installation. No MWA-compatible wallet, MWA authorization, user-approved mainnet transaction, or independent mainnet confirmation has been demonstrated. The complete event product is not implemented.

## Environment and pinned scaffold

| Component | Observed |
|---|---|
| Host | Windows 11; user freed disk space; about 27 GB was available before SDK/Gradle install. |
| Java | Eclipse Temurin OpenJDK 17.0.20.1 (`C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot`). |
| Node / npm | Node 24.18.0; npm 11.16.0. |
| React Native | 0.71.4; TypeScript 4.8.4; React 18.2.0. |
| MWA client | `@solana-mobile/mobile-wallet-adapter-protocol` and `...-web3js` 2.0.0. |
| Solana client | `@solana/web3.js` resolved to 1.75.0 from the lockfile. |
| Gradle wrapper | 7.5.1-all. |
| Android Gradle plugin | 7.3.1. |
| Android SDK | Compile SDK 33; build-tools 33.0.0; platform-tools installed. |
| Android Studio / emulator | Android Studio and emulator are not installed; command-line tools 22.0 and ADB are available. |
| Physical device | TECNO KL5 (`TECNO_KL5`), serial `12680154BX022793`, Android 14 / API 34. `adb devices -l` reports state `device`. Initial install was refused with `INSTALL_FAILED_VERIFICATION_FAILURE`; after the device setting was changed, streamed install succeeded and `com.clockinspike/.MainActivity` was observed as the top resumed activity. |
| Wallet | Solflare (`com.solflare.mobile`) was installed from its official Play listing. The app's MWA connect action returned `Found no installed wallet...` before installation; on retry, the user confirmed Solflare displayed an OpenMic connection request. User authorization is pending. |
| Solana CLI / Anchor | Not installed. A client Memo proof does not require either. |

The native foundation is based on [Solana Mobile's official dApp scaffold](https://github.com/solana-mobile/solana-mobile-dapp-scaffold). The supplied `demonchant/clockin` repository was empty at clone time. Source is under `clockin-app/ClockInSpike`.

## What was actually tested

- `npm.cmd install` completed; npm reported 44 vulnerabilities (1,343 packages audited: 5 low, 15 moderate, 21 high, 3 critical). This is not a security clearance.
- `npx.cmd tsc --noEmit` passed.
- `npm.cmd test -- --runInBand` passed, 2 suites / 6 tests. The verifier tests use fixture transaction objects and do not contact Solana; they are not live-integration evidence.
- Android SDK licenses were accepted after user authorization.
- `gradlew assembleDebug`: **BUILD SUCCESSFUL**, 22m 44s; debug APK was 56,959,647 bytes, SHA-256 `571F8E9D61343181BB22B5F74504E06A03A0E13A99696704A399F7CDD68E4759`. This earlier APK targets devnet and must not be used for the requested demo.
- The later mainnet release attempt first failed because AAPT2 timed out compiling an obsolete generated 8.3 MB scaffold image. The unused source image was removed and a clean rebuild completed successfully.
- Mainnet release APK (dark/amber UI, header status pill and dot removed): `ClockInSpike/android/app/build/outputs/apk/release/app-release.apk`; 19,659,434 bytes; SHA-256 `F9017ADB0C1EE3208A3303B5D2ED84B1BA3F658866B9C9AA23E0D356C3D212DE`. This newest APK builds successfully but has **not been installed**; the phone remains in Solflare to avoid interrupting the wallet flow. The prior dark/amber APK installed and launched on the physical phone. Release signing is local; clean-checkout build and distribution signing are not verified.
- `adb devices -l`: physical TECNO is visible. `adb install -r` was attempted and rejected by Android with `INSTALL_FAILED_VERIFICATION_FAILURE: Install not allowed for file:///data/app/vmdl1143386231.tmp`.
- After the phone's install-verification setting was changed, `adb install -r app-release.apk` returned **Success**. `adb shell monkey -p com.clockinspike 1` launched the app; `dumpsys activity` reported `com.clockinspike/.MainActivity` as top resumed.
- The on-device MWA connection attempt first returned `Found no installed wallet that supports the mobile wallet protocol.` Solflare was then installed by the user from its official listing. A later MWA invocation opened Solflare, and the user reported seeing an OpenMic connection request. This verifies app-to-wallet handoff, **not authorization**. The user's wallet decision is pending. The Solana Mobile MWA registry lists Solflare Android (`com.solflare.mobile`): https://github.com/solana-mobile/mobile-wallet-adapter-registry/blob/main/entries/solflare-android.json.
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
| Real compatible wallet authorizes application | **PENDING USER APPROVAL**. |
| User explicitly approves a mainnet transaction | **NOT RUN**. |
| Mainnet accepts transaction | **NOT RUN**. |
| Independent finalized RPC readback checks signer and memo | **NOT RUN**. |
| UI distinguishes submitted, pending, and independently verified live states on device | **NOT RUN**. |
| Complete issuer-authenticated event claim / passport workflow | **NOT IMPLEMENTED**. |

The current spike code constructs a Memo-program mainnet transaction, requests signing through MWA, submits it, and queries signature status/parsed transaction through RPC. **This describes code, not a tested integration.** It is a wallet/network feasibility screen, not an event claim. No event QR, issuer signature, event receipt, user event history, or durable crash recovery exists yet. No event is fabricated for demonstration.

## Next gate

On the TECNO, find Developer options and enable **Install via USB** (label/location may vary by HiOS build). Keep the phone unlocked and accept any install confirmation. This user-controlled device security setting is necessary because Android explicitly rejected the ADB install. Then rerun the install and verify the app opens on the phone. Install a real MWA-compatible wallet from its official source and confirm it appears as a wallet option. Only then can a user explicitly approve a clearly disclosed, low-value mainnet Memo transaction; the transaction writes a public memo and may consume a network fee. After approval, independently verify finalized status and the expected signer/memo by RPC. Do not perform this until the user has reviewed the wallet prompt and fee.

Following the spike: obtain a real issuer and genuine signed event payload, build the smallest complete event-claim flow without fixtures in the product, persist pending signatures, and verify live mainnet postconditions before showing confirmed. If no real issuer event payload is available, do not fake one or claim the event workflow is done.

**Status labels:** deterministic verifier tests **PASSED LOCALLY WITH FIXTURE OBJECTS**; mainnet release build **PASSED**; phone install and launch **PASSED**; real MWA handoff to Solflare **PASSED**; wallet authorization **PENDING USER APPROVAL**; mainnet transaction / independent readback **NOT RUN**; event product **NOT IMPLEMENTED**.
