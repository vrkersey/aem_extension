'use strict';

/**
 * Schema Viewer
 * Collects every <script type="application/ld+json"> block from the current
 * page and its frames (any site; includes the content frame inside the
 * Author editor) and renders them inline in the popup as a collapsible tree.
 */
(function () {
  window.__aemToolInits = window.__aemToolInits || [];
  window.__aemToolInits.push(function (state, tabId) {
    const btn = document.getElementById('btn-view-schema');
    if (!btn) return;
    BrowserUtil.wireClick(btn, () => openPanel(tabId));

    document.getElementById('btn-schema-back').addEventListener('click', closePanel);
  });

  // ── Panel ────────────────────────────────────────────────────────────────

  async function openPanel(tabId) {
    const out     = document.getElementById('schema-out');
    const summary = document.getElementById('schema-summary');
    const toggle  = document.getElementById('btn-schema-toggle');
    const copyAll = document.getElementById('btn-schema-copy-all');

    out.replaceChildren();
    summary.textContent = 'Reading page…';
    toggle.hidden = copyAll.hidden = true;
    document.body.classList.add('-schema-open');

    try {
      const results = await BrowserUtil.api.scripting.executeScript({
        target: { tabId, allFrames: true },
        func: collect,
      });
      render(dedupe(results));
    } catch (err) {
      summary.textContent = "Can't read this page";
      out.append(el('p', 'schema-empty', err.message));
    }
  }

  function closePanel() {
    document.body.classList.remove('-schema-open');
  }

  // Runs in the page. Reads the live DOM, so tag-manager-injected blocks are included.
  function collect() {
    return [...document.querySelectorAll('script[type="application/ld+json"]')]
      .map((s) => s.textContent.trim())
      .filter(Boolean);
  }

  // The editor wraps the page in an iframe, so the same block may appear in
  // more than one frame result.
  function dedupe(results) {
    const raws = [...new Set((results || []).flatMap((r) => r.result || []))];
    return raws.map((raw) => {
      try {
        return { data: JSON.parse(raw) };
      } catch (e) {
        return { error: e.message, raw };
      }
    });
  }

  // ── Rendering ────────────────────────────────────────────────────────────

  function render(blocks) {
    const out     = document.getElementById('schema-out');
    const summary = document.getElementById('schema-summary');
    const toggle  = document.getElementById('btn-schema-toggle');
    const copyAll = document.getElementById('btn-schema-copy-all');

    if (!blocks.length) {
      summary.textContent = 'No JSON-LD on this page';
      out.append(el('p', 'schema-empty', 'No <script type="application/ld+json"> tags found.'));
      return;
    }

    const bad = blocks.filter((b) => b.error).length;
    summary.textContent =
      `${blocks.length} block${blocks.length > 1 ? 's' : ''}` + (bad ? `, ${bad} invalid` : '');

    blocks.forEach((b, i) => {
      const sec = el('section', 'schema-block');
      const h   = el('h2');
      h.append(el('span', b.error ? 'err' : null, b.error ? `Block ${i + 1}: invalid JSON` : typesOf(b.data)));
      sec.append(h);
      if (b.error) {
        sec.append(el('div', 'err', b.error), el('pre', null, b.raw));
      } else {
        sec.append(node(null, b.data, 0));
      }
      out.append(sec);
    });

    const valid = blocks.filter((b) => !b.error).map((b) => b.data);
    if (!valid.length) return;

    copyAll.hidden = toggle.hidden = false;
    copyAll.onclick = () => flashCopy(copyAll, 'Copy all', JSON.stringify(valid, null, 2));

    toggle.textContent = 'Expand all';
    toggle.onclick = () => {
      const expand = toggle.textContent === 'Expand all';
      out.querySelectorAll('details').forEach((d) => { d.open = expand; });
      toggle.textContent = expand ? 'Collapse all' : 'Expand all';
    };
  }

  /** Summarise the @type(s) of a block, including nodes inside an @graph. */
  function typesOf(d) {
    const nodes = Array.isArray(d) ? d : (d && d['@graph']) || [d];
    return [...new Set(nodes.flatMap((n) => (n && n['@type']) || []))].join(', ') || 'No @type';
  }

  function node(key, val, depth) {
    if (val === null || typeof val !== 'object') {
      const row = el('div', 'leaf');
      if (key != null) row.append(el('span', 'k', `${key}: `));
      if (typeof val === 'string' && /^https?:\/\//.test(val)) {
        const a = el('a', 'string', JSON.stringify(val));
        a.href   = val;
        a.target = '_blank';
        a.rel    = 'noopener';
        row.append(a);
      } else {
        row.append(el('span', val === null ? 'null' : typeof val, JSON.stringify(val)));
      }
      return row;
    }

    const isArr = Array.isArray(val);
    const d = el('details');
    d.open = depth < 2;
    const s = el('summary');
    if (key != null) s.append(el('span', key.startsWith('@') ? 'k at' : 'k', `${key} `));
    const type = !isArr && val['@type'] ? [].concat(val['@type']).join(', ') : '';
    s.append(el('span', 'hint', isArr ? `[${val.length}]` : type || `{${Object.keys(val).length}}`));
    d.append(s);
    for (const [k, v] of Object.entries(val)) d.append(node(k, v, depth + 1));
    return d;
  }

  function copyButton(label, getText) {
    const b = el('button', 'schema-btn', label);
    b.addEventListener('click', () => flashCopy(b, label, getText()));
    return b;
  }

  async function flashCopy(btn, label, text) {
    await navigator.clipboard.writeText(text);
    btn.textContent = 'Copied';
    setTimeout(() => { btn.textContent = label; }, 1200);
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
})();
