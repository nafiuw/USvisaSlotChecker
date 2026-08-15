# Chrome Web Store Listing

## Store name

USvisaSlotChecker

## Short description

Monitor a logged-in U.S. visa scheduling portal tab and receive alerts for matching appointment availability.

## Detailed description

USvisaSlotChecker helps users monitor appointment availability on the official U.S. visa scheduling portal after they complete the normal login process themselves.

The extension supports two workflows. New appointment mode selects the visible Schedule Appointment action. Reschedule Appointment mode selects visible rescheduling actions for users who already have an appointment. The user chooses a consular post and a checking interval from 1, 3, 5, and 10 minutes, or sets a custom whole-minute interval from 1 through 60 minutes.

The extension reuses the existing logged-in portal tab, waits through visible queue states, detects the appointment page, selects the configured consular post using visible controls, and alerts the user when a possible matching availability indicator appears. Alerts include a visual in-page notification, a system notification, and an optional audible tone.

The extension does not store or request usernames, passwords, security questions, security answers, cookies, authentication tokens, or remote account data. The extension does not log in for the user. The user must complete login before monitoring begins.

Human verification remains user controlled. USvisaSlotChecker does not click, solve, or bypass CAPTCHA, Cloudflare, Turnstile, image challenges, waiting rooms, rate limits, or other human-verification controls. It pauses when the portal requires verification.

## Permission justification

| Permission | Purpose |
|---|---|
| `storage` | Store non-sensitive monitoring preferences such as workflow mode, consular post, and interval locally in the browser profile. |
| `alarms` | Schedule recurring monitoring checks while the browser remains open. |
| `notifications` | Display a system notification when a possible appointment slot is detected. |
| `tabs` | Reuse the user's existing permitted portal tab and focus it when an alert is selected. |
| Host permission for `https://www.usvisascheduling.com/*` | Read visible portal state and interact with the selected visible appointment workflow controls. |

## Single purpose statement

The single purpose of USvisaSlotChecker is to monitor appointment availability in a user-selected workflow on the official visa scheduling portal and notify the user when a possible match appears.

## Privacy statement

USvisaSlotChecker has no backend and does not transmit user data to a remote service. It does not collect credentials or security answers. It uses local browser storage only for monitoring preferences.

## Review notes

The extension is designed for a user who is already logged in. It does not automate login or human-verification controls. A possible availability alert requires user review in the official portal and does not submit a final booking.
