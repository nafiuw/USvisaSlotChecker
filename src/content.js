(() => {
  const PORTAL_ORIGIN = 'https://www.usvisascheduling.com';
  let alertTimer = null;
  let audioContext = null;
  let alertRoot = null;
  let lastActionAt = 0;
  let scheduleNavigationAttemptedAt = 0;
  let lastRunSettings = {};
  let mutationTimer = null;
  let lastMutationCheckAt = 0;
  let automationEnabled = false;

  function visible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
  }

  function bodyText() {
    return document.body?.innerText || document.documentElement?.innerText || '';
  }

  function clickVisible(element) {
    if (!visible(element)) return false;
    const now = Date.now();
    if (now - lastActionAt < 1200) return false;
    lastActionAt = now;
    element.click();
    return true;
  }

  function detectChallenge() {
    const text = bodyText();
    const challengeElements = Array.from(document.querySelectorAll(
      'iframe[src*="challenges.cloudflare.com"], iframe[src*="turnstile"], [id*="captcha"], [class*="captcha"], [aria-label*="verification" i], input[type="checkbox"][name*="captcha" i]'
    ));
    return VisaSlotLogic.isHumanVerificationPage(text) || challengeElements.some(visible);
  }

  function findAppointmentAction(mode = 'new') {
    const candidates = Array.from(document.querySelectorAll('a, button, input[type="button"], input[type="submit"], [role="button"]'))
      .filter(visible);
    return candidates.find((element) => {
      const text = `${element.innerText || ''} ${element.value || ''} ${element.getAttribute('aria-label') || ''}`.toLowerCase().replace(/\s+/g, ' ').trim();
      const isReschedule = /reschedule|rescheduling|modify appointment|change appointment|manage appointment|cancel or reschedule/.test(text);
      if (mode === 'reschedule') return isReschedule;
      return !isReschedule && /schedule appointment|schedule an appointment|appointment scheduling|book appointment/.test(text);
    });
  }

  function safeAppointmentAction(action) {
    const href = action?.getAttribute('href');
    if (href) {
      try {
        const url = new URL(href, location.href);
        if (url.origin !== PORTAL_ORIGIN || url.protocol !== 'https:') return false;
      } catch (error) {
        return false;
      }
    }
    return clickVisible(action);
  }

  function findVisaApplicationHome() {
    const candidates = Array.from(document.querySelectorAll('a, button, [role="link"], [role="button"]'))
      .filter(visible);
    return candidates.find((element) => {
      const text = `${element.innerText || ''} ${element.getAttribute('aria-label') || ''} ${element.getAttribute('title') || ''}`
        .toLowerCase().replace(/\\s+/g, ' ').trim();
      return /visa application home|application home|return to home|go to home/.test(text);
    }) || candidates.find((element) => {
      const text = `${element.innerText || ''} ${element.getAttribute('aria-label') || ''}`.toLowerCase().trim();
      return text === 'home' || text === 'visa home';
    });
  }

  function safeHomeAction(action) {
    const href = action?.getAttribute('href');
    if (href) {
      try {
        const url = new URL(href, location.href);
        if (url.origin !== PORTAL_ORIGIN || url.protocol !== 'https:') return false;
      } catch (error) {
        return false;
      }
    }
    return clickVisible(action);
  }

  function selectConsularPost(pattern) {
    if (!pattern) return { found: false, selected: false };
    const selects = Array.from(document.querySelectorAll('select')).filter(visible);
    for (const select of selects) {
      const option = Array.from(select.options).find((candidate) => VisaSlotLogic.matchesConfiguredPattern(candidate.text, pattern));
      if (option) {
        if (select.value !== option.value) {
          select.value = option.value;
          select.dispatchEvent(new Event('input', { bubbles: true }));
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
        return { found: true, selected: true };
      }
    }

    const labels = Array.from(document.querySelectorAll('label, [role="option"], [role="radio"], button')).filter(visible);
    const target = labels.find((element) => VisaSlotLogic.matchesConfiguredPattern(element.innerText || element.getAttribute('aria-label'), pattern));
    if (target) return { found: true, selected: clickVisible(target) };

    const textInputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="password"])')).filter(visible);
    const postInput = textInputs.find((input) => /consular|post|location|embassy|consulate/i.test(input.getAttribute('aria-label') || input.name || input.id || ''));
    if (postInput) {
      const prototype = HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
      setter?.call(postInput, pattern);
      postInput.dispatchEvent(new Event('input', { bubbles: true }));
      postInput.dispatchEvent(new Event('change', { bubbles: true }));
      return { found: true, selected: true };
    }
    return { found: false, selected: false };
  }

  function showOverlay(kind, message, summary = '') {
    if (kind !== 'slot') return;
    if (!alertRoot) {
      alertRoot = document.createElement('div');
      alertRoot.id = 'usvisaslotchecker-overlay';
      alertRoot.style.position = 'fixed';
      alertRoot.style.inset = 'auto 18px 18px auto';
      alertRoot.style.zIndex = '2147483647';
      alertRoot.style.maxWidth = 'min(420px, calc(100vw - 36px))';
      alertRoot.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';
      document.documentElement.appendChild(alertRoot);
    }
    const color = '#8b1e1e';
    alertRoot.innerHTML = `
      <div style="background:${color};color:#fff;padding:16px 18px;border-radius:14px;box-shadow:0 16px 42px rgba(0,0,0,.28);border:1px solid rgba(255,255,255,.28)">
        <div style="font-weight:800;font-size:16px;margin-bottom:6px">Possible appointment slot found</div>
        <div style="font-size:13px;line-height:1.45;margin-bottom:12px">${escapeHtml(message)}${summary ? `<br><strong>${escapeHtml(summary)}</strong>` : ''}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button data-action="silence" style="border:0;border-radius:9px;padding:9px 12px;font-weight:700;cursor:pointer">Silence alert</button>
          <button data-action="close" style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,.65);border-radius:9px;padding:9px 12px;cursor:pointer">Dismiss</button>
        </div>
      </div>`;
    alertRoot.querySelector('[data-action="silence"]')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'SILENCE_ALERT' });
      stopSound();
      hideOverlay();
    });
    alertRoot.querySelector('[data-action="close"]')?.addEventListener('click', hideOverlay);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
  }

  function hideOverlay() {
    if (alertRoot) alertRoot.remove();
    alertRoot = null;
  }

  function beep() {
    try {
      audioContext ||= new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gain.gain.value = 0.08;
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.22);
    } catch (error) {
    }
  }

  function startSound() {
    stopSound();
    beep();
    alertTimer = setInterval(beep, 1500);
  }

  function stopSound() {
    if (alertTimer) clearInterval(alertTimer);
    alertTimer = null;
  }

  async function resetToVisaApplicationHome(settings) {
    lastRunSettings = settings || {};
    automationEnabled = settings?.enabled !== false;
    if (!automationEnabled || !VisaSlotLogic.samePortalOrigin(location.href)) return;
    const action = findVisaApplicationHome();
    const report = {
      url: location.href,
      samePortalOrigin: true,
      allowedAutomationHost: true,
      bodyText: bodyText().slice(0, 100000),
      homeReset: true,
      homeResetClicked: false,
      appointmentMode: settings.appointmentMode === 'reschedule' ? 'reschedule' : 'new'
    };
    if (action) {
      report.homeResetClicked = safeHomeAction(action);
      report.message = report.homeResetClicked
        ? 'Returning to Visa Application Home before the next appointment check.'
        : 'Visa Application Home was visible but could not be selected safely.';
      await chrome.runtime.sendMessage({ type: 'PAGE_REPORT', report });
      if (report.homeResetClicked) window.setTimeout(() => runCheck(lastRunSettings).catch(() => undefined), 1800);
      return;
    }
    if (/visa application home|application home|dashboard|home/i.test(report.bodyText) && !VisaSlotLogic.isAppointmentPage(report.bodyText)) {
      report.message = 'Visa Application Home is already active. Starting the appointment workflow.';
      await chrome.runtime.sendMessage({ type: 'PAGE_REPORT', report });
      window.setTimeout(() => runCheck(lastRunSettings).catch(() => undefined), 350);
      return;
    }
    report.message = 'Visa Application Home control was not found. The next scheduled check will retry without leaving the current portal tab.';
    await chrome.runtime.sendMessage({ type: 'PAGE_REPORT', report });
  }

  async function runCheck(settings) {
    lastRunSettings = settings || {};
    automationEnabled = settings?.enabled !== false;
    if (!automationEnabled || !VisaSlotLogic.samePortalOrigin(location.href)) return;
    const text = bodyText();
    const report = {
      url: location.href,
      samePortalOrigin: true,
      allowedAutomationHost: true,
      bodyText: text.slice(0, 100000),
      humanVerification: detectChallenge(),
      waitingRoom: false,
      dashboard: false,
      appointmentPage: false,
      noSlot: false,
      slotFound: false,
      slotSummary: '',
      appointmentMode: settings.appointmentMode === 'reschedule' ? 'reschedule' : 'new',
      scheduleActionClicked: false,
      rescheduleActionClicked: false,
      appointmentActionClicked: false,
      homeResetClicked: false,
      sessionExpired: false
    };

    if (report.humanVerification) {
      await chrome.runtime.sendMessage({ type: 'PAGE_REPORT', report });
      return;
    }

    if (VisaSlotLogic.isWaitingRoomPage(text)) {
      report.waitingRoom = true;
      await chrome.runtime.sendMessage({ type: 'PAGE_REPORT', report });
      return;
    }

    if (VisaSlotLogic.isSessionExpiredText(text)) {
      report.sessionExpired = true;
      await chrome.runtime.sendMessage({ type: 'PAGE_REPORT', report });
      return;
    }

    if (VisaSlotLogic.isAppointmentPage(text)) {
      report.appointmentPage = true;
      report.noSlot = VisaSlotLogic.isNoSlotText(text);
      const selection = selectConsularPost(settings.consularPost);
      if (!selection.found) report.message = 'Appointment page detected, but the configured consular post control was not found.';
      else if (!selection.selected) report.message = 'The configured consular post was found but could not be selected automatically.';
      const matchingPost = selection.found && (selection.selected || VisaSlotLogic.matchesConfiguredPattern(text, settings.consularPost));
      report.slotFound = !report.noSlot && matchingPost && VisaSlotLogic.isLikelySlotPage(text);
      report.slotSummary = report.slotFound ? `Appointment availability is visible for ${settings.consularPost}.` : '';
      await chrome.runtime.sendMessage({ type: 'PAGE_REPORT', report });
      if (report.slotFound && settings.soundEnabled !== false) startSound();
      return;
    }

    const dashboard = VisaSlotLogic.isDashboardMenuPage(text) || /dashboard|home|profile|welcome/i.test(text);
    if (dashboard) {
      report.dashboard = true;
      const canAttemptNavigation = Date.now() - scheduleNavigationAttemptedAt > 10000;
      const action = canAttemptNavigation ? findAppointmentAction(report.appointmentMode) : null;
      report.appointmentActionClicked = Boolean(action && safeAppointmentAction(action));
      report.scheduleActionClicked = report.appointmentActionClicked && report.appointmentMode === 'new';
      report.rescheduleActionClicked = report.appointmentActionClicked && report.appointmentMode === 'reschedule';
      if (report.appointmentActionClicked) {
        scheduleNavigationAttemptedAt = Date.now();
        setTimeout(() => runCheck(lastRunSettings).catch(() => undefined), 1800);
      }
      const actionLabel = report.appointmentMode === 'reschedule' ? 'Reschedule Appointment' : 'Schedule Appointment';
      report.message = report.appointmentActionClicked
        ? `${actionLabel} was selected. Waiting for the appointment page to load.`
        : `Signed-in dashboard detected, but the visible ${actionLabel} action was not found yet.`;
      await chrome.runtime.sendMessage({ type: 'PAGE_REPORT', report });
      return;
    }

    report.message = 'The logged-in portal state was not recognized. Review the page and use manual retry if needed.';
    await chrome.runtime.sendMessage({ type: 'PAGE_REPORT', report });
  }

  function installPortalObserver() {
    if (!VisaSlotLogic.samePortalOrigin(location.href) || !window.MutationObserver) return;
    const observer = new MutationObserver(() => {
      if (!automationEnabled) return;
      const now = Date.now();
      if (mutationTimer || now - lastMutationCheckAt < 1500) return;
      mutationTimer = window.setTimeout(() => {
        mutationTimer = null;
        lastMutationCheckAt = Date.now();
        runCheck(lastRunSettings).catch(() => undefined);
      }, 400);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  installPortalObserver();

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === 'RESET_TO_HOME') resetToVisaApplicationHome(message.settings || {});
    if (message?.type === 'RUN_CHECK') runCheck(message.settings || {});
    if (message?.type === 'PAGE_READY') runCheck(message.settings || {});
    if (message?.type === 'SHOW_ALERT') {
      showOverlay('slot', 'A possible slot is visible. Review the appointment details in the portal before taking action.', message.summary || '');
      if (message.soundEnabled !== false) startSound();
    }
    if (message?.type === 'STOP_AUTOMATION') {
      automationEnabled = false;
      lastRunSettings = { enabled: false };
      if (mutationTimer) window.clearTimeout(mutationTimer);
      mutationTimer = null;
      stopSound();
      hideOverlay();
    }
    if (message?.type === 'STOP_ALERT') {
      stopSound();
      hideOverlay();
    }
  });
})();
