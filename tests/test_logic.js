const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
require(path.join(__dirname, '..', 'src', 'logic.js'));

const logic = globalThis.VisaSlotLogic;
assert.equal(logic.normalizeInterval(3), 3);
assert.equal(logic.normalizeInterval(2), 2);
assert.equal(logic.isHumanVerificationPage('Performing security verification'), true);
assert.equal(logic.isHumanVerificationPage('Welcome to your dashboard'), false);
assert.equal(logic.isWaitingRoomPage('Please wait in the waiting room'), true);
assert.equal(logic.isSessionExpiredText('Your session has expired. Please sign in again.'), true);
assert.equal(logic.isDashboardMenuPage('Close Application and Start New Application Schedule Appointment Manage Applications Feedback/Requests Messages'), true);
assert.equal(logic.isDashboardMenuPage('Reschedule Appointment Manage Applications Feedback/Requests Messages'), true);
assert.equal(logic.isNoSlotText('No appointments available at this time'), true);
assert.equal(logic.matchesConfiguredPattern('U.S. Consulate Mumbai', 'mumbai'), true);
assert.equal(logic.matchesConfiguredPattern('U.S. Consulate Mumbai', '/mumbai/i'), true);
assert.equal(logic.matchesConfiguredPattern('U.S. Consulate Mumbai', 'delhi'), false);
assert.equal(logic.samePortalOrigin('https://www.usvisascheduling.com/en-US/'), true);
assert.equal(logic.samePortalOrigin('https://example.com/'), false);
assert.equal(logic.samePortalOrigin('http://www.usvisascheduling.com/en-US/'), false);
assert.equal(logic.isAllowedAutomationUrl('https://www.usvisascheduling.com/en-US/'), true);
assert.equal(logic.isAllowedAutomationUrl('https://atlasauth.b2clogin.com/authorize'), false);

const root = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.name, 'USvisaSlotChecker');
assert.equal(manifest.version, '1.0.0');
assert.deepEqual(manifest.permissions.sort(), ['alarms', 'notifications', 'storage', 'tabs'].sort());
assert.deepEqual(manifest.host_permissions, ['https://www.usvisascheduling.com/*']);
assert.equal(manifest.permissions.includes('<all_urls>'), false);
for (const iconPath of Object.values(manifest.icons)) {
  assert.equal(fs.existsSync(path.join(root, iconPath)), true, `Missing icon asset: ${iconPath}`);
}

const contentScript = fs.readFileSync(path.join(root, 'src', 'content.js'), 'utf8');
const popup = fs.readFileSync(path.join(root, 'src', 'popup.html'), 'utf8');
const options = fs.readFileSync(path.join(root, 'src', 'options.html'), 'utf8');
const background = fs.readFileSync(path.join(root, 'src', 'background.js'), 'utf8');
assert.equal(contentScript.includes('findAppointmentAction'), true);
assert.equal(contentScript.includes('appointmentMode'), true);
assert.equal(contentScript.includes('Reschedule Appointment'), true);
assert.equal(contentScript.includes('Visa Application Home'), true);
assert.equal(contentScript.includes('RESET_TO_HOME'), true);
assert.equal(contentScript.includes('secureConfig'), false);
assert.equal(contentScript.includes('fillLogin'), false);
assert.equal(contentScript.includes('securityQuestionFields'), false);
assert.equal(contentScript.includes("kind !== 'slot'"), true);
assert.equal(popup.includes('name="intervalMinutes" type="number"'), true);
assert.equal(options.includes('Interval (min)'), true);
assert.equal(popup.includes('VERSION'), false);
assert.equal(popup.includes('autoFillCredentials'), false);
assert.equal(popup.includes('autoSubmitLogin'), false);
assert.equal(popup.includes('securityQuestions'), false);
assert.equal(options.includes('Local login credentials'), false);
assert.equal(options.includes('Security questions'), false);
assert.equal(options.includes('autoFillCredentials'), false);
assert.equal(options.includes('autoSubmitLogin'), false);
assert.equal(options.includes('version-field'), false);
assert.equal(background.includes('secureConfig'), false);
assert.equal(background.includes('clearSensitive'), false);

console.log('Clean logged-in-only logic, manifest, UI, and source checks passed.');
