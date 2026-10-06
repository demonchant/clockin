# Feasibility Spike Log

**Updated:** 2026-10-06 (Africa/Lagos). **Result: PARTIAL PASS; hard integration gate remains open.** The official React Native Solana Mobile scaffold builds a debug APK. No APK has yet been installed/launched on a phone; no real wallet/MWA session or live Solana transaction has been tested. Do not treat scaffold or unit tests as integration evidence.

## Environment and pinned scaffold

| Component | Observed |
|---|---|
| Host | Windows 11; user freed space and approximately 27 GB was available before SDK/Gradle install. |
| Java | Eclipse Temurin OpenJDK 17.0.20.1 (`C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot`). |
| Node / npm | Node 24.18.0; npm 11.16.0. |
| React Native | 0.71.4; TypeScript 4.8.4; React 18.2.0. |
| MWA client | `@solana-mobile/mobile-wallet-adapter-protocol` and `...-web3js` 2.0.0. |
| Solana client | `@solana/web3.js` resolved to 1.75.0 by installed lockfile. |
| Gradle wrapper | 7.5.1-all; downloaded and used successfully. |
| Android Gradle plugin | 7.3.1. |
| Android target | Compile SDK 33; build-tools 33.0.0 installed, and Gradle also installed build-tools 30.0.3. Platform-tools installed. |
| Android Studio / emulator | Not installed. Android command-line tools 22.0 and ADB are installed. Emulator is not available. |
| Physical device | User reports connecting an Android phone and enabling Developer options. `adb devices -l` still returned an empty device list. USB debugging/RSA authorization and device recognition remain open. |
| Solana CLI / Anchor | Not installed; not needed for this client-only Memo spike. |

Scaffold is based on [Solana Mobile's official dApp scaffold](https://github.com/solana-mobile/solana-mobile-dapp-scaffold). Supplied `demonchant/clockin` repository was empty at clone time. Source is under `clockin-app/ClockInSpike`.

## What was actually tested

- `npm.cmd install`: completed; 1,343 packages audited. npm reported 44 vulnerabilities (5 low, 15 moderate, 21 high, 3 critical); this is not a security clearance.
- `npx.cmd tsc --noEmit`: passed.
- `npm.cmd test -- --runInBand`: passed, 2 suites / 6 tests after configuring Jest for the scaffold's `uuid` ESM dependency. Transaction verification tests use fabricated parsed transaction objects and do not contact Solana.
- `sdkmanager --licenses`: reported Android SDK package licenses accepted after user authorization.
- `gradlew assembleDebug`: **BUILD SUCCESSFUL in 22m 44s**; 120 actionable tasks (115 executed, 5 up-to-date).
- Debug APK: `clockin-app/ClockInSpike/android/app/build/outputs/apk/debug/app-debug.apk`; 56,959,647 bytes. SHA-256: `571F8E9D61343181BB22B5F74504E06A03A0E13A99696704A399F7CDD68E4759`.
- `adb devices -l`: ADB server starts but reports no attached devices. The APK has not been installed or launched on a phone.

## Hard gate status

| Required proof | Result |
|---|---|
| Android APK builds | **PASSED** — debug APK produced; hash and size recorded above. |
| APK installs and launches on physical hardware | **NOT RUN** — ADB device list is empty. |
| App invokes MWA | **NOT RUN** — launch has not been possible. |
| Real compatible wallet authorizes app | **NOT RUN**. |
| Wallet explicitly signs devnet transaction | **NOT RUN**. |
| Devnet accepts the transaction | **NOT RUN**. |
| Independent finalized RPC query checks signer and memo | **NOT RUN**. |
| App distinguishes submitted, pending and verified live states | **NOT RUN**. |
| Physical-device submission requirement | **NOT PASSED** — an actual on-device run is mandatory. |

The current spike component constructs a Memo-program devnet transaction, asks MWA to sign, submits the signed bytes, then checks signature status and parsed transaction through RPC before displaying verified. This is **code present, not working evidence**. It lacks durable pending-signature recovery after app restarts and must not be presented as the final event-claim architecture yet.

## Next step and evidence still required

Turn on **USB debugging** separately from Developer options, unlock and reconnect the phone, accept the RSA authorization prompt, and resolve any OEM driver issue until `adb devices -l` shows its serial with status `device`. Install a real MWA-compatible wallet on that phone. Then install/launch this APK and exercise authorization, explicit devnet Memo approval, submission and independent finalized readback. No mock wallet or simulator can substitute for the required physical-device evidence.

Still required: phone model and Android version; real wallet name/version; MWA authorization and explicit approval recording; devnet transaction signature; independent finalized verification evidence; wallet rejection, unavailable-wallet, network outage, delayed finality and restart-recovery results; successful clean-checkout build.

**Status labels:** deterministic tests **TESTED LOCALLY (FIXTURE DATA)**; debug APK build **PASSED**; APK/device launch, MWA authorization, live wallet approval and Solana readback **UNKNOWN / NOT PASSED**.
