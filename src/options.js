document.addEventListener('DOMContentLoaded', async () => {
  const root = document;
  await refreshUi(root);

  root.querySelector('[data-action="save"]')?.addEventListener('click', async () => {
    const result = await uiSend('SAVE_CONFIG', { config: formConfig(root) });
    if (result?.ok) {
      renderStatus(root, result.status);
      flash(root, 'Monitoring settings saved locally.');
    } else {
      flash(root, result?.error || 'Could not save settings.', 'error');
    }
  });

  root.querySelector('[data-action="portal"]')?.addEventListener('click', async () => {
    await uiSend('OPEN_PORTAL');
    flash(root, 'Opened the portal entry page. Log in first, then turn monitoring on from the popup.');
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === 'STATUS_UPDATED') renderStatus(root, message.status);
  });
});
