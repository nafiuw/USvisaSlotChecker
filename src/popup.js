document.addEventListener('DOMContentLoaded', async () => {
  const root = document;
  await refreshUi(root);

  root.querySelector('[data-monitor-toggle]')?.addEventListener('change', async (event) => {
    const saved = await uiSend('SAVE_CONFIG', { config: formConfig(root) });
    if (!saved?.ok) {
      flash(root, saved?.error || 'Could not save settings.', 'error');
      event.target.checked = false;
      return;
    }
    const result = event.target.checked ? await uiSend('START') : await uiSend('STOP');
    if (result?.ok) renderStatus(root, result.status);
    else flash(root, result?.error || 'Could not change monitoring state.', 'error');
  });

  root.querySelector('[data-action="save"]')?.addEventListener('click', async () => {
    const result = await uiSend('SAVE_CONFIG', { config: formConfig(root) });
    if (result?.ok) {
      renderStatus(root, result.status);
      flash(root, 'Settings saved locally.');
    } else {
      flash(root, result?.error || 'Could not save settings.', 'error');
    }
  });

  root.querySelector('[data-action="manual"]')?.addEventListener('click', async () => {
    const saved = await uiSend('SAVE_CONFIG', { config: formConfig(root) });
    if (!saved?.ok) {
      flash(root, saved?.error || 'Could not save settings.', 'error');
      return;
    }
    const result = await uiSend('MANUAL_CHECK');
    if (result?.ok) {
      renderStatus(root, result.status);
      flash(root, 'Manual check requested.');
    } else {
      flash(root, result?.error || 'Could not request a check.', 'error');
    }
  });

  root.querySelector('[data-action="portal"]')?.addEventListener('click', async () => {
    await uiSend('OPEN_PORTAL');
    flash(root, 'Opened the exact portal entry page. Complete any human verification manually.');
  });

  root.querySelector('[data-action="silence"]')?.addEventListener('click', async () => {
    const result = await uiSend('SILENCE_ALERT');
    if (result?.ok) renderStatus(root, result.status);
  });

  root.querySelector('[data-action="reset"]')?.addEventListener('click', async () => {
    const result = await uiSend('RESET_RESULT');
    if (result?.ok) {
      renderStatus(root, result.status);
      flash(root, 'Slot result cleared.');
    }
  });

  root.querySelector('[data-action="options"]')?.addEventListener('click', () => uiSend('OPEN_OPTIONS'));

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === 'STATUS_UPDATED') renderStatus(root, message.status);
  });
});
