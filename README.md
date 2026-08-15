# USvisaSlotChecker

USvisaSlotChecker is a Chrome and Edge Manifest V3 extension that monitors appointment availability on `https://www.usvisascheduling.com/en-US/` after the user has already logged in. It stays within the official portal, supports New appointment and Reschedule Appointment workflows, checks at a configurable interval, and provides visual, system, and optional audible alerts when a possible matching appointment appears.

> **Portal verification:** if the site requests human verification, the monitor pauses and waits for the user to complete it in the portal tab.

## Installation for local testing

Open Chrome or Edge and visit the extensions management page. Enable **Developer mode**, choose **Load unpacked**, and select the extracted `visa-slot-extension` directory. Pin the extension to the browser toolbar for quick access.

Before enabling monitoring, open the portal and complete the normal login process yourself. Leave the logged-in portal tab open. Then open the extension popup, select the workflow, configure the consular post and checking interval, and turn monitoring on.

## Chrome Web Store upload

Use the separate Web Store ZIP supplied with this release. It has `manifest.json` at the ZIP root, which is required for a direct Chrome Web Store upload. In the Chrome Web Store Developer Dashboard, create or select the item, choose **Upload new package**, upload the Web Store ZIP, review the permissions and store listing details, and submit it for review.

The Web Store package contains only runtime files and assets. The GitHub source package contains the readable source, tests, documentation, and project structure.

## Configuration

The popup and settings page contain only monitoring controls. Select **New appointment** when looking for a new appointment, or **Reschedule Appointment** when using an existing scheduled appointment workflow. Enter the consular post as it appears on the portal, or use a JavaScript-style pattern such as `/Mumbai|New Delhi/i`.

Preset checks are available at 1, 3, 5, and 10 minutes. A custom whole-minute interval from 1 through 60 minutes is also available. The browser must remain open with the logged-in portal tab available for page checks and alarms.

No username, password, security question, or security answer is stored, requested, autofilled, or submitted by this release. The extension begins monitoring only after the user has completed login.

## Operation

When monitoring starts, the extension reuses the existing portal tab. If no permitted portal tab exists, it opens the portal entry page and waits for the user to log in. It does not open repeated authentication tabs and does not navigate to the Atlas authentication host.

After login, the extension detects the signed-in dashboard and selects the visible action that matches the chosen workflow. For New appointment mode, it looks for Schedule Appointment, Schedule an Appointment, Appointment Scheduling, or Book Appointment. For Reschedule Appointment mode, it looks for Reschedule Appointment, Rescheduling, Modify Appointment, Change Appointment, Manage Appointment, or Cancel or Reschedule.

After the appointment page appears, the extension selects the configured consular post using visible controls and checks for no-slot text or likely availability indicators. If no matching slot is visible, the next scheduled check first returns through the visible Visa Application Home action, waits for the portal transition, and repeats the selected Schedule Appointment or Reschedule Appointment workflow. If a possible slot is detected, polling stops, a visual alert and system notification appear, and an optional repeating tone starts. The user can silence the alert or clear the result from the popup.

If a waiting room, queue, or session expiry appears, the extension stays on the permitted portal tab and reports the state. When a session expires, the user must log in again and turn monitoring on again.

## Verification and safety boundary

The extension does not click, solve, or bypass CAPTCHA, Cloudflare, Turnstile, image challenges, waiting rooms, rate limits, or other human-verification controls. It pauses and waits for the user. It also does not submit a final appointment booking. A possible availability result must be reviewed by the user in the official portal.

## Permissions and data handling

The extension requests `storage`, `alarms`, `notifications`, and `tabs`. Its host permission is limited to `https://www.usvisascheduling.com/*`. It does not request broad website access, cookies, network interception, proxy control, debugger access, or a remote API.

General monitoring settings are stored in the browser's local extension storage. No credentials, security answers, or authentication tokens are stored by this extension. The extension has no hosted backend and does not transmit configuration or appointment results to a remote service.

## Responsive behavior and supported browsers

The popup and settings page are responsive at mobile-sized widths. Desktop Chrome and Edge are the supported extension environments. Standard Android Chrome does not support ordinary desktop Manifest V3 extensions, so this package does not claim native Android Chrome extension support.

## Development and validation

The project uses plain Manifest V3 files so the behavior is inspectable without a build service. Run the validation suite from the project directory:

```bash
node tests/test_logic.js
node tests/test_background.js
for file in src/*.js tests/*.js; do node --check "$file" || exit 1; done
```

The validation suite covers interval normalization, portal-only URL policy, dashboard recognition, New appointment routing, Reschedule Appointment routing, same-tab reuse, alarm creation, slot alerts, stop behavior, UI cleanup, manifest permissions, referenced assets, and JavaScript syntax.

## Project structure

| Path | Purpose |
|---|---|
| `manifest.json` | Manifest V3 metadata, permissions, version, icons, and runtime entry points |
| `src/background.js` | Service worker, alarms, tab reuse, state, notifications, and configuration |
| `src/content.js` | Conservative visible-page detection and appointment workflow interaction |
| `src/logic.js` | Pure URL, interval, page-state, and workflow helpers |
| `src/popup.html` and `src/popup.js` | Quick monitoring controls |
| `src/options.html` and `src/options.js` | Full monitoring settings |
| `assets/` | Eagle style extension icons |
| `tests/` | Deterministic logic, manifest, integration, and syntax checks |

## Operational limitations

The scheduling portal may change its labels, DOM structure, queue behavior, availability text, or security service. The content script uses conservative visible-text and control heuristics and reports an error when confidence is low. The extension is an assistant for monitoring and navigation. It is not a guarantee that an appointment remains available or that the portal will accept a booking.

## References

[1]: https://developer.chrome.com/docs/extensions/reference/api/alarms/ "Chrome for Developers: chrome.alarms API"

[2]: https://www.ustraveldocs.com/ "Official USTravelDocs"
