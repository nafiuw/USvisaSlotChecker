importScripts('logic.js');

const SETTINGS_KEY = 'visaSlotMonitorSettings';
const LEGACY_SENSITIVE_KEYS = ['visaSlotMonitorSecureConfig', 'visaSlotMonitorCryptoKey'];
const STATE_KEY = 'visaSlotMonitorRuntimeState';
const ALARM_NAME = 'usvisaslotchecker-check';
const NOTIFICATION_ID = 'usvisaslotchecker-notification';

const DEFAULT_SETTINGS = {
  configVersion: 4,
  appointmentMode: 'new',
  enabled: false,
  intervalMinutes: 5,
  consularPost: '',
  soundEnabled: true
};

const DEFAULT_RUNTIME = {
  state: 'disabled',
  lastCheckedAt: null,
  lastEventAt: null,
  lastMessage: 'Monitoring is off.',
  lastUrl: '',
  slotDetected: false,
  alertActive: false,
  tabId: null,
  runCount: 0
};

async function getSettings() {
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  const saved = stored[SETTINGS_KEY] || {};
  const settings = { ...DEFAULT_SETTINGS, ...saved };
  if (!Object.prototype.hasOwnProperty.call(saved, 'configVersion') || Number(saved.configVersion) < 4) {
    settings.configVersion = 4;
    settings.appointmentMode = saved.appointmentMode === 'reschedule' ? 'reschedule' : 'new';
    await chrome.storage.local.remove(LEGACY_SENSITIVE_KEYS);
    await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
  }
  return settings;
}

async function setSettings(patch) {
  const current = await getSettings();
  const requestedInterval = VisaSlotLogic.normalizeInterval(patch.intervalMinutes ?? current.intervalMinutes);
  const next = {
    ...current,
    ...patch,
    appointmentMode: patch.appointmentMode === 'reschedule' ? 'reschedule' : (patch.appointmentMode === 'new' ? 'new' : current.appointmentMode),
    intervalMinutes: VisaSlotLogic.normalizeInterval(requestedInterval)
  };
  await chrome.storage.local.set({ [SETTINGS_KEY]: next });
  return next;
}

async function getRuntime() {
  const stored = await chrome.storage.local.get(STATE_KEY);
  return { ...DEFAULT_RUNTIME, ...(stored[STATE_KEY] || {}) };
}

async function setRuntime(patch) {
  const next = { ...(await getRuntime()), ...patch };
  await chrome.storage.local.set({ [STATE_KEY]: next });
  await broadcast({ type: 'STATUS_UPDATED', status: await publicStatus(next) });
  return next;
}

async function publicStatus(runtime) {
  const currentRuntime = runtime || await getRuntime();
  const settings = await getSettings();
  return {
    ...currentRuntime,
    enabled: settings.enabled,
    intervalMinutes: settings.intervalMinutes,
    appointmentMode: settings.appointmentMode,
    consularPost: settings.consularPost,
    soundEnabled: settings.soundEnabled
  };
}

async function broadcast(message) {
  try {
    const tabs = await chrome.tabs.query({ url: ['https://www.usvisascheduling.com/*'] });
    await Promise.all(tabs.map((tab) => chrome.tabs.sendMessage(tab.id, message).catch(() => undefined)));
  } catch (error) {
    console.debug('USvisaSlotChecker: broadcast skipped', error);
  }
}

async function notify(title, message, requireInteraction = false) {
  try {
    await chrome.notifications.clear(NOTIFICATION_ID);
    await chrome.notifications.create(NOTIFICATION_ID, {
      type: 'basic',
      iconUrl: 'assets/icon-128.png',
      title,
      message,
      priority: 2,
      requireInteraction
    });
  } catch (error) {
    console.debug('USvisaSlotChecker: notification unavailable', error);
  }
}

async function ensureAlarm(intervalMinutes) {
  await chrome.alarms.clear(ALARM_NAME);
  await chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: VisaSlotLogic.normalizeInterval(intervalMinutes),
    periodInMinutes: VisaSlotLogic.normalizeInterval(intervalMinutes)
  });
}

async function clearAlarm() {
  await chrome.alarms.clear(ALARM_NAME);
}

async function findManagedTab() {
  const runtime = await getRuntime();
  if (runtime.tabId) {
    try {
      const existing = await chrome.tabs.get(runtime.tabId);
      if (existing?.url && VisaSlotLogic.isAllowedAutomationUrl(existing.url)) return existing;
    } catch (error) {
      console.debug('USvisaSlotChecker: managed tab is no longer available');
    }
  }
  const tabs = await chrome.tabs.query({ url: ['https://www.usvisascheduling.com/*'] });
  if (!tabs.length) return null;
  const active = tabs.find((tab) => tab.active);
  return active || tabs[0];
}

async function openPortalEntryTab() {
  const existing = await findManagedTab();
  if (existing) return existing;
  return chrome.tabs.create({ url: VisaSlotLogic.VISA_ENTRY_URL, active: true });
}

async function runCheck(reason = 'alarm') {
  const settings = await getSettings();
  if (!settings.enabled) return;

  const tab = await findManagedTab();
  const incrementRunCount = reason === 'manual' || reason === 'scheduled';
  if (!tab) {
    await setRuntime({
      state: 'session-expired',
      lastMessage: 'No portal tab is available. Complete login manually, then open the portal tab; monitoring will use it without opening another tab.'
    });
    return;
  }
  await setRuntime({
    state: 'starting',
    tabId: tab.id,
    lastCheckedAt: new Date().toISOString(),
    lastMessage: reason === 'manual' ? 'Running a manual check…' : (reason === 'scheduled' ? 'Returning to Visa Application Home before the next check…' : 'Running the page check…'),
    runCount: (await getRuntime()).runCount + (incrementRunCount ? 1 : 0)
  });

  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: reason === 'scheduled' ? 'RESET_TO_HOME' : 'RUN_CHECK',
      settings: {
        enabled: settings.enabled,
        appointmentMode: settings.appointmentMode,
        consularPost: settings.consularPost,
        soundEnabled: settings.soundEnabled
      }
    });
  } catch (error) {
    await setRuntime({
      state: 'error',
      lastMessage: 'The portal tab is not ready yet. Refresh the entry page and try again.'
    });
  }
}

async function startMonitoring() {
  await setSettings({ enabled: true });
  await setRuntime({
    state: 'starting',
    slotDetected: false,
    alertActive: false,
    lastMessage: 'Monitoring enabled. Reusing the currently logged-in portal tab.'
  });
  await ensureAlarm((await getSettings()).intervalMinutes);
  await runCheck('manual');
}

async function stopMonitoring(message = 'Monitoring is off.') {
  await setSettings({ enabled: false });
  await clearAlarm();
  await setRuntime({
    state: 'disabled',
    alertActive: false,
    lastMessage: message
  });
  await broadcast({ type: 'STOP_AUTOMATION' });
  await broadcast({ type: 'STOP_ALERT' });
}

async function silenceAlert() {
  await setRuntime({ alertActive: false, lastMessage: 'Alert silenced. The slot result remains visible for review.' });
  await chrome.notifications.clear(NOTIFICATION_ID);
  await broadcast({ type: 'STOP_ALERT' });
}

async function handlePageReport(tabId, report) {
  const settings = await getSettings();
  if (!settings.enabled) return;

  const bodyText = String(report.bodyText || '');
  const base = {
    tabId,
    lastUrl: report.url || '',
    lastCheckedAt: new Date().toISOString(),
    lastEventAt: new Date().toISOString()
  };

  if (report.allowedAutomationHost === false) {
    await setRuntime({ ...base, state: 'error', lastMessage: 'The page left the permitted portal and authentication hosts. Monitoring is paused.' });
    await stopMonitoring('Monitoring stopped because the page left the permitted portal and authentication hosts.');
    return;
  }

  if (report.humanVerification) {
    await setRuntime({ ...base, state: 'needs-human-verification', lastMessage: 'Complete the human-verification step in the portal tab; automation is paused.' });
    await notify('USvisaSlotChecker: action needed', 'Complete the human-verification step in the portal tab. The monitor is paused.', true);
    return;
  }

  if (report.slotFound) {
    await clearAlarm();
    await setSettings({ enabled: false });
    await setRuntime({
      ...base,
      state: 'slot-found',
      slotDetected: true,
      alertActive: true,
      lastMessage: report.slotSummary || 'A possible appointment slot is visible. Review it now.'
    });
    await notify('Visa appointment slot found', report.slotSummary || 'A possible slot is visible. Review the portal tab.', true);
    await broadcast({ type: 'STOP_AUTOMATION' });
    await broadcast({ type: 'SHOW_ALERT', soundEnabled: settings.soundEnabled, summary: report.slotSummary || 'A possible appointment slot is visible.' });
    return;
  }

  if (report.homeReset) {
    await setRuntime({ ...base, state: report.homeResetClicked ? 'returning-home' : 'dashboard', lastMessage: report.message || 'Returning to Visa Application Home before the next appointment workflow.' });
    return;
  }

  if (report.waitingRoom) {
    await setRuntime({ ...base, state: 'waiting-room', lastMessage: 'The portal is showing a waiting or queue state. Staying on the current page.' });
    return;
  }

  if (report.sessionExpired) {
    await setRuntime({ ...base, state: 'session-expired', lastMessage: 'The portal session appears to have expired. Log in again in the portal tab, then turn monitoring on again.' });
    return;
  }

  if (report.noSlot) {
    await setRuntime({ ...base, state: 'no-slot', lastMessage: 'No matching slot is visible. The next check will run on the configured interval.' });
    return;
  }

  if (report.appointmentPage) {
    await setRuntime({ ...base, state: 'appointment-search', lastMessage: report.message || 'Appointment page detected; checking the configured consular post.' });
    return;
  }

  if (report.dashboard) {
    const actionClicked = report.appointmentActionClicked || report.scheduleActionClicked || report.rescheduleActionClicked;
    const mode = report.appointmentMode === 'reschedule' ? 'reschedule' : 'new';
    await setRuntime({
      ...base,
      state: actionClicked ? (mode === 'reschedule' ? 'navigating-to-reschedule' : 'navigating-to-schedule') : 'dashboard',
      lastMessage: report.message || (actionClicked
        ? `${mode === 'reschedule' ? 'Reschedule Appointment' : 'Schedule Appointment'} was selected. Waiting for the appointment page to load.`
        : `Signed-in dashboard detected. Looking for the ${mode === 'reschedule' ? 'Reschedule Appointment' : 'Schedule Appointment'} action.`)
    });
    return;
  }

  await setRuntime({ ...base, state: 'error', lastMessage: report.message || 'The portal state was not recognized. Review the page and retry manually.' });
}

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get([SETTINGS_KEY, STATE_KEY]);
  await chrome.storage.local.set({
    [SETTINGS_KEY]: stored[SETTINGS_KEY] || DEFAULT_SETTINGS,
    [STATE_KEY]: stored[STATE_KEY] || DEFAULT_RUNTIME
  });
  const settings = await getSettings();
  if (settings.enabled) await ensureAlarm(settings.intervalMinutes);
});

chrome.runtime.onStartup.addListener(async () => {
  const settings = await getSettings();
  if (settings.enabled) await ensureAlarm(settings.intervalMinutes);
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) return runCheck('scheduled');
  return undefined;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    getSettings().then((settings) => {
      if (settings.enabled && sameAllowedHostSafe(changeInfo.url)) {
        setTimeout(() => runCheck('page-update').catch(() => undefined), 800);
      }
    });
  }
});

function sameAllowedHostSafe(url) {
  return !url || VisaSlotLogic.samePortalOrigin(url);
}

chrome.notifications.onClicked.addListener(async (notificationId) => {
  if (notificationId !== NOTIFICATION_ID) return;
  const runtime = await getRuntime();
  if (runtime.tabId) await chrome.tabs.update(runtime.tabId, { active: true });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    switch (message?.type) {
      case 'GET_STATUS':
        sendResponse({ ok: true, status: await publicStatus() });
        break;
      case 'SAVE_CONFIG': {
        const config = message.config || {};
        const settings = await setSettings({
          intervalMinutes: VisaSlotLogic.normalizeInterval(config.intervalMinutes),
          appointmentMode: config.appointmentMode === 'reschedule' ? 'reschedule' : 'new',
          consularPost: String(config.consularPost || '').trim(),
          soundEnabled: config.soundEnabled !== false
        });
        if (settings.enabled) await ensureAlarm(settings.intervalMinutes);
        sendResponse({ ok: true, status: await publicStatus() });
        break;
      }
      case 'START':
        await startMonitoring();
        sendResponse({ ok: true, status: await publicStatus() });
        break;
      case 'STOP':
        await stopMonitoring();
        sendResponse({ ok: true, status: await publicStatus() });
        break;
      case 'MANUAL_CHECK':
        await runCheck('manual');
        sendResponse({ ok: true, status: await publicStatus() });
        break;
      case 'SILENCE_ALERT':
        await silenceAlert();
        sendResponse({ ok: true, status: await publicStatus() });
        break;
      case 'RESET_RESULT':
        await setRuntime({ slotDetected: false, alertActive: false, state: 'disabled', lastMessage: 'Result cleared. Monitoring is off.' });
        await chrome.notifications.clear(NOTIFICATION_ID);
        sendResponse({ ok: true, status: await publicStatus() });
        break;
      case 'OPEN_PORTAL':
        await openPortalEntryTab();
        sendResponse({ ok: true });
        break;
      case 'OPEN_OPTIONS':
        await chrome.runtime.openOptionsPage();
        sendResponse({ ok: true });
        break;
      case 'PAGE_REPORT':
        await handlePageReport(sender.tab?.id, message.report || {});
        sendResponse({ ok: true });
        break;
      default:
        sendResponse({ ok: false, error: 'Unknown message type.' });
    }
  })().catch((error) => {
    console.error('USvisaSlotChecker:', error);
    sendResponse({ ok: false, error: error.message || 'Unexpected extension error.' });
  });
  return true;
});
