const DEFAULT_MAX_PAGES = 15;
const DEFAULT_DEBUG = false;

const maxPagesInput = document.getElementById('maxPages');
const debugInput = document.getElementById('debugMode');
const saveBtn = document.getElementById('save');
const status = document.getElementById('status');

browser.storage.sync.get({ maxPages: DEFAULT_MAX_PAGES, debug: DEFAULT_DEBUG }).then(settings => {
  maxPagesInput.value = settings.maxPages;
  debugInput.checked = settings.debug;
});

saveBtn.addEventListener('click', () => {
  const maxPages = Math.max(1, Math.min(100, parseInt(maxPagesInput.value, 10) || DEFAULT_MAX_PAGES));
  const debug = debugInput.checked;

  maxPagesInput.value = maxPages;

  browser.storage.sync.set({ maxPages, debug }).then(() => {
    status.textContent = 'Guardado.';
    setTimeout(() => { status.textContent = ''; }, 2000);
  });
});
