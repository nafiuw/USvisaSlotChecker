const STATUS_LABELS = {
  disabled: 'Off',
  starting: 'Starting',
  'needs-human-verification': 'Needs your verification',
  'session-expired': 'Session expired',
  'navigating-to-schedule': 'Opening Schedule Appointment',
  'navigating-to-reschedule': 'Opening Reschedule Appointment',
  'returning-home': 'Returning to Visa Application Home',
  'waiting-room': 'Waiting room',
  dashboard: 'Dashboard',
  'appointment-search': 'Checking appointments',
  'no-slot': 'No slot found',
  'slot-found': 'Slot found',
  error: 'Needs review'
};

function uiSend(type, payload = {}) {
  return chrome.runtime.sendMessage({ type, ...payload });
}

function formatTimestamp(value) {
  if (!value) return 'Not yet';
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  } catch (error) {
    return String(value);
  }
}

function setText(root, selector, value) {
  const element = root.querySelector(selector);
  if (element) element.textContent = value;
}

function renderStatus(root, status) {
  const stateLabel = STATUS_LABELS[status.state] || status.state || 'Unknown';
  const chip = root.querySelector('[data-status-chip]');
  if (chip) {
    chip.textContent = stateLabel;
    chip.dataset.state = status.state || 'disabled';
  }
  setText(root, '[data-status-message]', status.lastMessage || 'No status message.');
  setText(root, '[data-last-checked]', formatTimestamp(status.lastCheckedAt));
  setText(root, '[data-last-url]', status.lastUrl || 'Portal page not checked yet.');
  const modeLabel = status.appointmentMode === 'reschedule' ? 'Reschedule Appointment' : 'New appointment';
  root.querySelectorAll('[data-workflow-mode]').forEach((element) => { element.textContent = modeLabel; });
  setText(root, '[data-run-count]', String(status.runCount || 0));

  const toggle = root.querySelector('[data-monitor-toggle]');
  if (toggle) toggle.checked = Boolean(status.enabled);
  const alertButton = root.querySelector('[data-action="silence"]');
  if (alertButton) alertButton.hidden = !status.alertActive;
  const resetButton = root.querySelector('[data-action="reset"]');
  if (resetButton) resetButton.hidden = !status.slotDetected;
}

function fillForm(root, status) {
  const appointmentMode = root.querySelector('[name="appointmentMode"]');
  if (appointmentMode) appointmentMode.value = status.appointmentMode === 'reschedule' ? 'reschedule' : 'new';
  const interval = root.querySelector('[name="intervalMinutes"]');
  if (interval) interval.value = String(status.intervalMinutes || 5);
  const post = root.querySelector('[name="consularPost"]');
  if (post) post.value = status.consularPost || '';
  const sound = root.querySelector('[name="soundEnabled"]');
  if (sound) sound.checked = status.soundEnabled !== false;
}

function formConfig(root) {
  const values = (name) => root.querySelector(`[name="${name}"]`)?.value || '';
  const checked = (name) => Boolean(root.querySelector(`[name="${name}"]`)?.checked);
  return {
    appointmentMode: values('appointmentMode') === 'reschedule' ? 'reschedule' : 'new',
    intervalMinutes: Number(values('intervalMinutes')),
    consularPost: values('consularPost'),
    soundEnabled: checked('soundEnabled')
  };
}

function flash(root, message, kind = 'success') {
  const target = root.querySelector('[data-feedback]');
  if (!target) return;
  target.textContent = message;
  target.dataset.kind = kind;
  target.hidden = false;
  window.clearTimeout(target._timer);
  target._timer = window.setTimeout(() => { target.hidden = true; }, 6000);
}

async function refreshUi(root) {
  const result = await uiSend('GET_STATUS');
  if (result?.ok) {
    renderStatus(root, result.status);
    fillForm(root, result.status);
    return result.status;
  }
  flash(root, result?.error || 'Could not load extension status.', 'error');
  return null;
}
