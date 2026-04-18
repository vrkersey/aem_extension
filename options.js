'use strict';

const STORAGE_KEYS = [
  'configVersion', 'programName', 'program_id',
  'dev_env_id', 'stage_env_id', 'prod_env_id',
  'dev_env_url', 'stage_env_url', 'prod_env_url', 'prod_prev_url',
  'mode_admin', 'mode_developer',
];

const FIELD_IDS = [
  'programName', 'program_id',
  'dev_env_id', 'stage_env_id', 'prod_env_id',
  'dev_env_url', 'stage_env_url', 'prod_env_url', 'prod_prev_url',
  'mode_admin', 'mode_developer',
];

(async function init() {
  await loadConfig();
  bindEvents();
})();

// ── Load ──────────────────────────────────────────────────────────────────────

async function loadConfig() {
  // Prefer sync storage (cross-device source of truth); fall back to local
  // if sync is empty or unavailable.
  let data = {};
  try {
    data = await BrowserUtil.storageSyncGet(STORAGE_KEYS);
  } catch (_) { /* sync unavailable */ }

  if (!data.configVersion) {
    data = await BrowserUtil.storageGet(STORAGE_KEYS);
  }

  for (const id of FIELD_IDS) {
    const el = document.getElementById(id);
    if (!el) continue;
    if (el.type === 'checkbox') {
      el.checked = !!data[id];
    } else {
      el.value = data[id] != null ? String(data[id]) : '';
    }
  }
}

// ── Events ────────────────────────────────────────────────────────────────────

function bindEvents() {
  document.getElementById('options-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveConfig();
  });

  document.getElementById('btn-clear').addEventListener('click', async () => {
    if (!confirm('Clear all configuration? This cannot be undone.')) return;
    const nulled = Object.fromEntries(STORAGE_KEYS.map(k => [k, null]));
    await BrowserUtil.storageSet(nulled);
    try {
      await BrowserUtil.storageSyncSet(nulled);
    } catch (_) { /* sync unavailable; non-fatal */ }
    for (const id of FIELD_IDS) {
      const el = document.getElementById(id);
      if (!el) continue;
      if (el.type === 'checkbox') el.checked = false;
      else el.value = '';
      el.classList.remove('invalid');
    }
    showStatus('Configuration cleared.', false);
  });
}

// ── Save ──────────────────────────────────────────────────────────────────────

async function saveConfig() {
  clearValidation();

  const program_id = getNumber('program_id');
  if (!program_id) {
    markInvalid('program_id');
    showStatus('Program ID is required.', true);
    return;
  }

  const dev_env_id   = getNumber('dev_env_id');
  const stage_env_id = getNumber('stage_env_id');
  const prod_env_id  = getNumber('prod_env_id');

  if (!dev_env_id && !stage_env_id && !prod_env_id) {
    markInvalid('dev_env_id');
    markInvalid('stage_env_id');
    markInvalid('prod_env_id');
    showStatus('At least one Environment ID is required.', true);
    return;
  }

  const URL_FIELDS = ['dev_env_url', 'stage_env_url', 'prod_env_url', 'prod_prev_url'];
  const invalidUrls = URL_FIELDS.filter(id => {
    const val = getText(id);
    return val && !/^https?:\/\//i.test(val);
  });
  if (invalidUrls.length > 0) {
    invalidUrls.forEach(markInvalid);
    showStatus('URLs must start with https:// or http://.', true);
    return;
  }

  const data = {
    configVersion: 2,
    programName:   getText('programName') || 'AEM Program',
    program_id,
    dev_env_id:    dev_env_id   || null,
    stage_env_id:  stage_env_id || null,
    prod_env_id:   prod_env_id  || null,
    dev_env_url:   getUrl('dev_env_url')   || null,
    stage_env_url: getUrl('stage_env_url') || null,
    prod_env_url:  getUrl('prod_env_url')  || null,
    prod_prev_url: getUrl('prod_prev_url') || null,
    mode_admin:    getChecked('mode_admin'),
    mode_developer: getChecked('mode_developer'),
  };

  // Write to local first (keeps popup fast), then mirror to sync.
  await BrowserUtil.storageSet(data);
  try {
    await BrowserUtil.storageSyncSet(data);
  } catch (_) {
    // Sync storage may be unavailable (e.g. not signed in); non-fatal.
  }

  showStatus('Saved!', false);
}

// ── Field helpers ─────────────────────────────────────────────────────────────

function getText(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function getNumber(id) {
  const val = parseInt(getText(id), 10);
  return isNaN(val) || val <= 0 ? null : val;
}

function getUrl(id) {
  const val = getText(id);
  if (!val) return null;
  try {
    const u = new URL(val);
    return u.origin; // strip trailing slash and path
  } catch (_) {
    return val; // return as-is if not a valid URL
  }
}

function getChecked(id) {
  const el = document.getElementById(id);
  return el ? el.checked : false;
}

function markInvalid(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('invalid');
}

function clearValidation() {
  document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
}

// ── Status ────────────────────────────────────────────────────────────────────

let statusTimer = null;

function showStatus(msg, isError) {
  const el = document.getElementById('save-status');
  if (!el) return;
  el.textContent = msg;
  el.className = isError ? 'error' : '';
  if (statusTimer) clearTimeout(statusTimer);
  statusTimer = setTimeout(() => { el.textContent = ''; }, 3000);
}
