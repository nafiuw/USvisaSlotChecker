const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const src = path.join(root, 'src');
const read = (file) => fs.readFileSync(path.join(src, file), 'utf8');

assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.name, 'USvisaSlotChecker');
assert.equal(manifest.version, '1.0.0');
assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
assert.ok(manifest.description.length <= 132);
assert.equal(manifest.background.service_worker, 'src/background.js');
assert.deepEqual(manifest.permissions.sort(), ['alarms', 'notifications', 'storage', 'tabs'].sort());
assert.deepEqual(manifest.host_permissions, ['https://www.usvisascheduling.com/*']);
assert.equal(manifest.permissions.includes('<all_urls>'), false);
assert.equal(manifest.permissions.includes('webRequest'), false);
assert.equal(manifest.permissions.includes('scripting'), false);

for (const file of Object.values(manifest.icons)) assert.equal(fs.existsSync(path.join(root, file)), true, `Missing icon: ${file}`);
for (const file of Object.values(manifest.action.default_icon)) assert.equal(fs.existsSync(path.join(root, file)), true, `Missing action icon: ${file}`);
for (const file of [manifest.background.service_worker, manifest.options_page, manifest.action.default_popup, ...manifest.content_scripts.flatMap((entry) => entry.js)]) assert.equal(fs.existsSync(path.join(root, file)), true, `Missing manifest file: ${file}`);

const popup = read('popup.html');
const options = read('options.html');
for (const html of [popup, options]) {
  assert.equal((html.match(/name="intervalMinutes"/g) || []).length, 1);
  assert.equal(/type="password"/i.test(html), false);
  assert.equal(/name="(?:username|password|security|credential|answer)/i.test(html), false);
  assert.equal(/\b(?:1\.0\.0|2\.0\.0)\b/.test(html), false);
}
assert.equal(/name="intervalMinutes" type="number" min="1" max="60" step="1"/i.test(popup), true);
assert.equal(/name="intervalMinutes" type="number" min="1" max="60" step="1"/i.test(options), true);
assert.equal(/name="appointmentMode"/.test(popup), true);
assert.equal(/value="reschedule"/.test(popup), true);
assert.equal(/name="consularPost"/.test(popup), true);
assert.equal(/name="soundEnabled"/.test(popup), true);

const allRuntime = fs.readdirSync(src).filter((file) => file.endsWith('.js')).map((file) => read(file)).join('\n');
for (const stale of ['VISA_INTERVALS', 'normalizePresetInterval', 'normalizeCustomInterval', 'useCustomInterval', 'customIntervalMinutes', 'Preset interval', 'Custom minutes', 'version-field', 'question-list', 'securityQuestionFields', 'autoFillCredentials', 'autoSubmitLogin', 'secureConfig', 'clearSensitive']) assert.equal(allRuntime.includes(stale), false, `Stale runtime term: ${stale}`);
for (const file of fs.readdirSync(src).filter((name) => name.endsWith('.js'))) {
  const hasComment = read(file).split('\n').some((line) => !/https?:\/\//.test(line) && (/^\s*\/\//.test(line) || /\/\*|\*\//.test(line)));
  assert.equal(hasComment, false, `Comment found in ${file}`);
}

require(path.join(src, 'logic.js'));
const logic = globalThis.VisaSlotLogic;
assert.equal(logic.normalizeInterval(1), 1);
assert.equal(logic.normalizeInterval(60), 60);
assert.equal(logic.normalizeInterval(0), 1);
assert.equal(logic.normalizeInterval(61), 60);
assert.equal(logic.normalizeInterval(7), 7);
assert.equal(logic.isNoSlotText('No appointments available at this time'), true);
assert.equal(logic.samePortalOrigin('https://www.usvisascheduling.com/en-US/'), true);
assert.equal(logic.samePortalOrigin('https://example.com/'), false);

console.log('Release audit passed.');
