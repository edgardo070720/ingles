/**
 * English Placement Test - Application Entry Point & State Router
 */

// Application Global State
let S = {
  v: 'home',       // Current view: 'home' | 'test' | 'done' | 'pin' | 'admin' | 'rep'
  tab: 'att',      // Active admin tab: 'att' | 'q' | 'dic' | 'top' | 'set'
  f: 'Todas',      // Question filter in admin
  stu: null,       // Current applicant data { n: 'Name', g: grade }
  steps: [],       // Test skill steps for current grade
  i: 0,            // Active step index
  ans: {},         // Current answers map { [questionId]: answerValue }
  ok: 0,           // Teacher authenticated status (PIN verified)
  e: null,         // Question currently being edited
  m: '',           // Toast/Banner message
  cf: 0,           // Confirmation state key
  dr: [],          // Temporary dictations drafts
  ra: null,        // Selected attempt ID for report view
  busy: 0          // Loading / AI operation indicator
};

/**
 * Main application render function and view router.
 */
function R() {
  const m = S.m;
  S.m = '';
  const ap = ['home', 'test', 'done'].includes(S.v);
  let b = '';

  if (S.v == 'home') {
    b = `
      <div class="c">
        <img src="${pic('🎓 📚 🌎 🗣️', '#e3edff')}" style="width:100%;max-height:120px;border-radius:12px;margin-bottom:8px">
        <h2>Prueba de nivel de inglés</h2>
        <p>Evaluación alineada al MCER: Reading, Listening, Writing y Speaking.</p>
        <div class="g">
          <div>
            <label>Nombre completo</label>
            <input id="nm" placeholder="Nombre del aspirante">
          </div>
          <div>
            <label>Grado al que aspira</label>
            <select id="gr">${optG(1)}</select>
          </div>
        </div>
        <p><button onclick="start()">Comenzar</button></p>
      </div>
    `;
  } else if (S.v == 'test') {
    const sk = S.steps[S.i];
    b = `
      <div class="c">
        <div class="t">
          ${S.steps
            .map(
              (s, i) =>
                `<span class="tag" style="${i == S.i ? 'background:var(--pr);color:#fff' : ''}">${s}</span>`
            )
            .join('')}
        </div>
        <img src="${pic(BN[sk], CLR[sk], 100)}" style="width:100%;max-height:100px;border-radius:12px;margin-bottom:8px">
        <h2>${sk}</h2>
        <p>${INS[sk]}</p>
      </div>
      ${qsFor(sk, S.stu.g)
        .map((q, i) => qh(q, i + 1))
        .join('')}
      <p><button onclick="nx()">${S.i < S.steps.length - 1 ? 'Siguiente sección →' : 'Finalizar'}</button></p>
    `;
  } else if (S.v == 'done') {
    b = `
      <div class="c">
        <h2>¡Gracias!</h2>
        <p>Tu prueba fue enviada. El colegio revisará tus resultados y se pondrá en contacto contigo.</p>
        <p><button class="s" onclick="S.v='home';R()">Volver al inicio</button></p>
      </div>
    `;
  } else if (S.v == 'pin') {
    b = `
      <div class="c">
        <h2>Acceso docente</h2>
        <label>PIN</label>
        <input id="pn" type="password" style="max-width:200px" placeholder="PIN docente" onkeydown="if(event.key==='Enter')$('#btnPin').click()">
        <p><button id="btnPin" onclick="if($('#pn').value==D.pin){S.ok=1;S.v='admin';R()}else toast('PIN incorrecto.')">Entrar</button></p>
      </div>
    `;
  } else if (S.v == 'admin') {
    b = admin();
  } else if (S.v == 'rep') {
    b = rep(D.att.find(a => a.id == S.ra));
  }

  $('#app').innerHTML = `
    <header class="np">
      <h1>
        <img src="${LOGO}" alt="Colegio Increart" style="height:34px;vertical-align:middle;background:#fff;border-radius:6px;padding:2px">
        English Placement Test
      </h1>
      <div class="t">
        <button class="${ap ? '' : 's'}" onclick="S.v='home';R()">Aspirante</button>
        <button class="${ap ? 's' : ''}" onclick="S.v=S.ok?'admin':'pin';R()">Docente</button>
      </div>
    </header>
    ${m ? `<div class="m np">${esc(m)}</div>` : ''}
    ${b}
  `;
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  load();
  R();
});
