/**
 * English Placement Test - Audio & Speech Synthesis / Recording
 */

// Initialize SpeechSynthesis voices
try {
  if (window.speechSynthesis) {
    speechSynthesis.getVoices();
    speechSynthesis.onvoiceschanged = () => {
      if (S && S.v == 'admin' && S.tab == 'set') R();
    };
  }
} catch (e) {}

/**
 * Returns available English voices from the browser.
 */
const vs = () => {
  if (!window.speechSynthesis) return [];
  const a = speechSynthesis.getVoices();
  const u = a.filter(x => /^en[-_]US/i.test(x.lang));
  return u.length ? u : a.filter(x => /^en/i.test(x.lang));
};

/**
 * Selects the preferred English voice (configured voice or quality fallback).
 */
function pickV() {
  const a = speechSynthesis.getVoices();
  const v = a.filter(x => /^en[-_]US/i.test(x.lang));
  if (D && D.voice) {
    const w = a.find(x => x.name == D.voice);
    if (w) return w;
  }
  for (const p of [/Google US English/i, /Aria|Jenny|Samantha|Allison|Ava|Joanna|Zira|Guy/i]) {
    const f = v.find(x => p.test(x.name));
    if (f) return f;
  }
  return v[0] || a.find(x => /^en/i.test(x.lang));
}

/**
 * Plays speech audio for a question or dictation script.
 */
function say(id, slow) {
  const q = D.qs.find(q => q.id == id);
  if (!q || !window.speechSynthesis) return toast('Tu navegador no admite voz.');

  speechSynthesis.cancel();
  const g = S.stu ? S.stu.g : 3;
  const rt = (g <= 2 ? 0.72 : g == 3 ? 0.82 : 0.9) * (slow ? 0.8 : 1);
  const ss = q.script ? (q.script.match(/[^.!?]+[.!?]*/g) || [q.script]) : [q.q];
  const v = pickV();
  const t = (S.tk = Math.random());

  (function n(i) {
    if (i >= ss.length || S.tk != t) return;
    const u = new SpeechSynthesisUtterance(ss[i].trim());
    u.lang = 'en-US';
    u.rate = rt;
    if (v) u.voice = v;
    u.onend = () => setTimeout(() => n(i + 1), 550);
    speechSynthesis.speak(u);
  })(0);
}

/**
 * Voice preview in Admin settings.
 */
function testV() {
  if (!window.speechSynthesis) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance('Hello! My name is Sam. I live in New York and I like pizza.');
  const v = pickV();
  u.lang = 'en-US';
  u.rate = 0.85;
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}

/**
 * Records student voice for Speaking questions (using MediaRecorder).
 */
async function rec(id) {
  if (S.mr && S.mr.state == 'recording') {
    S.mr.stop();
    return;
  }

  const b = $('#rb' + id);
  try {
    const st = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ch = [];
    const mr = (S.mr = new MediaRecorder(st));

    mr.ondataavailable = e => ch.push(e.data);
    mr.onstop = () => {
      st.getTracks().forEach(t => t.stop());
      const r = new FileReader();
      r.onload = () => {
        S.ans[id] = r.result;
        const p = $('#rp' + id);
        p.src = r.result;
        p.hidden = false;
        b.textContent = '● Grabar de nuevo';
      };
      r.readAsDataURL(new Blob(ch, { type: mr.mimeType }));
    };

    mr.start();
    b.textContent = '■ Detener';
    setTimeout(() => mr.state == 'recording' && mr.stop(), 60000);
  } catch (e) {
    toast('No se pudo acceder al micrófono.');
  }
}

/**
 * Records teacher reference audio for dictations.
 */
async function recA() {
  if (S.mr && S.mr.state == 'recording') {
    S.mr.stop();
    return;
  }

  try {
    const st = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ch = [];
    const mr = (S.mr = new MediaRecorder(st));

    mr.ondataavailable = x => ch.push(x.data);
    mr.onstop = () => {
      st.getTracks().forEach(t => t.stop());
      S.rcA = 0;
      const r = new FileReader();
      r.onload = () => {
        if (r.result.length > 2e6) return toast('Grabación muy larga (máx. ~1,5 MB).');
        S.e.aud = r.result;
        R();
      };
      r.readAsDataURL(new Blob(ch, { type: mr.mimeType }));
    };

    mr.start();
    S.rcA = 1;
    R();
    setTimeout(() => mr.state == 'recording' && mr.stop(), 90000);
  } catch (x) {
    toast('No se pudo acceder al micrófono.');
  }
}
