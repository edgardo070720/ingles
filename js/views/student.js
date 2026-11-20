/**
 * English Placement Test - Student Flow Views & Controls
 */

/**
 * Renders an individual question card based on its skill and type.
 */
function qh(q, n) {
  let h = `<div class="c"><div class="t"><span class="tag">${n}</span>${
    q.sk == 'Speaking'
      ? `<span class="tag">${q.type == 'read' ? 'Parte 1 · Lectura en voz alta' : 'Parte 2 · Habla libre'}</span>`
      : ''
  }${q.tp ? `<span class="tag">${esc(q.tp)}</span>` : ''}</div>`;

  // Listening audio or TTS button
  if (q.sk == 'Listening' && q.type != 'dict') {
    h += au(q)
      ? `<audio controls src="${au(q)}"></audio>`
      : `<button class="s" onclick="say('${q.id}')">▶ Escuchar</button> <button class="s" onclick="say('${q.id}',1)">🐢 Más despacio</button>`;
  }

  // Reading context passage / Image / Question text
  if (q.txt) h += `<p style="white-space:pre-wrap">${esc(q.txt)}</p>`;
  if (q.img) h += `<img src="${q.img}" style="max-width:100%;border-radius:8px">`;
  h += `<p><b>${esc(q.q)}</b></p>`;

  // Input widgets by type
  if (q.type == 'mcq') {
    h += q.opts
      .map(
        o =>
          `<label class="o"><input type="radio" name="${q.id}" data-v="${esc(o)}"${
            S.ans[q.id] == o ? ' checked' : ''
          } onchange="S.ans['${q.id}']=this.dataset.v">${esc(o)}</label>`
      )
      .join('');
  } else if (q.type == 'text') {
    h += `<input value="${esc(S.ans[q.id])}" oninput="S.ans['${q.id}']=this.value">`;
  } else if (q.sk == 'Writing' || q.type == 'dict') {
    h += `<textarea rows="6" oninput="S.ans['${q.id}']=this.value">${esc(S.ans[q.id])}</textarea>`;
  } else {
    // Speaking audio recorder
    h += `<button id="rb${q.id}" onclick="rec('${q.id}')">● Grabar</button> <audio id="rp${q.id}" controls ${
      S.ans[q.id] ? `src="${S.ans[q.id]}"` : 'hidden'
    }></audio>`;
  }

  return h + '</div>';
}

/**
 * Initiates the assessment for a student.
 */
function start() {
  const n = $('#nm').value.trim();
  if (!n) return toast('Escribe el nombre del aspirante.');
  const g = +$('#gr').value;
  S.stu = { n, g };
  S.steps = SK.filter(s => qsFor(s, g).length);
  if (!S.steps.length) return toast('No hay preguntas para este grado.');
  S.i = 0;
  S.ans = {};
  S.v = 'test';
  R();
}

/**
 * Navigates to the next skill section or triggers completion.
 */
function nx() {
  if (S.i < S.steps.length - 1) {
    S.i++;
    scrollTo(0, 0);
    R();
  } else {
    finish();
  }
}

/**
 * Grades objective questions, collects submissions, and stores the attempt.
 */
function finish() {
  const a = {
    id: uid(),
    n: S.stu.n,
    g: S.stu.g,
    d: new Date().toISOString(),
    res: [],
    open: [],
    rub: {},
    note: ''
  };

  SK.flatMap(sk => qsFor(sk, a.g)).forEach(q => {
    const x = S.ans[q.id] || '';
    const b = { sk: q.sk, lv: q.lv, tp: q.tp, q: q.q };

    if (q.type == 'open' || q.type == 'read') {
      a.open.push({ ...b, ty: q.type, txt: q.txt, given: x });
    } else if (q.type == 'dict') {
      const c = dcmp(q.script, x);
      const n = c.n;
      a.res.push({
        ...b,
        given: x,
        ans: q.script,
        pts: n,
        got: Math.max(0, n - c.cost),
        ok: c.cost <= n * 0.2,
        d: c.ops,
        ty: 'dict'
      });
    } else {
      const ok = chk(q, x);
      a.res.push({
        ...b,
        given: x,
        ans: q.ans,
        ok,
        pts: q.pts,
        got: ok ? q.pts : 0
      });
    }
  });

  D.att.unshift(a);
  save();

  // Automatically send to Google Sheets if configured
  if (getGoogleSheetUrl()) {
    sendToGoogleSheets(a).catch(err => console.error('Error enviando a Google Sheets:', err));
  }

  S.v = 'done';
  R();
}
