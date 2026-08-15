# USvisaSlotChecker Release Audit

**Audit status:** Passed

**Release version:** `1.0.0`

**Audit scope:** Manifest V3 metadata, Chrome Web Store package structure, runtime permissions, icon assets, UI controls, logged-in-only security model, recurring workflow, interval normalization, one-check-per-cycle accounting, no-slot classification, syntax, regression coverage, stale-code cleanup, and archive integrity.

## Version decision

The extension is now set to `1.0.0` in `manifest.json`, which is an appropriate conventional version for a first upload. Chrome's official manifest documentation defines `version` as a string identifying the extension version and documents version formatting, but it does not require the first upload to use exactly `1.0.0` [1]. Chrome's official publishing workflow instructs developers to upload a valid ZIP package through the Developer Dashboard; it does not state that a first upload must use `1.0.0` [2].

If a package with version `2.0.0` has already been submitted or published under the same Web Store item, do not attempt to downgrade that existing item to `1.0.0`; use a higher version for the update. For a genuinely new Web Store item, this prepared package is version `1.0.0`.

## Corrections applied

| Area | Result |
|---|---|
| Manifest | Version changed from `2.0.0` to `1.0.0`; Manifest V3 retained. |
| Interval logic | Removed obsolete preset and custom interval APIs. The runtime now exposes only the single normalized `Interval (min)` path with bounds from 1 through 60. |
| UI cleanup | Removed stale stylesheet selectors from previous version, custom-interval controls, version-display styling, and security-question styling. |
| Check counter | The counter increments only for manual and scheduled monitoring cycles. Page-update and workflow-transition messages do not add extra counts. |
| No-slot state | No-slot classification is evaluated before generic appointment-search classification, so an unavailable appointment page reports `No slot found`. |
| Recurring workflow | Scheduled checks return through Visa Application Home before repeating the configured New appointment or Reschedule Appointment workflow. |
| Security model | No credential fields, password fields, security-answer fields, login automation, credential storage, broad host access, cookie access, network interception, or remote backend were introduced. |
| Source quality | Runtime and test JavaScript contains no source comments. Stale interval, version-label, and security-question selectors were removed. |

## Test results

The following checks passed after the fixes:

| Test | Result |
|---|---|
| Existing pure-logic regression suite | Passed |
| Existing background integration suite | Passed |
| Release metadata and UI audit | Passed |
| Manifest V3 and version-format validation | Passed |
| Required permissions and narrow host-permission validation | Passed |
| Icon existence and manifest-reference validation | Passed |
| Popup and options single-interval field validation | Passed |
| Credential and authentication-field absence validation | Passed |
| Syntax checks for all JavaScript files | Passed |
| Stale runtime and stylesheet surface check | Passed |
| Source-comment check | Passed |
| Store ZIP integrity and root-manifest check | Passed |
| Store ZIP exclusion of tests and crypto.js | Passed |
| GitHub ZIP integrity check | Passed |

## Release files

The Chrome Web Store package contains `manifest.json` at the ZIP root and excludes tests and development-only files. The GitHub source package contains the full source tree, documentation, assets, and tests, including this audit report.

| File | Purpose | SHA256 |
|---|---|---|
| `usvisaslotchecker-store.zip` | Upload this file to the Chrome Web Store Developer Dashboard. | `3a3ddd9c9526c749f28321a6cb0e2ab1f837445f5dd4920ab6ee47f1dbbbc7ca` |
| `usvisaslotchecker-github-source.zip` | Full source and documentation package for GitHub. | `c44835597bafa36c13b5097ce892f7a523fb682d8e89744c35ae5f4143001042` |

## References

[1]: https://developer.chrome.com/docs/extensions/reference/manifest "Chrome for Developers: Manifest file format"

[2]: https://developer.chrome.com/docs/webstore/publish "Chrome for Developers: Publish in the Chrome Web Store"
