# CLOCK IN rubric and claim-to-proof matrix

The four criteria below are taken from the [Solana Mobile CLOCK IN announcement](https://solanamobile.com/blog/clock-in-the-solana-mobile-hackathon). The announcement publishes no weights; none are assumed. The event portal additionally requires a working on-device build, runnable repository, and demo up to three minutes; the announcement requests an Android APK and pitch deck/short presentation.

## Judging criteria

| Criterion / source | Judge intent | Engineering requirement | Implementation | Proof and demo beat | Status / point-loss risk |
|---|---|---|---|---|---|
| Stickiness and product-market fit | Solves a real problem and gives Seeker users a reason to return | Clear attendee/organizer pain, repeat use, useful durable passport | Local Passport/History and issuer-created attendee claims in `ClockInSpike/screens/MainScreen.tsx` | Show a real issuer-issued record, return to History, reopen/reconcile it | **UNKNOWN** demand and retention; no real organizer adopted it; physical attendance is not proven |
| User experience | Intuitive, polished, phone-native | Understandable connection, scan, trust, fee and receipt states; accessible mobile flow | Native React Native screens and Android Code Scanner | Physical-device walkthrough with cancellation, invalid claim and pending/finalized receipt states | **PARTIAL** UI renders on TECNO; latest MWA authorization and full claim flow not verified |
| Innovation / X-factor | Fresh idea or new use of mobile | Real mobile wallet and camera use; issuer/recipient binding; independently checked receipt | MWA message signing + QR + mainnet Memo + RPC verification | Show full issuer key check, bound QR, approved wallet action, finalized exact memo | **PARTIAL** implementation exists; live MWA and chain postcondition are OPEN; no global replay protection or presence proof |
| Presentation and demo | Clear product value and convincing evidence | Accurate story, smooth real-device demo, runnable repo, APK, deck, under 3 minutes | README/screenshots and demo/deck still need finalization | Demo: need → organizer signs → attendee scans/reviews → wallet approval → independent result | **OPEN** no final demo, deck, submission receipt, or distribution-signed APK recorded |

## Claim-to-proof ledger

| Claim | Observable behavior | Failure case | Proof required | Demo/reviewer path | Status |
|---|---|---|---|---|---|
| Organizer can issue an event claim | Wallet signs canonical event/issuer/recipient/nonce/expiry message; app displays QR | Wallet returns malformed or wrong signature | Verify MWA return bytes and Ed25519 signature against organizer public key | Issue screen → wallet message prompt → QR/key | **IMPLEMENTED IN SOURCE; device unverified** |
| Claim is for one attendee | Scanned wallet must equal signed recipient | Wrong account / malformed address | Negative test and real second-wallet scan | Attendee scan and review | **IMPLEMENTED IN SOURCE; physical flow open** |
| Issuer identity is protected | Attendee compares full key against separate organizer-controlled channel | QR issuer is unknown or substituted | Out-of-band key evidence; pause if not supplied | New issuer trust screen | **USER ACTION REQUIRED; no CLOCK IN issuer published** |
| Receipt is verified independently | RPC fetch proves finalized successful transaction with expected signer and exact Memo | Pending, RPC error, failed transaction, unexpected Memo | Actual mainnet transaction plus independent RPC/explorer check | Receipt view and explorer link | **CODED; no real claim/transaction run** |
| Wallet secrets stay in wallet | App uses MWA; no seed/private-key entry or persistence | App logs or storage accidentally expose auth data | Source/security inspection and wallet behavior | Connect flow; inspect app storage/logging | **SOURCE DESIGN; security audit open** |
| App works on a physical Android device | APK installs and full critical path completes on TECNO KL5 | App launch, camera, MWA, or RPC fails | Build hash, device/OS, wallet version, screenshots/logs | Install/launch/complete workflow | **APK previously launched; updated debug build now installed; walk-through pending** |

## Hardest-promise acceptance gate

- **Trigger:** organizer uses Issue; attendee connects, scans and chooses to claim.
- **Real behavior:** organizer MWA message signature, strict recipient/signature/time validation, attendee wallet-approved Memo transaction.
- **Persisted state:** receipt signature/memo saved before RPC send; pending survives restart.
- **Independent postcondition:** finalized Solana transaction has no error, attendee signer, exact expected Memo, and valid embedded issuer signature.
- **Abnormal case:** wrong recipient/expired/tampered/untrusted claim is rejected; network delay remains pending; chain mismatch becomes failed.
- **Reproduction:** physical TECNO + compatible wallet(s), documented project install/build, organizer key shared independently. Do not complete the mainnet wallet step without the user's review and approval of the exact request.
- **Gate:** **OPEN** until demonstrated end-to-end on the physical device.
