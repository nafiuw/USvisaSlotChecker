# USvisaSlotChecker Privacy Policy

**Effective date:** 11 Aug 2026  
**Publisher:** AVNETH

USvisaSlotChecker is a browser extension that helps users monitor visa appointment availability on the US Visa Scheduling portal after the user has completed login manually. This Privacy Policy explains what information USvisaSlotChecker handles, why it is handled, where it is stored, and what the extension does not do with that information.

This policy applies to the USvisaSlotChecker Chrome and Chromium-based browser extension, including its popup, settings page, background service worker, and portal content script.

*Please review this draft with a qualified privacy or technology lawyer before publication. The publisher is responsible for ensuring that this policy accurately reflects the deployed extension, the publisher’s actual support and analytics practices, and all laws applicable to the publisher and its users.*

## 1. Summary
USvisaSlotChecker is designed for one purpose: monitoring visible appointment availability on the user’s existing US Visa Scheduling portal tab and notifying the user when a possible matching slot is visible.

USvisaSlotChecker does not operate a developer-controlled backend, create user accounts, sell data, use advertising trackers, or transmit portal content and monitoring settings to the publisher or an unrelated third party.

The extension does process limited information locally in the browser. This includes monitoring preferences, local monitoring status, the permitted portal URL, timestamps, and visible content from the portal page while determining the current workflow state. This local processing is necessary to provide the extension’s monitoring, navigation, status, and alert features.

## 2. Information the extension handles

### 2.1 Monitoring preferences
When the user configures the extension, USvisaSlotChecker stores the following preferences in the browser’s local extension storage:
* The selected workflow: New appointment or Reschedule Appointment.
* The configured consular-post text or regular-expression pattern.
* The selected checking interval, from 1 to 60 minutes.
* Whether audible alerts are enabled.
* Whether monitoring is currently enabled.

These preferences are stored locally so the extension can apply the user’s choices during manual and recurring checks.

### 2.2 Local runtime status
The extension may store local status information needed to display the current monitoring state and manage recurring checks. This can include:
* The current monitoring state, such as disabled, checking, waiting room, session expired, no slot found, or slot found.
* The last check time and last event time.
* The last permitted portal URL used by the monitor.
* The browser tab identifier used to reuse the portal tab.
* The number of manual and scheduled monitoring cycles.
* Whether a possible slot alert is active.
* A short local status message or slot summary displayed in the extension interface.

This status is used only to provide the extension’s interface, recurring workflow, and alerts. It is not sent to the publisher’s servers.

### 2.3 Visible portal content
While monitoring is active, the extension reads visible text and visible controls on pages under `https://www.usvisascheduling.com/`. It uses that information to identify:
* Whether the page is a signed-in dashboard.
* Whether Schedule Appointment or Reschedule Appointment is available.
* Whether Visa Application Home is available for the next recurring check.
* Whether the page is an appointment page.
* Whether the configured consular post is available or matches the user’s pattern.
* Whether the portal reports that no appointment is available.
* Whether the portal displays a waiting room, session-expiration message, human-verification challenge, or possible appointment availability.

The visible page content is processed temporarily for the monitoring feature. The extension does not intentionally save the full page text in its persistent local settings and does not transmit it to the publisher or a developer-controlled backend.

Portal pages may contain applicant-specific information. USvisaSlotChecker does not intentionally request or store such information as a separate user profile. Users should review the official portal’s own privacy practices for the information displayed on that portal.

## 3. Information the extension does not collect or store
USvisaSlotChecker does not request, collect, store, autofill, or submit:
* Usernames or email addresses used for portal login.
* Passwords.
* Security questions or security answers.
* Authentication tokens or authentication cookies.
* Passport numbers or other identity-document numbers as a configuration field.
* Payment-card or financial information.
* Health information.
* Email, text messages, chat messages, or other personal communications.
* GPS or precise device-location information.
* Keystroke logs, mouse-position logs, scroll logs, or behavioral profiles.
* Browsing history from unrelated websites.

The user must complete portal login manually. The extension does not automate login or retain credentials for later use.

## 4. Human verification and security controls
USvisaSlotChecker does not bypass, solve, defeat, or automate CAPTCHA, reCAPTCHA, Cloudflare, Turnstile, waiting rooms, rate limits, or other human-verification and anti-bot controls. If the portal presents a verification or waiting state, the user must complete any required step manually.

The extension does not attempt to circumvent portal access restrictions, login requirements, or security controls.

## 5. How information is used
Information handled by USvisaSlotChecker is used only to provide and maintain its disclosed single purpose:
* To apply the user’s appointment workflow, consular-post match, checking interval, and alert preferences.
* To identify the visible state of the permitted portal page.
* To reuse the existing portal tab and follow the configured portal workflow.
* To recognize no-slot and possible-slot states.
* To display local status information in the popup and settings page.
* To provide visual, audible, and system notifications when a possible matching appointment is detected.
* To maintain the reliability of the local monitoring workflow.

USvisaSlotChecker does not use information for advertising, behavioral profiling, credit decisions, lending decisions, or unrelated analytics.

## 6. How information is shared
USvisaSlotChecker does not sell, rent, license, or share user data with data brokers, advertising networks, or unrelated third parties.

The extension has no developer-operated backend for receiving portal content, settings, or appointment results. It uses the browser’s local extension storage and browser notification facilities to provide its features.

The extension may interact with the official US Visa Scheduling website because that interaction is necessary to provide the user-facing appointment-monitoring feature. The website’s own handling of information is governed by the website’s policies and terms, not this policy.

If the publisher is legally required to disclose information, the publisher may disclose information as required by applicable law or valid legal process. The publisher will not disclose authentication information publicly.

## 7. Browser permissions and why they are used
USvisaSlotChecker requests the following permissions:

| Permission | Purpose |
| :--- | :--- |
| `storage` | Stores monitoring preferences and local runtime status in the browser. |
| `alarms` | Runs recurring checks at the interval selected by the user. |
| `notifications` | Displays a system notification when a possible slot is detected. |
| `tabs` | Finds and reuses the permitted portal tab, activates it for an alert, and opens the portal only when the user explicitly chooses Open Portal. |
| `https://www.usvisascheduling.com/*` | Reads and interacts with the official portal pages required for the disclosed monitoring workflow. |

The extension does not request broad access to all websites, cookie access, network interception, debugger access, or access to unrelated hosts.

## 8. Data retention and deletion
Monitoring preferences and local runtime status remain in the browser’s local extension storage until the user changes, resets, or removes them, or until the user clears the extension’s stored data through browser settings.

The user can stop monitoring at any time from the extension popup. Stopping monitoring disables recurring checks and stops active alerts, but it may leave saved preferences available for the next use. The user can clear stored extension data through the browser’s extension-management or site-data controls, or by uninstalling the extension.

System notifications are controlled by the browser and operating system. The user can dismiss them or manage notification permissions through browser or operating-system settings.

The publisher does not maintain a remote copy of the extension’s local settings or portal results.

## 9. Security
USvisaSlotChecker is designed to avoid transmitting the information it processes to a publisher-controlled server. The extension package contains its runtime code and does not download remote executable code.

Because preferences and runtime status are stored in the browser profile, users should protect access to their operating-system account, browser profile, and device. The publisher does not control the security of the user’s device, browser profile, the official visa portal, or the user’s internet connection.

If the publisher becomes aware of a security issue affecting the extension, the publisher will investigate and take reasonable steps appropriate to the issue, which may include releasing an update or notifying affected users through available support channels.

## 10. Children’s privacy
USvisaSlotChecker is not directed to children and is not intended to collect information from children. The extension is intended for users who need to monitor their own visa appointment workflow and who can complete portal login and verification steps themselves.

## 11. Third-party services and links
USvisaSlotChecker interacts with the official US Visa Scheduling portal at `https://www.usvisascheduling.com/` because that is the service the extension monitors. The portal is operated independently from the publisher of USvisaSlotChecker. Users should review the portal operator’s privacy policy and terms for information handled directly by that website.

USvisaSlotChecker does not embed third-party advertising, analytics, tracking pixels, or remote code libraries in the extension package.

## 12. Changes to this Privacy Policy
The publisher may update this Privacy Policy when the extension’s data practices, features, permissions, or legal obligations change. The updated policy will include a revised effective date. If a change materially affects how user data is handled, the publisher will provide an appropriate notice through the extension listing, support page, or another reasonable channel before or when the changed practice takes effect, where required by applicable law.

## 13. Contact
For privacy questions, data-practice questions, or security reports, contact:
* **Publisher:** [Insert publisher or company name]
* **Email:** [Insert monitored support email address]
* **Support page:** [Insert public support URL, if available]

## 14. Chrome Web Store User Data Policy statement
USvisaSlotChecker uses information received through browser permissions only to provide and improve its disclosed appointment-monitoring, navigation, status, and alert features. It does not sell user data, use data for personalized advertising, transfer data to data brokers, or use data for creditworthiness or lending decisions. Its use of information is intended to comply with the Chrome Web Store User Data Policy, including the Limited Use requirements.
