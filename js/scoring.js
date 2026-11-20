/**
 * English Placement Test - Scoring Engine & AI Grading
 */

/**
 * Filters and orders questions for a given skill and target grade.
 */
const qsFor = (sk, g) =>
  D.qs
    .filter(q => q.sk == sk && g >= q.g1 && g <= q.g2)
    .sort((a, b) => (a.type == 'read' ? 0 : 1) - (b.type == 'read' ? 0 : 1) || L.indexOf(a.lv) - L.indexOf(b.lv));

/**
 * Normalizes text for case-insensitive and punctuation-free comparisons.
 */
const nz = s => String(s).trim().toLowerCase().replace(/[.!?]$/, '');

/**
 * Validates a student's answer against accepted solutions.
 */
const chk = (q, x) => (q.type == 'mcq' ? x == q.ans : q.ans.split('|').some(a => nz(a) == nz(x)));

/**
 * Calculates highest CEFR level reached given a score threshold.
 */
function lvl(it) {
  const th = D.th / 100;
  let r = 0;
  let ok = true;

  L.forEach((l, i) => {
    const x = it.filter(y => y.lv == l);
    const p = x.reduce((s, y) => s + y.pts, 0);
    if (!p) return;
    const f = x.reduce((s, y) => s + y.got, 0) / p;
    if (f >= th && ok) r = i;
    else if (f < th) ok = false;
  });

  return r;
}

/**
 * Analyzes a completed attempt, computing scores for each skill and overall.
 */
function an(a) {
  const S2 = {};
  let pend = false;

  ['Reading', 'Listening'].forEach(sk => {
    const it = a.res.filter(x => x.sk == sk);
    const p = it.reduce((s, x) => s + x.pts, 0);
    if (p) {
      S2[sk] = {
        pct: Math.round((it.reduce((s, x) => s + x.got, 0) / p) * 100),
        lv: lvl(it),
        src: 'Automático'
      };
    }
  });

  ['Writing', 'Speaking'].forEach(sk => {
    if (!a.open.some(x => x.sk == sk)) return;
    const r = a.rub[sk];
    if (r && r.lv !== '') {
      S2[sk] = {
        pct: Math.round((r.c.reduce((s, v) => s + v, 0) / 16) * 100),
        lv: +r.lv,
        src: 'Docente'
      };
    } else {
      pend = true;
    }
  });

  const k = Object.keys(S2);
  return {
    S2,
    pend,
    pct: k.length ? Math.round(k.reduce((s, x) => s + S2[x].pct, 0) / k.length) : 0,
    lv: k.length ? Math.floor(k.reduce((s, x) => s + S2[x].lv, 0) / k.length) : 0
  };
}

/**
 * Automated evaluation of Writing submissions using Claude AI if available in the environment.
 */
async function aiW(id) {
  const a = D.att.find(x => x.id == id);
  const it = a.open.filter(x => x.sk == 'Writing');
  if (!it.some(x => (x.given || '').trim())) return toast('El aspirante no escribió texto.');

  let sm = null;
  try {
    sm = await window.claude.use('sample');
  } catch (e) {}

  if (!sm) {
    return toast('La calificación con Claude no está disponible aquí. Abre la página desde claude.ai con tu sesión iniciada.');
  }

  S.busy = 1;
  R();

  const p = `Eres evaluador de inglés de un colegio colombiano. Evalúa los textos de un aspirante a grado ${a.g}° de primaria con el MCER (Pre-A1 a C2), considerando lo esperable para su edad. Criterios, cada uno de 0 a 4 (0 no evidenciado, 2 parcial, 4 sólido): ${RUB.Writing.join('; ')}.\n${it.map((x, i) => `[${i + 1}] Consigna (${x.lv}): ${x.q}\nRespuesta: ${x.given || '(vacío)'}`).join('\n')}\nResponde SOLO JSON: {"c":[n,n,n,n],"lv":"Pre-A1|A1|A2|B1|B2|C1|C2","cm":"justificación en español, máx. 80 palabras","err":[{"e":"error","f":"corrección","n":"explicación breve en español"}]} con máximo 6 errores.`;

  try {
    const r = await sm.json(p);
    const li = L.indexOf(r.lv);
    if (!Array.isArray(r.c) || r.c.length != 4 || li < 0) throw 0;

    a.rub.Writing = {
      c: r.c.map(v => Math.max(0, Math.min(4, Math.round(+v || 0)))),
      lv: String(li),
      cm: String(r.cm || ''),
      ai: 1,
      err: (r.err || []).slice(0, 6)
    };
    save();
    S.busy = 0;
    R();
  } catch (e) {
    S.busy = 0;
    toast(
      e && e.code == 'not_granted'
        ? 'Permiso denegado para usar Claude.'
        : e && e.code == 'rate_limited'
        ? 'Límite de uso alcanzado. Intenta más tarde.'
        : 'No se pudo calificar. Intenta de nuevo.'
    );
  }
}

/**
 * Automated dictation prompt generation using Claude AI if available.
 */
async function aiL() {
  const e = S.e;
  let sm = null;
  try {
    sm = await window.claude.use('sample');
  } catch (x) {}

  if (!sm) return toast('Disponible solo desde claude.ai con tu sesión iniciada.');

  S.busy = 1;
  R();
  const w = { 1: '8 a 15', 2: '15 a 25', 3: '25 a 35', 4: '30 a 45', 5: '40 a 60' }[e.g1] || '20 a 40';

  try {
    const r = await sm.json(
      `Escribe un texto de dictado en inglés americano para aspirantes a grado ${G[e.g1]} de primaria (Colombia), nivel MCER ${e.lv}, tema: ${e.tp}. Entre ${w} palabras, frases cortas y claras, vocabulario y gramática propios del nivel, sin números ni símbolos. Responde SOLO JSON: {"script":"el texto"}`
    );
    if (!r.script) throw 0;
    e.script = String(r.script);
    S.busy = 0;
    R();
  } catch (x) {
    S.busy = 0;
    toast(
      x && x.code == 'not_granted'
        ? 'Permiso denegado para usar Claude.'
        : x && x.code == 'rate_limited'
        ? 'Límite de uso alcanzado. Intenta más tarde.'
        : 'No se pudo redactar. Intenta de nuevo.'
    );
  }
}
