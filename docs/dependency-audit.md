# Dependency security audit

**Run date:** 2026-10-06
**Command:** `npm audit --json` from `ClockInSpike`
**Lockfile:** current uncommitted `ClockInSpike/package-lock.json`
**Status:** findings recorded; remediation and production-only re-audit remain open.

## Result

The npm registry reported **50 advisories** across the complete install tree: 4 low, 22 moderate, 21 high, and 3 critical. This includes development/build tooling and does not mean every advisory is present in the shipped APK. A production-only audit is still required before judging runtime exposure.

Direct dependencies flagged by the audit include:

| Direct dependency | Installed declaration | Audit severity | Fix path reported by registry | Constraint / action |
|---|---:|---:|---|---|
| `@solana-mobile/mobile-wallet-adapter-protocol` | `^2.2.0` | Moderate | Patch available | Latest 2.2.6 and 2.3.0 declare `react-native >0.74`; current app is React Native 0.71.4. Upgrade requires a React Native migration and on-device MWA regression. |
| `@solana/web3.js` | `1.75.0` | High | `1.99.0`, non-major | Upgrade is API-compatible in the v1 line by SemVer, but must pass verifier, claim, build, and device checks. Advisory is [GHSA-8m45-2rjm-j347](https://github.com/advisories/GHSA-8m45-2rjm-j347). |
| `react-native` | `0.71.4` | Moderate | `0.87.1`, major | A framework migration is substantial and needs Android build/physical-device validation. At minimum, current MWA patched versions require a version above 0.74. |
| `rpc-websockets` | `7.5.1` | Moderate | `10.0.1`, major | Do not force a major override. Check the exact Solana client peer/dependency range and select a compatible patched graph. `7.11.2` remains inside npm's reported affected range. |
| `@babel/core` | current lockfile | Low | Patch available | Development-only transitive/build tooling; include in lockfile remediation. |

Other reported high/critical packages include `@babel/traverse`, `fast-xml-parser`, `shell-quote`, `minimatch`, `ws`, and multiple React Native CLI/Metro tool dependencies. The audit output must be rerun after updates and the production-only result recorded.

## Upgrade policy for this app

Do not run `npm audit fix --force` or apply overrides blindly. In particular, do not mix an unsupported MWA/RN pair or change RPC transport dependencies without a clean build and physical-device MWA test. Resolve high/critical reachable runtime paths first, then update development tooling and record any residual advisory with reachability and mitigation evidence. The app must keep wallet keys out of app code and storage, retain strict claim validation, and never show transaction success without an independent finalized postcondition.

## Open checks

- [ ] `npm audit --omit=dev --json` (runtime dependency exposure)
- [ ] Upgrade `@solana/web3.js` to the registry-recommended v1 patch; typecheck, deterministic verifier/claim checks, release build, device check
- [ ] Select and prove a compatible RPC-WebSocket version/graph
- [ ] Plan the React Native >0.74 migration needed for patched MWA; compare risk against the deadline, but do not ship known-broken wallet connectivity
- [ ] Rerun full and production-only audits on the exact release lockfile
- [ ] Record APK checksum and dependency lockfile commit together
