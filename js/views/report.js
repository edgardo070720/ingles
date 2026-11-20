/**
 * English Placement Test - Candidate Diagnostic Report View
 */

/**
 * Updates teacher rubric criteria or assigned level for an open-ended skill.
 */
function sr(id, sk, k, v, i) {
  const a = D.att.find(x => x.id == id);
  const r = (a.rub[sk] = a.rub[sk] || { c: [0, 0, 0, 0], lv: '', cm: '' });
  if (k == 'c') r.c[i] = +v;
  else r[k] = v;
  save();
  R();
}

/**
 * Generates the full printable diagnostic report for an applicant.
 */
function rep(a) {
  const r = an(a);
  const fs = Object.entries(r.S2);
  const st = fs.filter(([k, v]) => v.pct >= 70).map(x => x[0]);
  const wk = fs.filter(([k, v]) => v.pct < 60).map(x => x[0]);
  const tp = {};

  a.res.forEach(x => {
    const t = x.tp || 'General';
    tp[t] = tp[t] || [0, 0];
    tp[t][1]++;
    if (!x.ok) tp[t][0]++;
  });

  const wt = Object.entries(tp)
    .filter(([t, v]) => v[0] / v[1] >= 0.5)
    .map(x => x[0]);
  const er = a.res.filter(x => !x.ok && !x.ty);

  const rc = ['Writing', 'Speaking']
    .map(sk =>
      a.rub[sk]
        ? RUB[sk]
            .map((c, i) => [c, a.rub[sk].c[i]])
            .filter(x => x[1] >= 3)
            .map(x => x[0])
        : []
    )
    .flat();

  const rw = ['Writing', 'Speaking']
    .map(sk =>
      a.rub[sk]
        ? RUB[sk]
            .map((c, i) => [c, a.rub[sk].c[i]])
            .filter(x => x[1] <= 2)
            .map(x => x[0])
        : []
    )
    .flat();

  let h = `<div class="c"><div class="t np"><button class="s" onclick="S.v='admin';R()">← Volver</button><button onclick="print()">Imprimir / guardar PDF</button></div><img src="${LOGO}" alt="Colegio Increart" style="height:60px;background:#fff;border-radius:8px;padding:4px"><h2>Informe de admisión · English Placement Test</h2><p><b>${esc(
    a.n
  )}</b> · Grado al que aspira: ${G[a.g]} · ${new Date(a.d).toLocaleDateString('es-CO')}</p>

<div style="font-size:34px;font-weight:700">${L[r.lv]} <span style="font-size:16px;color:var(--mu);font-weight:400">· ${
    r.pct
  }% desempeño general</span></div>${
    r.pend
      ? '<p><span class="tag" style="background:var(--wa);color:#fff">Provisional: falta la valoración docente de Writing/Speaking</span></p>'
      : ''
  }

<div class="ov"><table><tr><th>Habilidad</th><th>Resultado</th><th></th><th>Nivel</th><th>Fuente</th></tr>${SK.map(
    sk => {
      const v = r.S2[sk];
      return v
        ? `<tr><td>${sk}</td><td>${v.pct}%</td><td>${bar(v.pct)}</td><td>${L[v.lv]}</td><td>${v.src}</td></tr>`
        : `<tr><td>${sk}</td><td colspan="4">${
            a.open.some(x => x.sk == sk) ? 'Pendiente de valoración docente' : 'No evaluada'
          }</td></tr>`;
    }
  ).join('')}</table></div></div>

<div class="c"><h3>Fortalezas y aspectos por mejorar</h3><p><b>Fortalezas:</b> ${
    [...st, ...rc].map(esc).join(', ') || '—'
  }</p><p><b>Por mejorar:</b> ${
    [...wk, ...rw, ...wt.map(t => 'tema ' + t)].map(esc).join(', ') || '—'
  }</p></div>

<div class="c"><h3>Recomendaciones pedagógicas</h3><ul>${fs
    .map(
      ([k, v]) => `<li><b>${k} (${L[v.lv]}):</b> ${REC[k][v.lv <= 2 ? 0 : v.lv <= 4 ? 1 : 2]}</li>`
    )
    .join('')}</ul></div>

${a.res
  .filter(x => x.ty == 'dict')
  .map(
    x => `<div class="c"><h3>Dictado (${x.lv}) · ${Math.round((x.got / x.pts) * 100)}%</h3><p style="line-height:1.9">${x.d
      .map(o =>
        o[0] == 'ok'
          ? esc(o[1])
          : o[0] == 'near'
          ? `<span style="color:var(--wa)" title="${esc(o[2])}">${esc(o[1])}</span>`
          : o[0] == 'sub'
          ? `<span style="color:var(--er)"><s>${esc(o[2])}</s> ${esc(o[1])}</span>`
          : o[0] == 'del'
          ? `<span style="color:var(--er)">[${esc(o[1])}]</span>`
          : `<s style="color:var(--mu)">${esc(o[2])}</s>`
      )
      .join(
        ' '
      )}</p><p class="tag">Naranja: casi correcta (ortografía) · Rojo: incorrecta u omitida [ ] · Gris tachado: palabra sobrante</p><p><b>Escribió:</b> ${
      esc(x.given) || '—'
    }</p></div>`
  )
  .join('')}

<div class="c"><h3>Análisis de errores (${er.length})</h3><div class="ov"><table><tr><th>Sección</th><th>Nivel</th><th>Tema</th><th>Pregunta</th><th>Respondió</th><th>Correcta</th></tr>${
    er
      .map(
        x =>
          `<tr><td>${x.sk}</td><td>${x.lv}</td><td>${esc(x.tp)}</td><td>${esc(x.q)}</td><td>${
            esc(x.given) || '—'
          }</td><td>${esc(x.ans)}</td></tr>`
      )
      .join('') || '<tr><td colspan="6">Sin errores en preguntas cerradas.</td></tr>'
  }</table></div></div>`;

  h += ['Writing', 'Speaking']
    .filter(sk => a.open.some(x => x.sk == sk))
    .map(sk => {
      const r0 = a.rub[sk] || { c: [0, 0, 0, 0], lv: '', cm: '' };
      return `<div class="c"><h3>${sk} · valoración docente</h3>${a.open
        .filter(x => x.sk == sk)
        .map(
          x =>
            `<p>${
              x.ty == 'read'
                ? `<span class="tag">Parte 1 · Lectura</span> <i>${esc(x.txt)}</i><br>`
                : sk == 'Speaking'
                ? '<span class="tag">Parte 2 · Habla libre</span> '
                : ''
            }<b>${esc(x.q)}</b> (${x.lv})</p>${
              sk == 'Writing'
                ? `<p style="white-space:pre-wrap">${esc(x.given) || '—'}</p>`
                : x.given
                ? `<audio controls src="${x.given}"></audio>`
                : '<p>Sin grabación</p>'
            }`
        )
        .join('')}

${
  sk == 'Writing'
    ? `<p class="np"><button onclick="aiW('${a.id}')">${S.busy ? 'Calificando…' : '✨ Calificar con Claude'}</button></p>`
    : ''
}${
        r0.ai ? '<p><span class="tag">Calificado por Claude · el docente puede ajustar</span></p>' : ''
      }<p class="tag">Escala: 0 = no evidenciado · 2 = parcial · 4 = sólido</p><div class="g">${RUB[sk]
        .map(
          (c, i) =>
            `<div><label>${c}</label><select onchange="sr('${a.id}','${sk}','c',this.value,${i})">${[
              0,
              1,
              2,
              3,
              4
            ]
              .map(n => `<option${r0.c[i] == n ? ' selected' : ''}>${n}</option>`)
              .join('')}</select></div>`
        )
        .join(
          ''
        )}<div><label>Nivel MCER asignado</label><select onchange="sr('${a.id}','${sk}','lv',this.value)"><option value="">— elegir —</option>${opt(
        L,
        r0.lv
      )}</select></div></div><label>Comentarios del docente</label><textarea onchange="sr('${a.id}','${sk}','cm',this.value)">${esc(
        r0.cm
      )}</textarea>${
        r0.err && r0.err.length
          ? `<div class="ov"><table><tr><th>Error</th><th>Corrección</th><th>Explicación</th></tr>${r0.err
              .map(x => `<tr><td>${esc(x.e)}</td><td>${esc(x.f)}</td><td>${esc(x.n)}</td></tr>`)
              .join('')}</table></div>`
          : ''
      }</div>`;
    })
    .join('');

  return (
    h +
    `<div class="c"><h3>Decisión de admisión y observaciones</h3><textarea rows="4" onchange="D.att.find(x=>x.id=='${a.id}').note=this.value;save()">${esc(
      a.note
    )}</textarea></div>`
  );
}
