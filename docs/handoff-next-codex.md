# OpenMic Passport — handoff for the next Codex

**Updated:** 2026-10-06 (Africa/Lagos, UTC+1)
**Repository:** `https://github.com/demonchant/clockin`
**Working directory:** `C:\Users\pinch\Downloads\clock in\clockin-app`
**Branch:** `main`; the last committed revision is `5ca7958`. Current work has uncommitted changes.
**Purpose:** resume implementation at the real-wallet feasibility gate without repeating completed event research or mistaking the transfer spike for the product.

## Read these first

1. [`../HACKATHON_BUILD_STANDARD_V2.md`](../HACKATHON_BUILD_STANDARD_V2.md) — governing project procedure. Apply its hardest-promise, operational-depth, evidence, claim-to-proof, pivot, and final submission gates.
2. [`hackathon-analysis.md`](hackathon-analysis.md), [`rubric-matrix.md`](rubric-matrix.md), [`dependency-audit.md`](dependency-audit.md), [`competitive-analysis.md`](competitive-analysis.md), and [`demo-script.md`](demo-script.md) — prior event/research/planning artifacts. Update facts only when implementation or official sources change; do not redo the full forensic phase.
3. [`feasibility-spike.md`](feasibility-spike.md) and [`../README.md`](../README.md) — latest build and device evidence. Check these against current source before repeating any claim.
4. Inspect `git status --short` and `git diff` before editing. Five files were modified but not committed at handoff (see below).

## User constraints that remain in force

- The deliverable is a real Android mobile app for CLOCK IN. No PWA/WebView substitute.
- The user explicitly rejected testnet and mock product/demo behavior. Do not put testnet or a fake live flow into the submission. Deterministic local fixtures may be used only for tests and must never be described as live evidence.
- Do not claim an MWA authorization, transaction, finalized result, event claim, or attendance until it is actually observed and independently verified.
- Never sign or submit a mainnet transaction on the user's behalf. The user must inspect and approve the actual wallet request. Do not repeat the earlier ~$1 transfer just to get a demo artifact without their explicit current approval.
- Do not expose, repeat, or commit the user's destination wallet address unnecessarily. It is currently hardcoded in the spike source. Review/remedy that before publishing source changes; it is a public address but is user-provided personal transaction data.
- No unnecessary questions, decoration-first work, fake integrations, unsupported claims, or forced AI/SKR/ORE. ORE is an optional single matched prize, not a required integration. It is not currently integrated.
- The user has asked for a strong UI and a polished animated demo, but only after the central product mechanism is real and provable. Demo length is at most three minutes under the latest rules they supplied.

## Product and hard-gate status

**Intended product:** OpenMic Passport — a mobile-first way for people to keep issuer-authenticated, independently verifiable records of events they participate in. A real event issuer produces a signed, short-lived claim; the attendee reviews it, explicitly authorizes a wallet action through MWA, and receives a record only after a Solana postcondition is independently checked. Never claim that a QR scan proves physical attendance.

**Current app is only a feasibility screen. It is not OpenMic Passport yet.** The app currently offers wallet connection and a mainnet SOL transfer spike. It has no event QR scanner, genuine issuer, issuer signature validation, event claim, durable passport history, or crash recovery.

**Hardest promise / gate:** a real user on the physical Android device authorizes OpenMic with MWA, explicitly approves an appropriate mainnet operation, and OpenMic independently verifies the finalized Solana postcondition before displaying success. The gate is still **OPEN / NOT PASSED**:

| Capability | Evidence-backed status |
|---|---|
| React Native Android release APK builds | **VERIFIED** for this local environment/build (not a clean checkout build) |
| APK installs on the physical TECNO KL5 | **VERIFIED** by ADB `Success` |
| App process launches on device | **VERIFIED**; updated app launched and rendered on the TECNO |
| MWA intent opens Solflare | **VERIFIED** as handoff only |
| Solflare authorizes OpenMic and returns an account | **VERIFIED ONCE** on the current local APK; OpenMic displayed the account label, shortened key, and live balance |
| Mainnet transaction approved/submitted/finalized | **NOT RUN** |
| Independent live RPC postcondition | **NOT RUN** |
| Event passport core workflow | **NOT IMPLEMENTED** |

Do not treat the user's earlier report of seeing/approving a connection prompt as authorization evidence: the recorded MWA call did not return an authorized account, and the latest app build has not yet been retested.

## Current mainnet spike — not the product

`ClockInSpike/components/SignTransactionButton.tsx` currently prepares a System Program transfer of **8,271,983 lamports (0.008271983 SOL)**. The UI labels that “about $1” using a fixed October 6, 2026 price snapshot of $120.89/SOL; the network fee is additional and the fiat estimate is not live. The destination is hardcoded in this file from a user-supplied address. The MWA flow is coded to authorize, ask for signature, submit to `mainnet-beta`, check finality, fetch the parsed transaction, and compare signer/destination/lamports.

Those are **code paths, not a proven integration**. No transaction has been signed or sent, and no signature exists. A wallet transfer is only an integration spike; do not present it as an event participation record or as a compelling finished product. It is also not safe to reuse without checking the destination, amount, quote, current account balance, and explicit user consent again.

The attempted approach to wallet connection is in `ClockInSpike/components/ConnectButton.tsx`; identity is in `ClockInSpike/components/providers/AuthorizationProvider.tsx`; the RPC selector is `ClockInSpike/components/providers/ConnectionProvider.tsx` and currently uses `mainnet-beta`.

## Environment and reproducible build facts

- Host: Windows 11; Android Studio/emulator not installed.
- Device: physical TECNO KL5, Android 14 / API 34, serial is documented in the local feasibility log. `adb devices -l` previously reported `device`.
- Wallet: Solflare Android installed from its official Play listing; package `com.solflare.mobile`. Solflare is in the Solana Mobile MWA registry. Account authorization and return were verified once on the current local build.
- JDK: Temurin 17.0.20.1; Node 24.18.0; npm 11.16.0; React Native 0.71.4; TypeScript 4.8.4; `@solana-mobile/mobile-wallet-adapter-protocol*` 2.2.0; `@solana/web3.js` 1.99.0; Gradle wrapper 7.5.1; Android Gradle Plugin 7.3.1; compile SDK 33; build tools 33.0.0. See `ClockInSpike/package-lock.json` and `docs/feasibility-spike.md` for details.
- Android SDK was installed under `%TEMP%\clockin-android-sdk\sdk` on the prior machine/session. Set `ANDROID_HOME` and `ANDROID_SDK_ROOT` to the actual SDK path before Gradle. The old environment used an external writable Gradle cache; paths may differ in another Codex account.
- Latest local release APK: `ClockInSpike/android/app/build/outputs/apk/release/app-release.apk`; 19,969,150 bytes; SHA-256 `3ACB67CE82678E8EC117243B783004547C1736C779688489DD7F2D424260ABFE`. Release build, ADB install, launch, and one MWA account return succeeded locally. This hash applies only to that exact local binary; rebuilds change it. Local release signing is not verified for distribution, nor is a clean-checkout build.
- The current source TypeScript check passed before this handoff. Do not claim tests after the last edits: historical `2 suites / 6 tests` exercise an older fixture-based memo verifier, not the current transfer verifier or live MWA. The scaffold previously reported 44 npm audit vulnerabilities; no security clearance has been performed.
- To build in PowerShell, from `ClockInSpike` run `npm ci`; set `$env:JAVA_HOME`, `$env:ANDROID_HOME`, `$env:ANDROID_SDK_ROOT`; then from `android` run `./gradlew.bat assembleRelease`. Use the actual installed paths. Prior Gradle cache/sandbox restrictions may require approved execution. Do not run builds that overwrite/reinstall the APK while the user is actively handling a wallet prompt.

## Workspace handoff state

Last commit: `5ca7958 Record live Solflare handoff and header update build`. Recent history includes removal of the header network pill/dot and the mainnet scaffold transition. `origin` is `https://github.com/demonchant/clockin.git`.

At the time this file was written, these files were modified and uncommitted:

- `ClockInSpike/components/ConnectButton.tsx` — cancellation/error feedback updated.
- `ClockInSpike/components/SignTransactionButton.tsx` — transfer spike substituted for old Memo spike; postcondition verifier updated; no network pill/dot.
- `ClockInSpike/components/providers/AuthorizationProvider.tsx` — dApp identity changed to OpenMic Passport and repository URI.
- `README.md` — current status and test limitations corrected.
- `docs/feasibility-spike.md` — evidence log corrected for latest state.

This handoff file is a new file. Review all these diffs; keep useful changes, correct any stale wording, and commit in meaningful units only after reviewing. The repository root currently contains the initial planning docs. Do not fabricate history or stage secrets/keys.

## Official event facts supplied by the user

The event is CLOCK IN, Solana Mobile/Radiants, mobile category. Latest user-provided schedule: submissions opened Sep 8, 2026; deadline **Oct 9, 2026 at 7:59 AM GMT+1**; judging Oct 10–Nov 9; winners Nov 11. This is roughly two days from the handoff date. A working build must run on a device (simulator-only video is not a submission), repo must be cloneable/runable, and demo is three minutes. Submission also requires pitch deck/brief presentation. The event page requires Android, Solana Mobile Stack (SMS), Mobile Wallet Adapter, mobile-first design, and meaningful Solana network interaction.

The judge rubric supplied by the user is four equally weighted rows: **Stickiness & Product-Market Fit (25%)**, **User Experience (25%)**, **Innovation / X-Factor (25%)**, **Presentation & Demo (25%)**. Evaluation also looks at demo completion, GitHub commits for technical depth, mobile features/optimization, network interaction, and clarity/vision. Do not invent another scoring rubric.

User-supplied eligibility/prize rules: project started within three months of launch; existing projects allowed only with significant new mobile work; teams without VC/angel funding eligible for USDC prizes; one submission per contestant; false/misleading statements can disqualify; eligible-country list and registration state must be checked. dApp Store publication is not required by deadline but winners must publish within 30 calendar days after announcement to claim cash. Verify these against the live official rules if browsing/tools are available before submission, since registration, team status, exact cutoff, country, funding, and any late rule changes are not yet confirmed locally.

## Resume audit (October 6, 2026)

- Read this handoff and `../HACKATHON_BUILD_STANDARD_V2.md`; reviewed the repository state and uncommitted changes.
- The Solana Mobile Adapter specification allows native wallets to verify dApp identity through Digital Asset Links. The current app still uses the same GitHub repository URI, and Solflare successfully returned an account on the latest run. Therefore, a missing Digital Asset Links file did not block this successful run; it was not proven to cause the earlier cancellation. Solflare may use an implementation-specific verification policy. [MWA protocol specification](https://github.com/solana-mobile/mobile-wallet-adapter/blob/main/spec/spec.md).
- The existing identity URI is `https://github.com/demonchant/clockin`. No Digital Asset Links file can be served from GitHub's `github.com` origin by this project. A GitHub Pages root at `https://demonchant.github.io` was not available when checked (`demonchant.github.io` repository not found); a project Pages URL under `/clockin` has not been shown to satisfy the host-root `/.well-known/assetlinks.json` lookup. Therefore, do not present GitHub Pages as configured or the cause as confirmed. A Pages deployment alone is not yet a verified remedy.
- A prior device run showed Android killing OpenMic's background process for low memory while Solflare was in front. An earlier MWA timeout also triggered a fatal native crash: MWA 2.0.0 threw an `ExecutionException` instead of rejecting the React Native promise. The updated MWA 2.2.0 bridge rejects the timeout; the app also needs an early `TextEncoder`/`TextDecoder` polyfill for Hermes.
- Updated `@solana-mobile/mobile-wallet-adapter-protocol` and `...-web3js` to 2.2.0, added `ClockInSpike/polyfills.js`, and updated the React Native entry import order. Release build and `npx tsc --noEmit` passed. The current APK is 19,969,150 bytes, SHA-256 `3ACB67CE82678E8EC117243B783004547C1736C779688489DD7F2D424260ABFE`.
- **MWA authorization/account return is now VERIFIED once** on the updated APK: tapped Connect, Solflare opened, then OpenMic resumed and displayed the `Main Wallet` label, a truncated public key, and a live `0.0802 SOL` mainnet balance (approximately 06:11 Africa/Lagos). This demonstrates actual account return. The account/auth token remains in memory and is not persisted across process restarts. No transfer was initiated or signed.
- The physical phone remains attached over ADB and OpenMic is foregrounded with the connected-account card. `svc power stayon usb` was enabled for the retest; turn it off after device work with `adb shell svc power stayon false`.
- Corrected a stale MainScreen notice that still called the current spike a memo; it now describes the SOL transfer accurately and discloses that no transfer was made.

Next action: do not repeat the connect flow unless it disconnects. Move to the product gate: find a real issuer and authentic signed event payload, or narrow/pivot the product honestly. Keep the separate mainnet transfer off unless the user explicitly approves it after reviewing all details.

## Immediate resume checklist (execute in this order)

### 1. Re-establish truthful state

- Read the standard and documents listed above; inspect `git diff`.
- Check the device is still attached/unlocked, run read-only `adb devices -l`, and visually check what screen is open. The phone was asleep during a prior screenshot. Don’t reboot or reinstall while the wallet is open.
- The current local build has returned a genuine Solflare account once; the connected card showed a partial public key and mainnet balance. If connection is lost, retry and record the result; do not infer future connection from a previous successful attempt. No need to ask for any seed phrase or private key.

### 2. Keep the transaction a user-approved spike

- Do not initiate the transfer automatically. Only proceed if the user explicitly elects to use the already requested low-value transfer after they have reviewed the exact recipient, lamports/SOL, fee, and current Solflare confirmation screen.
- If approved and submitted, independently query **mainnet-beta** from outside the app/RPC success callback. Require finalized status, no `meta.err`, expected signer, exact recipient and lamports. Save signature, slot, timestamp, RPC endpoint/provider, and explorer link. Keep pending distinct from confirmed. If anything is ambiguous or RPC is down, leave it pending/failed and do not declare success.
- Persist pending signature before or immediately when the app knows it, then recover after process restart. The current `attempt` is only in memory; this is a known gap. Avoid sending a second transfer on retry.
- If connection still fails, gather evidence and pivot the scope promptly. With two days remaining, do not spend the deadline debugging an unbounded wallet issue or claim MWA works. Use the official development/debugging path, not a mock presented as live.

### 3. Decide if the event product is honestly buildable in remaining time

- Revisit the hardest-promise gate after the MWA result. Only keep OpenMic Passport if a complete, real issuer-authenticated event claim can be implemented and independently verified on mainnet using a genuine issuer and authentic signed event payload. Otherwise narrow the pitch/product to the real capability or pivot; no fake event/QR, no hand-crafted “live” result.
- The current transfer is not semantically an event claim. A plain transfer to a fixed recipient is not a substitute for issuer-signed participation. If a custom program or account semantic is proposed, time-box the feasibility and use only what can be built, audited sufficiently, and proven before cutoff.
- Re-check rule interpretation of “Solana Mobile Stack”: MWA is one SMS component and must be described accurately; do not claim broader stack/device capabilities unless actually used. Do not add ORE/SKR just for prize optics.

### 4. Finish only a verifiable vertical slice, then package

- Highest priority: APK/device, real MWA, meaningful Solana side effect, independent verification, durable pending/reconciliation, and truthful failure states. Then minimal event workflow, tests for deterministic parsing/state/replay/expiry, UI affordances for each action, evidence, demo, README, deck, and submission.
- Required product workflow if retained: scan an authentic short-lived issuer-signed QR → validate size/schema/signature/expiry/nonce/duplicate → show event and claim details → user explicitly approves MWA operation → persist signature/pending → query mainnet independently → show confirmed receipt only after expected postcondition. No personal data on chain and no physical-attendance claim.
- Reconcile README, planning docs, and claim-to-proof ledger with actual behavior. Include what is live, unknown, planned, and fixture-only. Do not describe old fixture tests as proof of live integration.
- Produce a three-minute maximum demo on the physical device showing problem → core mobile action → wallet → live mainnet operation → independent verification → user outcome and a meaningful rejected/duplicate/expired case if implemented. Optional animation/voiceover must not cover or fabricate the live interaction. Produce pitch deck/brief presentation and a clone/build guide.
- Verify eligibility, registration, final form fields, repo/demo/deck links, latest APK, cutoff timezone, public accessibility, final video matches submitted commit, secrets scan, and portal receipt. Save receipt and URLs. Do not stop at a successful APK build.

## Main gaps against the judge rubric

| 25% criterion | Current gap |
|---|---|
| Stickiness / PMF | Passport/event history and recurring event loop are only a concept; no real user/event or return use demonstrated. |
| UX | Current UI is a feasibility spike with a transfer card. Full scan/review/pending/receipt flow and device interaction polish are missing. |
| Innovation / X-Factor | Event issuer authenticity, replay resistance, and portable participation record are not implemented. A wallet transfer alone is generic. |
| Presentation / Demo | No verified end-to-end product demo, recorded video, or finished deck. Only a factual demo script exists. |

GitHub commit depth can only reflect authentic ongoing work; do not create fake backdated commits. Mobile UX is a real React Native app/scaffold and runs on hardware, but that is not enough to claim the required product is complete.

## What must not be claimed today

- “OpenMic Passport is working” as an event passport — **NOT IMPLEMENTED**.
- “MWA connected/authenticated” — **VERIFIED ONCE** on the current local APK/device run; persistence after process death is not implemented or verified.
- “Mainnet transaction completed” or “confirmed” — **NOT RUN**.
- “Attendance proved”, “fraud-proof”, “trustless”, “decentralized identity”, “secure”, “real time”, or active adoption — unsupported.
- “Submission ready”, “eligibility confirmed”, “ORE integration”, “full Solana Mobile Stack integration” — not yet established.

## Copy/paste instruction for the next Codex account

> Continue the OpenMic CLOCK IN submission from `docs/handoff-next-codex.md`. First read `../HACKATHON_BUILD_STANDARD_V2.md`, then review the listed docs and current `git status`/diff. Do not redo the completed forensic phase or repeat wallet authorization unless it disconnects. MWA returned a real Solflare account once on the current local APK and displayed its mainnet balance; the separate transfer has not been signed or sent. No testnet or fake live product/demo. Never sign or send without my explicit current approval. Keep the user-provided destination private and inspect/remove its hardcoding before pushing. Focus on obtaining a real issuer-authenticated event claim or narrowing/pivoting the product, then finish the device/demo, pitch, README/evidence, eligibility checks, and submission. Report verified facts, blockers, and exact next action; do not call the project finished because the APK builds.

## Resume update — 2026-10-06, after user unlocked the TECNO

The older instructions above are historical; use this section as the latest source state. MWA authorization/account return was verified once on device on the preceding APK. The user asked to build the product flow first and do full testing when implementation is done. No transfer or event transaction has been initiated.


## Resume update — 2026-10-06, Android-native product flow

This update supersedes the old “empty trusted issuer allowlist” note above. The app now has a native React Native Android UI (no WebView), persistent bottom navigation, an organizer claim-creation screen, a wallet-signed recipient-bound QR, native QR scanner bridge, claim review and local issuer trust, explicit wallet approval, Memo receipt, durable local pending/history, and finalized mainnet reconciliation. The organizer screen lets a connected wallet issue a test claim; do not call that wallet an official event organizer without verifying the key from an independent event source. Trust is local and user-selected.

Current source verification: TypeScript check passed; Jest passed 3 suites / 11 tests. A release Gradle build is running. The current source has not yet been installed and exercised on the TECNO. The device is attached. Next: wait for the build to complete, install and launch without wiping app data, inspect Passport/History/Issue screens and native scanner, and exercise organizer signing only with the user's live Solflare approval. Full attendee scan requires displaying the QR on a second screen or another test device. Do not fabricate an issuer or portray self-issued claims as CLOCK IN attendance.

The event claim Memo transfers no SOL but mainnet submission has a network fee. Stop at the final review/wallet approval boundary until the exact transaction and fee have been shown and the user explicitly authorizes submission. No event transaction has been signed or sent. This design does not prove physical presence, guarantee real-world issuer identity, or enforce global one-time use; valid QR replay can occur across devices. Keep these limits clear in the UI/docs.

## Resume update — 2026-10-06, build and device pass

The current Android-native source now builds successfully and the latest release APK was reinstalled/launched on the TECNO KL5 (Android 14). `tsc --noEmit` passed. Jest passed 3 suites / 11 tests. The latest APK is 49,219,899 bytes, SHA-256 `D6CDF5B6CE5A9AE7E21ACEC982D68CFCE9693684661F0A2386E179EA1F9644BC`. On-device Passport, History, and Issue screens rendered with the Android bottom navigation. This verifies rendering and install only; no claim was issued or scanned.

**Current MWA blocker:** Connect launched Solflare, but Solflare displayed its wallet home rather than an authorization screen. Returning to OpenMic produced the cancellation state. No authorized account came back on that APK. Logs showed the association session close after return; no private key/account data was inspected. A prior APK did authorize once, but that does not verify this binary. Source now targets `https://demonchant.github.io` and a ready-to-publish root-site bundle is in `github-pages-identity-site/`. The user-site Pages repository `demonchant/demonchant.github.io` was not found, so the statement is not hosted. The installed APK predates the identity URI edit and must be rebuilt after publishing. MWA's Android specification recommends refusal when app package/signing certificate cannot be verified against Digital Asset Links. Official spec: https://github.com/solana-mobile/mobile-wallet-adapter/blob/main/spec/spec.md#android.

The current APK signing certificate SHA-256 fingerprint is `fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`; it is a debug key and is unsuitable for distribution. The prepared local JSON authorizes only this package/debug fingerprint for development. To complete connection, publish the contents of `github-pages-identity-site/` at the root of a newly created `demonchant/demonchant.github.io` repository, verify the assetlinks URL returns HTTP 200 JSON, rebuild/reinstall, and repeat MWA. Replace the debug signing key with the intended stable key before generating production asset links. Do not omit identity URI as a workaround; the MWA spec recommends wallets decline authorization when the identity is missing.

The release build required pinning `rpc-websockets` to 7.5.1 (the semver-latest 7.11.2 moved the path imported by web3.js 1.75) and correcting Code Scanner Java imports to `com.google.mlkit.vision.codescanner`. Build is now green. Current source does not provide the old hardcoded SOL transfer. Do not sign organizer messages or submit a mainnet Memo until explicit current approval is obtained; no signature/transaction exists. Next concrete dependency is a valid identity domain and signing certificate; after that, repeat MWA, message-signing, QR scan on a second display/device, inspect transaction fee and exact Memo, seek direct user authorization before broadcast, and independently verify mainnet finality. Hackathon demo/deck/eligibility/portal remain open.

## Resume update � 2026-10-06, Pages published and MWA retried

The user supplied `https://github.com/demonchant/demonchant.github.io.git`. The repository was empty; the prepared site files were published to `main` in commit `eb96ae5`. `https://demonchant.github.io/.well-known/assetlinks.json` now returns HTTP 200 with `application/json`. Google's Digital Asset Links statements API recognizes the expected Android package and debug certificate.

Rebuilt and installed the release APK after the identity URI change. Build succeeded; APK SHA-256 is `02CA90E54218EC93BAC0338DF99E98DD0613B2451D2CA4CF93337F2987DE174E`. `apksigner` confirms the certificate matches the hosted debug fingerprint. On the TECNO, Connect launched Solflare, but Solflare showed its ordinary wallet home. Native logs showed a refused localhost association WebSocket; returning to OpenMic displayed �Wallet did not complete the connection.� MWA authorization is still **NOT VERIFIED** on this APK. No message or transaction was signed or sent.

The hosting prerequisite is complete. Diagnose Solflare MWA intent/session handling, version, and native logs next; do not repeat Pages setup or claim MWA works based on the DAL result. Distribution signing, a genuine event issuer, full claim workflow test, event demo/deck, eligibility, and submission remain open. The debug certificate is only for local testing.
