const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const storage = new Map();
const tabs = [];
const alarms = new Map();
const notifications = new Map();
const sentMessages = [];
let nextTabId = 1;
const listeners = {
  installed: null,
  startup: null,
  alarm: null,
  tabUpdated: null,
  notificationClicked: null,
  message: null
};

function event(name) {
  return { addListener(callback) { listeners[name] = callback; } };
}

const chrome = {
  storage: {
    local: {
      async get(keys) {
        if (typeof keys === 'string') return { [keys]: storage.get(keys) };
        if (Array.isArray(keys)) return Object.fromEntries(keys.map((key) => [key, storage.get(key)]));
        return {};
      },
      async set(values) { Object.entries(values).forEach(([key, value]) => storage.set(key, value)); },
      async remove(keys) { keys.forEach((key) => storage.delete(key)); }
    }
  },
  alarms: {
    async clear(name) { alarms.delete(name); return true; },
    async create(name, info) { alarms.set(name, info); },
    onAlarm: event('alarm')
  },
  tabs: {
    async query(queryInfo = {}) {
      if (Array.isArray(queryInfo.url) && queryInfo.url.length) return tabs.filter((tab) => queryInfo.url.some((pattern) => pattern === 'https://www.usvisascheduling.com/*' && tab.url?.startsWith('https://www.usvisascheduling.com/')));
      return tabs;
    },
    async get(id) { return tabs.find((tab) => tab.id === id) || null; },
    async create(info) { const tab = { id: nextTabId++, active: info.active, url: info.url }; tabs.push(tab); return tab; },
    async update(id, patch) { const tab = tabs.find((item) => item.id === id); Object.assign(tab, patch); return tab; },
    async sendMessage(tabId, message) { sentMessages.push({ tabId, message }); return {}; },
    onUpdated: event('tabUpdated')
  },
  notifications: {
    async clear(id) { notifications.delete(id); return true; },
    async create(id, info) { notifications.set(id, info); return id; },
    onClicked: event('notificationClicked')
  },
  runtime: {
    onInstalled: event('installed'),
    onStartup: event('startup'),
    onMessage: event('message'),
    async openOptionsPage() {}
  }
};

const context = vm.createContext({ chrome, URL, console, setTimeout, clearTimeout });
context.globalThis = context;
context.importScripts = (...scripts) => {
  for (const script of scripts) {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src', script), 'utf8');
    vm.runInContext(content, context, { filename: script });
  }
};
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'background.js'), 'utf8'), context, { filename: 'background.js' });

async function sendMessage(message, sender = {}) {
  return new Promise((resolve) => listeners.message(message, sender, resolve));
}

(async () => {
  await listeners.installed();
  let response = await sendMessage({ type: 'GET_STATUS' });
  assert.equal(response.ok, true);
  assert.equal(response.status.state, 'disabled');
  assert.equal(response.status.appointmentMode, 'new');

  response = await sendMessage({
    type: 'SAVE_CONFIG',
    config: {
      appointmentMode: 'reschedule',
      intervalMinutes: 7,
      consularPost: 'Mumbai',
      soundEnabled: true
    }
  });
  assert.equal(response.status.appointmentMode, 'reschedule');
  assert.equal(response.status.intervalMinutes, 7);
  assert.equal(Object.prototype.hasOwnProperty.call(response.status, 'usernameConfigured'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(response.status, 'securityQuestionCount'), false);

  tabs.push({ id: nextTabId++, active: true, url: 'https://atlasauth.b2clogin.com/authorize' });
  response = await sendMessage({ type: 'START' });
  assert.equal(response.status.enabled, true);
  assert.equal(alarms.get('usvisaslotchecker-check').periodInMinutes, 7);
  assert.equal(Object.prototype.hasOwnProperty.call(alarms.get('usvisaslotchecker-check'), 'persistAcrossSessions'), false);
  assert.equal(tabs.length, 1);
  assert.equal(tabs[0].url, 'https://atlasauth.b2clogin.com/authorize');
  assert.equal(sentMessages.some(({ message }) => message?.type === 'RUN_CHECK' && !Object.prototype.hasOwnProperty.call(message, 'secureConfig')), false);

  await sendMessage({ type: 'OPEN_PORTAL' });
  assert.equal(tabs.length, 2);
  tabs[1].url = 'https://www.usvisascheduling.com/en-US/';
  await listeners.tabUpdated(tabs[1].id, { status: 'complete', url: tabs[1].url });
  await new Promise((resolve) => setTimeout(resolve, 900));
  assert.equal(tabs.length, 2);
  assert.equal(sentMessages.some(({ message }) => message?.type === 'RUN_CHECK' && !Object.prototype.hasOwnProperty.call(message, 'secureConfig')), true);
  await listeners.alarm({ name: 'usvisaslotchecker-check' });
  assert.equal(sentMessages.some(({ message }) => message?.type === 'RESET_TO_HOME'), true);

  tabs[1].url = 'https://www.usvisascheduling.com/en-US/dashboard';
  await sendMessage({
    type: 'PAGE_REPORT',
    report: {
      url: tabs[1].url,
      samePortalOrigin: true,
      allowedAutomationHost: true,
      homeReset: true,
      homeResetClicked: true,
      message: 'Returning to Visa Application Home before the next appointment check.'
    }
  }, { tab: { id: tabs[1].id } });
  response = await sendMessage({ type: 'GET_STATUS' });
  assert.equal(response.status.state, 'returning-home');

  await sendMessage({
    type: 'PAGE_REPORT',
    report: {
      url: tabs[1].url,
      samePortalOrigin: true,
      allowedAutomationHost: true,
      dashboard: true,
      appointmentMode: 'reschedule',
      appointmentActionClicked: true,
      rescheduleActionClicked: true,
      message: 'Reschedule Appointment was selected.'
    }
  }, { tab: { id: tabs[1].id } });
  response = await sendMessage({ type: 'GET_STATUS' });
  assert.equal(response.status.state, 'navigating-to-reschedule');

  await sendMessage({
    type: 'PAGE_REPORT',
    report: { url: tabs[1].url, samePortalOrigin: true, sessionExpired: true }
  }, { tab: { id: tabs[1].id } });
  response = await sendMessage({ type: 'GET_STATUS' });
  assert.equal(response.status.state, 'session-expired');

  await sendMessage({
    type: 'PAGE_REPORT',
    report: { url: tabs[1].url, samePortalOrigin: true, slotFound: true, slotSummary: 'Mumbai availability' }
  }, { tab: { id: tabs[1].id } });
  response = await sendMessage({ type: 'GET_STATUS' });
  assert.equal(response.status.state, 'slot-found');
  assert.equal(response.status.enabled, false);
  assert.equal(response.status.alertActive, true);
  assert.equal(alarms.has('usvisaslotchecker-check'), false);
  assert.equal(sentMessages.some(({ message }) => message?.type === 'STOP_AUTOMATION'), true);

  response = await sendMessage({ type: 'SILENCE_ALERT' });
  assert.equal(response.status.alertActive, false);
  assert.equal(notifications.has('usvisaslotchecker-notification'), false);

  response = await sendMessage({ type: 'STOP' });
  assert.equal(response.status.enabled, false);
  assert.equal(sentMessages.some(({ message }) => message?.type === 'STOP_AUTOMATION'), true);
  console.log('Clean logged-in-only background integration checks passed.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
