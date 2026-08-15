const VISA_ENTRY_URL = 'https://www.usvisascheduling.com/en-US/';
const VISA_ORIGIN = 'https://www.usvisascheduling.com';
const VISA_MIN_INTERVAL_MINUTES = 1;
const VISA_MAX_INTERVAL_MINUTES = 60;

function normalizeText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function normalizeInterval(value, fallback = 5) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(VISA_MAX_INTERVAL_MINUTES, Math.max(VISA_MIN_INTERVAL_MINUTES, Math.round(numeric)));
}

function matchesConfiguredPattern(text, pattern) {
  const haystack = normalizeText(text);
  const needle = String(pattern || '').trim();
  if (!haystack || !needle) return false;
  if (needle.startsWith('/') && needle.lastIndexOf('/') > 0) {
    const end = needle.lastIndexOf('/');
    try {
      const expression = new RegExp(needle.slice(1, end), needle.slice(end + 1) || 'i');
      return expression.test(String(text || ''));
    } catch (error) {
      return haystack.includes(normalizeText(needle));
    }
  }
  return haystack.includes(normalizeText(needle));
}

function isHumanVerificationPage(text) {
  const value = normalizeText(text);
  return Boolean(value) && [
    'verify you are human',
    'security verification',
    'checking your browser',
    'cloudflare',
    'turnstile',
    'captcha challenge',
    'complete captcha',
    'enter captcha',
    'recaptcha',
    'i am not a robot',
    'prove you are human',
    'bot verification',
    'challenge platform',
    'select all images'
  ].some((marker) => value.includes(marker));
}

function isWaitingRoomPage(text) {
  const value = normalizeText(text);
  return Boolean(value) && [
    'waiting room',
    'estimated wait',
    'please wait',
    'queue',
    'hold tight',
    'we are processing your request',
    'temporarily unavailable'
  ].some((marker) => value.includes(marker));
}

function isSessionExpiredText(text) {
  const value = normalizeText(text);
  return Boolean(value) && [
    'session expired',
    'your session has expired',
    'sign in again',
    'login again',
    'please log in to continue',
    'please login to continue',
    'unauthorized',
    'authentication required'
  ].some((marker) => value.includes(marker));
}

function isNoSlotText(text) {
  const value = normalizeText(text);
  return Boolean(value) && [
    'no appointments available',
    'no appointment available',
    'no slots available',
    'no slots are available',
    'currently no appointments',
    'try again later',
    'not available at this time',
    'there are no available'
  ].some((marker) => value.includes(marker));
}

function isDashboardMenuPage(text) {
  const value = normalizeText(text);
  const hasAppointmentAction = [
    'schedule appointment',
    'schedule an appointment',
    'reschedule appointment',
    'rescheduling',
    'cancel or reschedule',
    'manage appointment'
  ].some((marker) => value.includes(marker));
  const hasSecondaryMenu = [
    'manage applications',
    'feedback/requests',
    'feedback requests',
    'messages',
    'close application and start new application'
  ].some((marker) => value.includes(marker));
  return hasAppointmentAction && hasSecondaryMenu;
}

function isAppointmentPage(text) {
  const value = normalizeText(text);
  return Boolean(value) && [
    'consular post',
    'appointment date',
    'select a date',
    'available appointment',
    'available dates',
    'available times'
  ].some((marker) => value.includes(marker));
}

function isLikelySlotPage(text) {
  const value = normalizeText(text);
  return Boolean(value) && [
    'available appointment',
    'select a date',
    'available dates',
    'available times',
    'appointment date'
  ].some((marker) => value.includes(marker));
}

function samePortalOrigin(url) {
  try {
    const parsed = new URL(url);
    return parsed.origin === VISA_ORIGIN && parsed.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

function isAllowedAutomationUrl(url) {
  return samePortalOrigin(url);
}

if (typeof globalThis !== 'undefined') {
  globalThis.VisaSlotLogic = {
    VISA_ENTRY_URL,
    VISA_ORIGIN,
    VISA_MIN_INTERVAL_MINUTES,
    VISA_MAX_INTERVAL_MINUTES,
    normalizeText,
    normalizeInterval,
    matchesConfiguredPattern,
    isHumanVerificationPage,
    isWaitingRoomPage,
    isSessionExpiredText,
    isNoSlotText,
    isDashboardMenuPage,
    isAppointmentPage,
    isLikelySlotPage,
    samePortalOrigin,
    isAllowedAutomationUrl
  };
}
