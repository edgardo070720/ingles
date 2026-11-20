/**
 * English Placement Test - Utilities & Helpers
 */

// DOM Selector shortcut
const $ = s => document.querySelector(s);

// Unique ID generator
const uid = () => Math.random().toString(36).slice(2, 9);

// HTML escaping to prevent XSS
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;'
}[c]));

// Select element option generators
const opt = (a, s) => a.map((x, i) => `<option value="${i}"${String(i) == String(s) ? ' selected' : ''}>${esc(x)}</option>`).join('');
const ops = (a, s) => a.map(x => `<option${x == s ? ' selected' : ''}>${esc(x)}</option>`).join('');
const optG = s => [1, 2, 3, 4, 5].map(i => `<option value="${i}"${i == s ? ' selected' : ''}>${G[i]}</option>`).join('');

// Generate SVG placeholder data URL
const pic = (t, bg, h) => {
  h = h || 120;
  const n = [...t.replace(/\s/g, '')].length;
  const fs = Math.min(76, Math.floor(430 / n / 1.2));
  return 'data:image/svg+xml,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 ${h}"><rect width="480" height="${h}" rx="18" fill="${bg || '#e8f0ff'}"/><text x="240" y="${h / 2 + fs * 0.35}" font-size="${fs}" text-anchor="middle">${t}</text></svg>`
  );
};

// Retrieve audio source (handles base64 reference or direct URL)
const au = q => (q.aud && q.aud[0] == '@' ? (D.audios || {})[q.aud.slice(1)] || '' : q.aud);

// Progress bar HTML snippet
const bar = p => `<div class="bar"><i style="width:${p}%"></i></div>`;

// Toast notification helper
const toast = m => {
  S.m = m;
  R();
};

// Two-step confirmation for destructive actions
const cf = (k, f) => {
  if (S.cf == k) {
    S.cf = 0;
    f();
  } else {
    S.cf = k;
    toast('Pulsa de nuevo para confirmar.');
  }
};

// ==========================================================================
// Dictation Diff & Scoring (Levenshtein Distance)
// ==========================================================================

// Tokenize text into words
const dnw = x => String(x).toLowerCase()
  .replace(/[’‘]/g, "'")
  .replace(/[^a-z0-9'\s]/g, ' ')
  .split(/\s+/)
  .filter(Boolean);

// Character-level Levenshtein distance
const dl = (a, b) => {
  const m = [...Array(a.length + 1)].map((_, i) => [i]);
  for (let j = 1; j <= b.length; j++) m[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      m[i][j] = Math.min(
        m[i - 1][j] + 1,
        m[i][j - 1] + 1,
        m[i - 1][j - 1] + (a[i - 1] == b[j - 1] ? 0 : 1)
      );
    }
  }
  return m[a.length][b.length];
};

// Word distance cost: exact match = 0, small typo (length > 3 and distance <= 1) = 0.5, else 1
const dsc = (a, b) => (a == b ? 0 : (a.length > 3 && b.length > 3 && dl(a, b) <= 1 ? 0.5 : 1));

// Word-level alignment and diff calculation
function dcmp(o, g) {
  const A = dnw(o), B = dnw(g), n = A.length, m = B.length;
  const d = [...Array(n + 1)].map(() => Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) d[i][0] = i;
  for (let j = 0; j <= m; j++) d[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + dsc(A[i - 1], B[j - 1])
      );
    }
  }

  let i = n, j = m;
  const ops = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && d[i][j] == d[i - 1][j - 1] + dsc(A[i - 1], B[j - 1])) {
      const c = dsc(A[i - 1], B[j - 1]);
      ops.unshift([c == 0 ? 'ok' : c == 0.5 ? 'near' : 'sub', A[i - 1], B[j - 1]]);
      i--;
      j--;
    } else if (i > 0 && d[i][j] == d[i - 1][j] + 1) {
      ops.unshift(['del', A[i - 1]]);
      i--;
    } else {
      ops.unshift(['ins', '', B[j - 1]]);
      j--;
    }
  }
  return { ops, cost: d[n][m], n };
}
