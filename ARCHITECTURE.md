# USvisaSlotChecker Architecture

## Scope

USvisaSlotChecker is a local Chrome and Edge Manifest V3 extension for monitoring appointment availability on the official visa scheduling portal after the user has already logged in. The extension does not implement login, credential storage, security-answer storage, authentication-page automation, or final appointment booking.

> The extension interacts only with the visible portal tab. Human verification remains a manual user action.

## Workflow

1. The user opens the portal entry page and completes the normal login process.
2. The user opens the extension popup, chooses New appointment or Reschedule Appointment, sets the consular post, selects a preset or custom interval, and turns monitoring on.
3. The background service worker reuses the existing permitted portal tab. If no permitted tab exists, it opens the entry page and waits for the user to log in.
4. The content script classifies the visible portal state as verification, waiting room, session expired, dashboard, appointment page, no slot, possible slot, or unrecognized.
5. On the dashboard, the content script selects only the visible action that matches the selected workflow mode.
6. On the appointment page, the content script selects the configured consular post using visible controls and reports a possible matching slot when availability indicators are present.
7. The background service worker schedules the next check through `chrome.alarms`, stops polling on a possible slot, and broadcasts visual and audio alert state to the portal tab.

## Workflow modes

| Mode | Dashboard action matching |
|---|---|
| New appointment | Schedule Appointment, Schedule an Appointment, Appointment Scheduling, or Book Appointment. Rescheduling controls are excluded. |
| Reschedule Appointment | Reschedule Appointment, Rescheduling, Modify Appointment, Change Appointment, Manage Appointment, or Cancel or Reschedule. |

## State model

| State | Meaning | Next behavior |
|---|---|---|
| `disabled` | Monitoring is off. | No alarms or page automation run. |
| `starting` | A check is being dispatched to the permitted portal tab. | Wait for the page report. |
| `needs-human-verification` | The portal presents a human-verification challenge. | Wait for the user and require a manual retry. |
| `waiting-room` | The portal shows a queue or waiting state. | Stay on the current page and wait for the next check. |
| `session-expired` | The logged-in session is no longer valid. | User logs in again and turns monitoring on again. |
| `dashboard` | The signed-in dashboard is visible but the selected action is not yet available. | Retry conservatively on the next check. |
| `navigating-to-schedule` | New appointment action was selected. | Wait for the appointment page. |
| `navigating-to-reschedule` | Reschedule Appointment action was selected. | Wait for the appointment page. |
| `returning-home` | A scheduled check is returning through Visa Application Home. | Wait for the home page, then repeat the selected appointment workflow. |
| `appointment-search` | Appointment page is visible and the consular post is being checked. | Report no slot or possible slot. |
| `no-slot` | No matching availability is visible. | Wait for the configured interval. |
| `slot-found` | A possible matching availability indicator is visible. | Stop polling and alert the user. |
| `error` | The page or visible controls do not match a trusted state. | Require review or manual retry. |

## Components

| File | Responsibility |
|---|---|
| `manifest.json` | Manifest V3 metadata, version, narrow permissions, icons, and runtime entry points. |
| `src/background.js` | Local settings, alarms, one-tab reuse, state transitions, notifications, and popup messages. |
| `src/content.js` | Visible portal classification, workflow action selection, consular-post selection, slot detection, and in-page alerts. |
| `src/logic.js` | Pure URL, interval, page-state, and workflow helpers. |
| `src/popup.html`, `src/popup.css`, `src/popup.js` | Responsive quick controls and status presentation. |
| `src/options.html`, `src/options.css`, `src/options.js` | Responsive monitoring settings. |
| `assets/` | Eagle style extension icons. |
| `tests/` | Logic, manifest, integration, and syntax validation. |

## Security and permissions

The extension requests `storage`, `alarms`, `notifications`, and `tabs`. Host access is limited to `https://www.usvisascheduling.com/*`. The authentication host is intentionally not included because the user must complete login before monitoring begins.

No username, password, security answer, authentication token, cookie, or remote session is collected or stored. There is no backend, remote API, network interception, cookie access, debugger access, proxy access, or broad website permission.

## Reliability controls

The extension does not force the portal back to the entry URL when monitoring starts. It reuses the current permitted portal tab so an existing logged-in session is not unnecessarily disrupted. Each scheduled alarm sends the current portal tab through the visible Visa Application Home action, waits for the page transition, and then repeats the selected appointment workflow. Monitoring shutdown clears the alarm and broadcasts a stop signal to the active portal tab. The content script also cancels its pending mutation retry timer and disables page automation when the stop signal arrives.

The alarm is recreated on browser startup and extension installation or update. The `chrome.alarms.create` payload intentionally uses only portable fields supported by Manifest V3 browsers.

## Distribution

The GitHub source package contains the full readable project, documentation, tests, and assets. The Chrome Web Store package contains runtime files and assets with `manifest.json` at the ZIP root. The manifest carries the extension version. The popup and settings page do not display a build-version label.

## Limitations

The scheduling portal may change its labels, DOM structure, queue behavior, availability text, or security service. The content script therefore uses conservative visible-text and control heuristics and reports an error when confidence is low. The extension cannot bypass or solve CAPTCHA, Cloudflare, Turnstile, image challenges, waiting rooms, rate limits, or other human-verification controls. A possible availability result must be reviewed by the user in the official portal.
