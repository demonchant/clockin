# CLOCK IN hackathon analysis

**Reviewed:** 2026-10-06 (Africa/Lagos)
**Project:** OpenMic Passport, Android React Native app
**Status:** In progress; not submission-ready

## Event facts and rule sources

- CLOCK IN is the Solana Mobile hackathon in partnership with Radiants. Its category is mobile-first Android apps for the Solana dApp Store. [Solana Mobile announcement](https://solanamobile.com/blog/clock-in-the-solana-mobile-hackathon)
- The current CLOCK IN portal content supplied by the builder says submissions close **October 12, 2026 at 12:59 PM GMT+1**, judging runs October 13–November 9, and winners are announced November 11. Use the logged-in Align **SUBMISSION** deadline as the operational cutoff and retain a screenshot/confirmation. The public Solana Mobile announcement instead says **October 8, 2026** and “early November”; the sources conflict. The portal cutoff has not been independently checked in this workspace.
- Submission evidence described by the current portal: a working build, cloneable/runnable repository, and a demo of at most three minutes. It must run on a physical device, not only in a simulator. The public announcement additionally requests a functional Android APK and a pitch deck or short presentation. Treat all four artifacts as required until the portal confirms otherwise.
- The announcement lists four judging areas: stickiness/product-market fit, user experience, innovation, and presentation/demo. It does not publish category weights in the available source; do not invent them.
- The portal's supplied onboarding says MWA keeps secret keys in the wallet, React Native is an allowed path, and an ordinary Android device can be used for development. The app uses React Native and MWA.
- **Unknown:** eligibility and country rules, registration status, team roster, funding eligibility, project-start rule, whether one entry per person applies, any special disclosures, final upload fields, and the portal's final server-side deadline. Confirm in the logged-in event page.

## User and problem

**User:** a person who attends a community event and wants an event record in a wallet they control, plus an organizer who needs to issue attendee-specific records without collecting attendee names or email addresses.

**Problem hypothesis:** ordinary QR attendance proofs can be copied, detached from the intended attendee, or kept only in a central platform. A wallet-signed claim can bind the event statement to a particular wallet; an independently checked on-chain receipt makes later verification possible without trusting OpenMic's own “success” screen.

This is a product hypothesis, not validated market demand. No interview, usage, organizer adoption, or return-use data is recorded. Stickiness/product-market fit is the largest product risk.

## Candidate concepts and decision

| Concept | User outcome | Distinctive technical work | Main risk | Decision |
|---|---|---|---|---|
| Wallet-bound event passport (current) | Attendee keeps a portable record; organizer issues claims without collecting identity details | MWA message signing, recipient binding, QR validation, local issuer trust, mainnet receipt verification/reconciliation | Needs real organizer trust and MWA/device proof; receipt is not proof of physical presence or globally unique attendance | Continue; most code and evidence already exist |
| Mobile event ticket/check-in | Attendee scans a ticket and organizer records entry | Ticket verification, scan recovery, duplicate handling | No event/ticketing partner or official data source is available | Reject for this deadline |
| Event discovery and RSVP wallet | Seeker user finds events and saves/claims an RSVP | Discovery, organizer publishing, notifications, attendance lifecycle | Requires a content source and introduces broad scope without a supplied organizer | Reject for this deadline |

## Chosen concept and honest pitch

**OpenMic Passport gives event organizers a way to issue wallet-bound, signed event claims and gives attendees a way to check the signature and preserve a matching Solana receipt.** It does not establish physical presence, organizer identity from a QR alone, or global uniqueness. A CLOCK IN-specific attendee credential does not exist in the materials reviewed; do not imply CLOCK IN endorsement. Demo with a real organizer-controlled sample event unless an authorized CLOCK IN organizer supplies a key and issues a claim.

**Hardest promise:** on a physical Android phone, an organizer wallet signs a recipient-bound event claim through MWA, the attendee wallet submits its approved receipt, and the app independently confirms the finalized mainnet transaction and exact receipt fields.

**Current gate:** OPEN. The debug APK builds and is on the TECNO KL5; MWA authorization has not yet succeeded on the latest code. No live claim or transaction has been completed. User approval is required for every wallet message-signature prompt and any transaction prompt.

## Architecture and integrations

```text
Organizer enters event + recipient
  -> MWA returns organizer wallet address and message signature
  -> app builds recipient-bound signed QR
  -> attendee scans and validates schema, signature, wallet, expiry
  -> attendee checks issuer address out of band and trusts locally
  -> attendee reviews Memo transaction and approves in wallet
  -> app stores pending signature/memo
  -> Solana RPC checks finality, signer, transaction error, exact memo
  -> passport shows verified / pending / failed result
```

- **Solana Mobile / MWA:** actual wallet authorization, organizer message-signing, and attendee transaction approval. These are essential to the claim path; they remain unverified on the latest device build.
- **Solana mainnet RPC:** balance display, transaction lookup, finality and receipt verification. A public RPC endpoint is currently used; reliability/rate-limit behavior needs capture.
- **Android Code Scanner:** native on-device QR capture using Google Play services.
- **AI:** none. The product has deterministic cryptographic checks, not a reason to add a model.
- **Data:** claim history and issuer trust are local AsyncStorage. MWA authorization token is memory-only. The Memo is public chain data and contains no attendee name/email.

## Failure model and safe outcomes

- Invalid QR, malformed signature, wrong recipient, expiry, or oversized fields: reject before wallet side effects.
- Unrecognized issuer: display its full key and require independent out-of-band comparison before local trust.
- Wallet cancellation or unsupported MWA: remain disconnected / retain no success state.
- RPC unavailable or transaction not finalized: keep the receipt pending; allow reconciliation; never show verified on broadcast alone.
- Chain transaction error or wrong signer/memo: show failed verification.
- Replayed QR: current client history can reject a local duplicate, but there is no program-level global uniqueness enforcement.
- Stolen/copied QR: recipient binding and ten-minute expiry reduce reuse; neither proves the attendee was physically present.

## Evidence/demo plan

1. Install the APK on the TECNO KL5 and capture the build hash, Android version, wallet version, and app version.
2. Capture one MWA authorization success on device; capture a deliberate cancellation and ensure no false connected state.
3. Using organizer and attendee wallet accounts, complete an event claim on a physical device; verify the organizer signature before QR issuance and attendee binding on scan.
4. Only after the attendee reviews the actual mainnet Memo, ask for explicit approval in the wallet. Record signature, finality, signer, memo, slot, and explorer/RPC evidence. Never sign/submit for the user.
5. Demonstrate a negative case (wrong recipient, expired/tampered claim, or untrusted issuer) with an actual deterministic fixture/test or genuine controlled claim, clearly labeled.
6. Record a sub-three-minute demo showing only states reached on the tested build. Publish a clone/build/run path and pitch presentation.

## Deadline plan and pivot conditions

1. Fix or isolate the MWA failure; latest success criteria are account returned to OpenMic and displayed. If Solflare cannot complete MWA, run the official wallet/device diagnostic path and identify whether the failure is wallet, Android transport, or app.
2. Verify message signature return shape and complete the organizer claim workflow without broadcasting a transaction.
3. Complete recipient scan/review and negative-case checks.
4. With explicit user approval only, complete a modest mainnet Memo receipt and independently verify it; if approval is unavailable, do not claim this gate passed.
5. Build a signed release artifact with a stable signing key, cold-check install/repository instructions, capture demo and deck, verify portal eligibility/deadline/fields, submit, and save receipt.

If MWA still cannot authorize, do not fake the integration. Narrow the pitch to the verified mobile claim verifier or do not submit it as an end-to-end wallet passport. If no legitimate organizer/test event can authorize claims, do not label a self-issued record as CLOCK IN attendance.
