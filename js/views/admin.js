/**
 * English Placement Test - Teacher & Admin Views
 */

// Helper to update current edited question property
const u = (k, v) => {
  S.e[k] = v;
};

/**
 * Handles image file uploads for questions (encodes to Base64 data URL).
 */
function fl(k, f) {
  if (!f) return;
  if (f.size > 1.5e6) return toast('Archivo muy pesado (máx. 1,5 MB).');
  const r = new FileReader();
  r.onload = () => {
    S.e[k] = r.result;
    R();
  };
  r.readAsDataURL(f);
}

/**
 * Opens question editor (for editing existing or creating new).
 */
function ed(id) {
  S.dr = [];
  S.e = id
    ? JSON.parse(JSON.stringify(D.qs.find(q => q.id == id)))
    : {
        id: '',
        sk: 'Reading',
        lv: 'A1',
        tp: D.topics[0] || '',
        type: 'mcq',
        q: '',
        opts: [],
        ans: '',
        pts: 1,
        g1: 1,
        g2: 5,
        txt: '',
        img: '',
        aud: '',
        script: ''
      };
  S.e.or = S.e.opts.join('\n');
  R();
}

/**
 * Validates and saves question from editor to database.
 */
function sq() {
  const e = S.e;
  if (e.sk == 'Listening' && !e.q.trim()) e.q = 'Listen to your teacher and write exactly what you hear.';
  if (!e.q.trim()) return toast('Escribe el enunciado.');
  const o = (e.or || '')
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);

  if (e.sk == 'Listening') {
    e.type = 'dict';
    e.pts = 0;
    e.ans = '';
    if (!(e.script || '').trim()) return toast('Escribe el texto del dictado.');
  } else if (e.sk == 'Writing' || e.sk == 'Speaking') {
    e.type = e.sk == 'Speaking' && e.type == 'read' ? 'read' : 'open';
    e.pts = 0;
    e.ans = '';
  } else {
    if (e.type == 'open' || e.type == 'read') e.type = 'mcq';
    if (e.type == 'mcq' && !o.includes(e.ans)) return toast('La respuesta correcta debe coincidir con una opción.');
    if (e.type == 'text' && !e.ans) return toast('Indica la respuesta aceptada.');
  }

  e.opts = e.type == 'mcq' ? o : [];
  e.pts = +e.pts;
  e.g1 = +e.g1;
  e.g2 = +e.g2;
  delete e.or;

  if (e.id) {
    D.qs[D.qs.findIndex(q => q.id == e.id)] = e;
  } else {
    e.id = uid();
    D.qs.push(e);
  }

  S.e = null;
  save();
  R();
}

/**
 * Adds AI-generated or audio-supported dictations to the question bank.
 */
function addD(i) {
  const e = S.e;
  const ds = i < 0 ? S.dr : [S.dr[i]];
  let a = e.aud;

  if (a && a[0] != '@') {
    const k = 'a' + uid();
    D.audios = D.audios || {};
    D.audios[k] = a;
    e.aud = a = '@' + k;
  }

  ds.forEach(d =>
    D.qs.push({
      id: uid(),
      sk: 'Listening',
      lv: e.lv,
      tp: e.tp,
      type: 'mcq',
      q: d.q,
      opts: d.opts,
      ans: d.ans,
      pts: +e.pts || 1,
      g1: +e.g1,
      g2: +e.g2,
      txt: '',
      img: '',
      aud: a || '',
      script: e.script || ''
    })
  );

  S.dr = i < 0 ? [] : S.dr.filter((_, j) => j != i);
  save();
  toast(ds.length + ' pregunta(s) agregada(s) al banco.');
}

/**
 * Renders question editor form.
 */
function editor() {
  const e = S.e;
  const op = e.sk == 'Writing' || e.sk == 'Speaking' || e.sk == 'Listening';

  return `<div class="c"><h3>${e.id ? 'Editar' : 'Nueva'} pregunta</h3><div class="g">${
    e.sk == 'Speaking'
      ? `<div><label>Parte</label><select onchange="u('type',this.value);R()"><option value="read"${
          e.type == 'read' ? ' selected' : ''
        }>Parte 1 · Lectura en voz alta</option><option value="open"${
          e.type != 'read' ? ' selected' : ''
        }>Parte 2 · Habla libre</option></select></div>`
      : ''
  }<div><label>Habilidad</label><select onchange="u('sk',this.value);R()">${ops(SK, e.sk)}</select></div><div><label>Nivel MCER</label><select onchange="u('lv',this.value)">${ops(
    L,
    e.lv
  )}</select></div><div><label>Tema</label><select onchange="u('tp',this.value)">${ops(
    D.topics,
    e.tp
  )}</select></div>

${
  op
    ? ''
    : `<div><label>Tipo</label><select onchange="u('type',this.value);R()"><option value="mcq"${
        e.type == 'mcq' ? ' selected' : ''
      }>Opción múltiple</option><option value="text"${
        e.type == 'text' ? ' selected' : ''
      }>Respuesta corta</option></select></div><div><label>Puntaje</label><input type="number" min="0" value="${
        e.pts
      }" onchange="u('pts',this.value)"></div>`
}

<div><label>Grado desde</label><select onchange="u('g1',this.value)">${optG(e.g1)}</select></div><div><label>Grado hasta</label><select onchange="u('g2',this.value)">${optG(
    e.g2
  )}</select></div></div>

<label>Enunciado</label><textarea oninput="u('q',this.value)">${esc(e.q)}</textarea>

${
  e.sk == 'Reading' || (e.sk == 'Speaking' && e.type == 'read')
    ? `<label>Texto de lectura</label><textarea rows="5" oninput="u('txt',this.value)">${esc(e.txt)}</textarea>`
    : ''
}

${
  e.sk == 'Listening'
    ? `<label>Texto del dictado (lo lee el docente; el estudiante no lo ve)</label><textarea rows="4" oninput="u('script',this.value)">${esc(
        e.script
      )}</textarea><div class="t"><button class="s" ${
        S.busy ? 'disabled' : ''
      } onclick="aiL()">${S.busy ? 'Redactando…' : '✨ Redactar dictado con Claude'}</button><span class="tag">Según el grado, nivel y tema elegidos</span></div>`
    : ''
}

<label>Imagen (opcional)</label><input type="file" accept="image/*" onchange="fl('img',this.files[0])">${
    e.img ? `<img src="${e.img}" style="max-height:100px"> <button class="s" onclick="u('img','');R()">Quitar</button>` : ''
  }

${
  op
    ? e.sk == 'Listening'
      ? '<p class="tag">Dictado: se califica automáticamente comparando lo escrito con el texto.</p>'
      : '<p class="tag">Se evalúa con rúbrica docente (4 criterios, 0–4); no suma puntaje automático.</p>'
    : `${
        e.type == 'mcq'
          ? `<label>Opciones (una por línea)</label><textarea rows="4" oninput="u('or',this.value)">${esc(
              e.or
            )}</textarea>`
          : ''
      }<label>Respuesta correcta ${
        e.type == 'text' ? '(varias válidas separadas por |)' : '(texto exacto de la opción)'
      }</label><input value="${esc(e.ans)}" oninput="u('ans',this.value)">`
}

<p><button onclick="sq()">Guardar</button> <button class="s" onclick="S.e=null;R()">Cancelar</button></p></div>`;
}

/**
 * Renders teacher admin dashboard tabs.
 */
function admin() {
  const tabs = [
    ['att', 'Aspirantes'],
    ['q', 'Preguntas'],
    ['dic', 'Dictados (docente)'],
    ['top', 'Temas'],
    ['set', 'Ajustes']
  ];

  let h = `<div class="t">${tabs
    .map(
      ([k, n]) =>
        `<button class="${S.tab == k ? '' : 's'}" onclick="S.tab='${k}';S.e=null;R()">${n}</button>`
    )
    .join('')}</div>`;

  // Aspirantes / Attempts Tab
  if (S.tab == 'att') {
    h += `<div class="c">
      <div class="t" style="margin-bottom:12px;justify-content:space-between">
        <div class="t">
          <button class="s" onclick="fetchAttemptsFromGoogleSheets()">🔄 Actualizar desde Google Sheets</button>
          <button class="s" onclick="syncAllToGoogleSheets()">📤 Subir locales a Google Sheets</button>
        </div>
        <span class="tag" style="background:#e8f0ff;color:var(--pr)">
          ${D.att.length} aspirante(s) disponible(s)
        </span>
      </div>
      <div class="ov">
        <table>
          <tr>
            <th>Aspirante</th>
            <th>Grado</th>
            <th>Fecha</th>
            <th>Nivel</th>
            <th>Estado</th>
            <th></th>
          </tr>
          ${
            D.att
              .map(a => {
                const r = an(a);
                return `<tr><td><b>${esc(a.n)}</b></td><td>${G[a.g] || a.g}</td><td>${new Date(
                  a.d
                ).toLocaleDateString('es-CO')}</td><td>${L[r.lv]} · ${r.pct}%</td><td>${
                  r.pend ? '<span class="tag" style="background:var(--wa);color:#fff">Pendiente docente</span>' : '<span class="tag" style="background:#e2f6ea;color:#137333">Completo</span>'
                }</td><td><button onclick="S.v='rep';S.ra='${a.id}';R()">Abrir</button> <button class="d" onclick="cf('a${
                  a.id
                }',()=>{D.att=D.att.filter(x=>x.id!='${a.id}');save();R()})">✕</button></td></tr>`;
              })
              .join('') ||
            '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--mu)">No hay aspirantes guardados en este navegador.<br><button class="s" style="margin-top:8px" onclick="fetchAttemptsFromGoogleSheets()">🔄 Cargar aspirantes desde Google Sheets</button></td></tr>'
          }
        </table>
      </div>
    </div>`;
  }

  // Question Bank Tab
  if (S.tab == 'q') {
    h += S.e
      ? editor()
      : `<div class="c"><div class="t"><select style="width:auto" onchange="S.f=this.value;R()">${ops(
          ['Todas', ...SK],
          S.f
        )}</select><button onclick="ed()">+ Nueva pregunta</button></div><div class="ov"><table><tr><th>Hab.</th><th>Nivel</th><th>Tema</th><th>Pregunta</th><th>Grados</th><th>Pts</th><th></th></tr>${D.qs
          .filter(q => S.f == 'Todas' || q.sk == S.f)
          .map(
            q =>
              `<tr><td>${q.sk}</td><td>${q.lv}</td><td>${esc(q.tp)}</td><td>${esc(
                q.q.slice(0, 60)
              )}</td><td>${G[q.g1]}–${G[q.g2]}</td><td>${q.pts}</td><td><button class="s" onclick="ed('${
                q.id
              }')">Editar</button> <button class="d" onclick="cf('q${
                q.id
              }',()=>{D.qs=D.qs.filter(x=>x.id!='${q.id}');save();R()})">✕</button></td></tr>`
          )
          .join('')}</table></div></div>`;
  }

  // Teacher Dictations Script Tab
  if (S.tab == 'dic') {
    const g = S.dg || 1;
    h += `<div class="c"><div class="t np"><label style="margin:0">Grado del aspirante</label><select style="width:auto" onchange="S.dg=+this.value;R()">${optG(
      g
    )}</select><button class="s" onclick="print()">Imprimir guion</button></div><p class="tag">Lectura sugerida: 1) texto completo a ritmo natural; 2) frase por frase, con pausa para escribir (⏸); 3) texto completo otra vez para revisar. No deletrees ni repitas palabras sueltas.</p></div>${
      D.qs
        .filter(q => q.type == 'dict' && g >= q.g1 && g <= q.g2)
        .sort((a, b) => L.indexOf(a.lv) - L.indexOf(b.lv))
        .map(
          q =>
            `<div class="c"><div class="t"><span class="tag">${q.lv}</span><span class="tag">${esc(
              q.tp
            )}</span><button class="s np" onclick="say('${q.id}')">▶ Voz de apoyo</button><button class="s np" onclick="say('${
              q.id
            }',1)">🐢</button></div><p style="font-size:18px;line-height:2">${(
              q.script.match(/[^.!?]+[.!?]*/g) || []
            )
              .map(x => esc(x.trim()) + ' <b style="color:var(--pr)">⏸</b>')
              .join('<br>')}</p></div>`
        )
        .join('') || '<div class="c">No hay dictados para este grado.</div>'
    }`;
  }

  // Topics Management Tab
  if (S.tab == 'top') {
    h += `<div class="c"><div class="t"><input id="nt" placeholder="Nuevo tema" style="max-width:260px"><button onclick="const v=$('#nt').value.trim();if(v&&!D.topics.includes(v)){D.topics.push(v);save()}R()">Agregar</button></div>${D.topics
      .map(
        t =>
          `<div class="t"><span class="tag">${esc(
            t
          )}</span><button class="d" onclick="cf('t${esc(
            t
          )}',()=>{D.topics=D.topics.filter(x=>x!=this.dataset.t);save();R()})" data-t="${esc(
            t
          )}">Eliminar</button></div>`
      )
      .join('')}</div>`;
  }

  // Settings Tab
  if (S.tab == 'set') {
    h += `<div class="c">
      <h3>Configuración General</h3>
      <label>% mínimo de aciertos para acreditar un nivel (Reading/Listening)</label>
      <input type="number" min="30" max="100" value="${D.th}" onchange="D.th=+this.value;save()">
      <label>Voz del Listening (inglés de EE. UU.)</label>
      <select onchange="D.voice=this.value;save()">
        <option value="">Automática (recomendada)</option>
        ${vs().map(v => `<option${v.name == D.voice ? ' selected' : ''}>${esc(v.name)}</option>`).join('')}
      </select>
      <p><button class="s" onclick="testV()">▶ Probar voz</button> <span class="tag">${vs().length} voces encontradas en este equipo</span></p>
      <hr style="border:0;border-top:1px solid var(--bd);margin:20px 0">

      <h3>Seguridad y PIN de Acceso Docente</h3>
      <p class="tag" style="background:#e8f0ff;color:var(--pr);margin-bottom:12px">
        El PIN está protegido con hash SHA-256 ${getGoogleSheetUrl() ? 'y sincronizado con Google Sheets' : '(modo local)'}.
      </p>

      <div class="g" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
        <div>
          <label>PIN Actual</label>
          <input id="curPin" type="password" placeholder="PIN actual">
        </div>
        <div>
          <label>Nuevo PIN</label>
          <input id="newPin" type="password" placeholder="Mínimo 4 dígitos">
        </div>
        <div>
          <label>Confirmar Nuevo PIN</label>
          <input id="cfmPin" type="password" placeholder="Repite nuevo PIN">
        </div>
      </div>
      <p style="margin-top:10px">
        <button class="s" onclick="
          const c = $('#curPin').value, n = $('#newPin').value, f = $('#cfmPin').value;
          changeTeacherPin(c, n, f).then(res => {
            if (res.ok) {
              toast(res.message);
              $('#curPin').value = ''; $('#newPin').value = ''; $('#cfmPin').value = '';
            } else {
              toast('❌ ' + res.error);
            }
          });
        ">Actualizar PIN</button>
      </p>
      <p class="tag">💡 Si olvidas el PIN, abre tu Google Sheet, ve a la pestaña <b>_Config</b> y escribe <b>RESET</b> en la celda de emergencia para restaurarlo a '1234'.</p>

      <hr style="border:0;border-top:1px solid var(--bd);margin:20px 0">

      <h3>Persistencia Global en Google Sheets (GitHub Pages)</h3>
      ${
        DEFAULT_SHEET_URL
          ? `<p class="tag" style="background:#e2f6ea;color:#137333;margin-bottom:8px">
              ✅ URL Global Activa en el repositorio (visible para todos los docentes y estudiantes).
            </p>
            <label>URL Oficial del Despliegue (configurada en js/config.js)</label>
            <input value="${esc(DEFAULT_SHEET_URL)}" readonly style="opacity:0.85;background:var(--sf)">`
          : `<p class="tag" style="background:#fff1db;color:#c77700;margin-bottom:8px">
              ⚠️ Aún no se ha fijado la URL en el repositorio (js/config.js).
            </p>`
      }

      <label style="margin-top:10px">URL de Google Sheets (Web App / Apps Script)</label>
      <input id="inpSheetUrl" value="${esc(DEFAULT_SHEET_URL || D.sheetUrl || '')}" placeholder="https://script.google.com/macros/s/.../exec" onchange="D.sheetUrl=this.value.trim();save()">
      <p class="tag">Para que todos los docentes y aspirantes desde cualquier equipo usen la misma hoja sin tener que configurarla, la URL debe colocarse en <code>js/config.js</code> y subirse a GitHub.</p>
      <p style="margin-top:10px">
        <button class="s" onclick="testGoogleSheetsConnection()">▶ Probar conexión</button>
        <button class="s" onclick="syncAllToGoogleSheets()">📤 Sincronizar todos los aspirantes</button>
        <button class="s" onclick="
          const v = $('#inpSheetUrl').value.trim();
          if(!v) return toast('Ingresa una URL primero.');
          navigator.clipboard.writeText('const DEFAULT_SHEET_URL = \\'' + v + '\\';');
          toast('📋 Línea copiada para js/config.js');
        ">📋 Copiar código para GitHub</button>
      </p>

      <hr style="border:0;border-top:1px solid var(--bd);margin:20px 0">

      <p><button class="d" onclick="cf('reset',()=>{localStorage.removeItem('ept3');load();R()})">Restablecer todo</button></p>
    </div>`;
  }

  return h;
}
