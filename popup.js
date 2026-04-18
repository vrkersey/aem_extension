'use strict';

(async function () {
  // ── Fetch state ───────────────────────────────────────────────────────────

  let state = null;
  let tabId  = null;

  try {
    state = await buildState();
    tabId = state.tabId;
  } catch (err) {
    console.error('[AEM Tools] Failed to build state:', err);
    showError('Could not load extension state.');
    return;
  }

  // ── Apply context classes to <body> ───────────────────────────────────────

  const body = document.body;
  const ctx  = state.context;

  if (ctx.isAem)     body.classList.add('-aem');
  if (ctx.isAuthor)  body.classList.add('-author');
  if (ctx.isPublish) body.classList.add('-publish');
  if (ctx.isPage)    body.classList.add('-page');

  if (state.modes.admin)     body.classList.add('-mode-admin');
  if (state.modes.developer) body.classList.add('-mode-developer');

  if (state.configured)          body.classList.add('-configured');
  if (state.hasCookiePermission) body.classList.add('-has-cookies');
  if (ctx.env)                   body.classList.add(`-env-${ctx.env}`);

  // ── Update context label ──────────────────────────────────────────────────

  const label = document.getElementById('context-label');
  if (label) {
    if (ctx.isPage) {
      const instance = ctx.isAuthor ? 'Author' : 'Publish';
      const name     = state.domain ? state.domain.name : 'AEM';
      label.textContent = `${name} — ${instance}`;
    } else if (ctx.isAem) {
      label.textContent = 'AEM (non-page)';
    } else {
      label.textContent = 'Not an AEM page';
    }
  }

  const badge = document.getElementById('env-badge');
  if (badge) {
    if (ctx.env) {
      badge.textContent = ctx.env.toUpperCase();
      badge.dataset.env = ctx.env;
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }

  // ── Client cookie badge ───────────────────────────────────────────────────

  const cookieBadge = document.getElementById('client-cookie-badge');
  if (cookieBadge && state.hasCookiePermission && state.currentUrl) {
    try {
      const cookies  = await BrowserUtil.api.cookies.getAll({ name: 'pcty_audience' });
      const isClient = cookies.some(c => c.value === 'client');
      cookieBadge.textContent    = isClient ? 'CLIENT' : 'PROSPECT';
      cookieBadge.dataset.cookie = isClient ? 'client' : 'none';
      cookieBadge.hidden = false;
    } catch (_) {
      // Cookie API unavailable for this page — leave badge hidden
    }
  }

  // ── Show no-config notice if not configured ───────────────────────────────

  if (!state.configured) {
    const msg = document.getElementById('no-config-msg');
    if (msg) msg.style.display = 'block';
  }

  // ── Wire options buttons ──────────────────────────────────────────────────

  document.getElementById('btn-options').addEventListener('click', () => {
    BrowserUtil.openOptionsPage();
    //window.close();
  });

  const btnOpenOptionsMsg = document.getElementById('btn-open-options-msg');
  if (btnOpenOptionsMsg) {
    btnOpenOptionsMsg.addEventListener('click', () => {
      BrowserUtil.openOptionsPage();
      //window.close();
    });
  }

  // ── Enable / disable buttons based on current context ────────────────────
  // All buttons are always visible; disabled ones are greyed out and
  // non-interactive.  Conditions mirror the former CSS class rules.

  const { isAem, isAuthor, isPublish, isPage, env } = ctx;
  const { admin, developer } = state.modes;

  const DISABLED_REASONS = {
    'btn-toggle-preview':       'Requires an AEM Author page',
    'btn-go-to-author':         'Requires an AEM Publish page',
    'btn-go-to-adobe-publish':  'Requires a configured cloud AEM environment',
    'btn-go-to-publish':        'Requires an AEM Author page',
    'btn-go-to-dam':            'Requires an AEM page',
    'btn-cache-bypass':         'Requires an AEM Publish page',
    'btn-toggle-json':          'Requires Developer Mode and an AEM Author page',
    'btn-manage-publication':   'Requires an AEM Author page',
    'btn-toggle-client-cookie': 'Requires cookie permission',
    'btn-purge-cache':          'Requires Admin Mode and an AEM page',
    'btn-prod-author':          'Requires extension configuration',
    'btn-stage-author':         'Requires extension configuration',
    'btn-dev-author':           'Requires extension configuration',
    'btn-cloud-manager':        'Requires Developer Mode',
    'btn-adobe-target':         'Requires Developer Mode',
    'btn-admin-console':        'Requires Admin Mode',
  };
  const originalTitles = {};

  function setEnabled(id, condition) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!(id in originalTitles)) originalTitles[id] = el.title;
    el.disabled = !condition;
    el.title = condition ? originalTitles[id] : (DISABLED_REASONS[id] || originalTitles[id] || '');
  }

  // Left column — Page Tools
  setEnabled('btn-toggle-preview',       isAuthor && isPage);
  setEnabled('btn-go-to-author',         isPublish);
  const adobePublishOrigin = isAem && env && env !== 'local' &&
    state.domain && state.domain.cloudPublishOrigins && state.domain.cloudPublishOrigins[env];
  setEnabled('btn-go-to-adobe-publish',  !!adobePublishOrigin);
  setEnabled('btn-go-to-publish',        isAuthor && isPage);
  setEnabled('btn-go-to-dam',            isAem);
  setEnabled('btn-cache-bypass',         isPublish && isPage);
  setEnabled('btn-toggle-json',          developer && isAuthor && isPage);

  // Middle column — Advanced
  setEnabled('btn-manage-publication',   isAuthor && isPage);
  setEnabled('btn-toggle-client-cookie', state.hasCookiePermission);
  setEnabled('btn-purge-cache',          admin && isPage);

  // Right column — Quick Links
  setEnabled('btn-prod-author',          state.configured);
  setEnabled('btn-stage-author',         state.configured);
  setEnabled('btn-dev-author',           state.configured);
  setEnabled('btn-cloud-manager',        developer);
  setEnabled('btn-adobe-target',         developer);
  setEnabled('btn-admin-console',        admin);

  // ── Initialise tool modules ───────────────────────────────────────────────
  // Each tool file pushes an init function into window.__aemToolInits.
  // We call each one with the current state and tabId so they can wire
  // their button click handlers.

  const inits = window.__aemToolInits || [];
  for (const init of inits) {
    try {
      init(state, tabId);
    } catch (err) {
      console.error('[AEM Tools] Tool init failed:', err);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function showError(msg) {
    let el = document.getElementById('error-msg');
    if (!el) {
      el = document.createElement('div');
      el.id = 'error-msg';
      el.style.cssText = 'padding:10px 12px;color:#c0392b;font-size:11px;text-align:center;';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.display = 'block';
  }
})();
