/**
 * English Placement Test - Storage & Data Persistence (localStorage)
 */

// Global in-memory database
let D;

/**
 * Loads test data and settings from localStorage, running migrations if necessary.
 */
function load() {
  try {
    D = JSON.parse(localStorage.getItem('ept3'));
  } catch (e) {
    console.error('Error loading data from localStorage', e);
  }

  if (!D) {
    D = seed2();
  }

  // Migration v1 -> v2 (reading questions)
  if (!D.v) {
    D.v = 2;
    D.qs.push(...seed2().qs.filter(q => q.type == 'read'));
    save();
  }

  // Migration v2 -> v3 (listening dictations & question cues)
  if (D.v < 3) {
    D.v = 3;
    D.qs = D.qs.filter(q => !(q.sk == 'Listening' && q.type != 'dict'));
    if (!D.qs.some(q => q.type == 'dict')) {
      D.qs.push(...seed2().qs.filter(q => q.type == 'dict'));
    }
    D.qs.forEach(q => {
      if (!q.img) {
        const m = IMG.find(x => q.q.startsWith(x[0]));
        if (m) q.img = pic(m[1], CLR[q.sk]);
      }
    });
    save();
  }

  // Migration: migrate plaintext pin to hashed pin
  if (D.pin) {
    if (!D.pinHash) D.pinHash = DEFAULT_PIN_HASH;
    delete D.pin;
    save();
  }
  if (!D.pinHash) {
    D.pinHash = DEFAULT_PIN_HASH;
  }
}

/**
 * Persists the current database object to localStorage.
 */
function save() {
  try {
    localStorage.setItem('ept3', JSON.stringify(D));
  } catch (e) {
    toast('Almacenamiento lleno: usa archivos más pequeños.');
  }
}

// ============================================================================
// Google Sheets Integration
// ============================================================================

/**
 * Resolves the configured Google Sheets Webhook URL.
 * Prioritizes the repository-level DEFAULT_SHEET_URL so GitHub deployments
 * share the exact same sheet across all devices, falling back to local storage.
 */
function getGoogleSheetUrl() {
  if (typeof DEFAULT_SHEET_URL !== 'undefined' && DEFAULT_SHEET_URL.trim()) {
    return DEFAULT_SHEET_URL.trim();
  }
  if (D && D.sheetUrl && D.sheetUrl.trim()) {
    return D.sheetUrl.trim();
  }
  return '';
}

/**
 * Sends a single student attempt or test ping to Google Sheets via Apps Script Web App.
 */
async function sendToGoogleSheets(attempt, isTest = false) {
  const url = getGoogleSheetUrl();
  if (!url) {
    return { ok: false, error: 'No hay URL de Google Sheets configurada.' };
  }

  let payload;
  if (isTest) {
    payload = {
      action: 'ping',
      timestamp: new Date().toISOString()
    };
  } else {
    const analysis = an(attempt);
    const writingObj = (attempt.open || []).find(x => x.sk === 'Writing');
    const speakingObj = (attempt.open || []).find(x => x.sk === 'Speaking');

    payload = {
      action: 'submit',
      id: attempt.id,
      timestamp: attempt.d || new Date().toISOString(),
      studentName: attempt.n,
      grade: G[attempt.g] || attempt.g,
      overallScore: analysis.pct + '%',
      overallLevel: L[analysis.lv] || 'Pre-A1',
      status: analysis.pend ? 'Pendiente revisión docente' : 'Completo',
      readingScore: analysis.S2 && analysis.S2.Reading ? analysis.S2.Reading.pct + '%' : 'N/A',
      readingLevel: analysis.S2 && analysis.S2.Reading ? L[analysis.S2.Reading.lv] : 'N/A',
      listeningScore: analysis.S2 && analysis.S2.Listening ? analysis.S2.Listening.pct + '%' : 'N/A',
      listeningLevel: analysis.S2 && analysis.S2.Listening ? L[analysis.S2.Listening.lv] : 'N/A',
      writingText: writingObj ? (writingObj.given || '') : '',
      speakingAudio: speakingObj && speakingObj.given ? 'Audio registrado' : 'Sin audio',
      teacherNotes: attempt.note || '',
      rawData: JSON.stringify(attempt)
    };
  }

  try {
    // Mode no-cors and text/plain to avoid preflight CORS restrictions on Google Apps Script
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });
    return { ok: true };
  } catch (err) {
    console.error('Error enviando a Google Sheets:', err);
    return { ok: false, error: err.message };
  }
}

/**
 * Tests the connection to Google Sheets with a ping payload.
 */
async function testGoogleSheetsConnection() {
  const url = getGoogleSheetUrl();
  if (!url) return toast('Primero ingresa la URL de Google Sheets en Ajustes.');

  toast('Enviando prueba de conexión...');
  const res = await sendToGoogleSheets(null, true);
  if (res.ok) {
    toast('✅ ¡Solicitud enviada! Revisa tu hoja de Google Sheets.');
  } else {
    toast('❌ Error al conectar: ' + res.error);
  }
}

/**
 * Synchronizes all attempts stored in localStorage to Google Sheets.
 */
async function syncAllToGoogleSheets() {
  if (!D.att || !D.att.length) return toast('No hay aspirantes registrados para sincronizar.');
  const url = getGoogleSheetUrl();
  if (!url) return toast('Configura primero la URL de Google Sheets en Ajustes.');

  toast('Sincronizando ' + D.att.length + ' aspirante(s) con Google Sheets...');
  let okCount = 0;
  for (const a of D.att) {
    const res = await sendToGoogleSheets(a);
    if (res.ok) okCount++;
  }
  toast(`✅ Sincronización finalizada: ${okCount} registro(s) enviados a Google Sheets.`);
}

// ============================================================================
// Secure Teacher PIN Management (Google Sheets & Local Hash)
// ============================================================================

/**
 * Verifies teacher PIN against Google Sheets (if connected) or local hash fallback.
 */
async function verifyTeacherPin(enteredPin) {
  const pin = String(enteredPin || '').trim();
  if (!pin) return { ok: false, error: 'Por favor ingresa el PIN.' };

  const clientHash = await hashPin(pin);
  const url = getGoogleSheetUrl();

  // If Google Sheets is configured, verify online first
  if (url) {
    try {
      const verifyUrl = `${url}?action=verifyPin&pinHash=${encodeURIComponent(clientHash)}`;
      const response = await fetch(verifyUrl, { method: 'GET' });
      const result = await response.json();

      if (result && result.authorized) {
        // Cache verified hash locally for offline use
        D.pinHash = clientHash;
        save();
        return { ok: true, source: 'Google Sheets' };
      } else {
        return { ok: false, error: result.message || 'PIN incorrecto en Google Sheets.' };
      }
    } catch (networkErr) {
      console.warn('No se pudo verificar con Google Sheets; usando verificación local:', networkErr);
    }
  }

  // Local fallback verification
  const storedHash = (D && D.pinHash) ? D.pinHash.toLowerCase() : DEFAULT_PIN_HASH;
  if (clientHash.toLowerCase() === storedHash) {
    return { ok: true, source: 'Local' };
  } else {
    return { ok: false, error: 'PIN incorrecto.' };
  }
}

/**
 * Changes teacher PIN, updating Google Sheets if configured and local storage.
 */
async function changeTeacherPin(currentPin, newPin, confirmPin) {
  if (!currentPin) return { ok: false, error: 'Debes ingresar el PIN actual.' };
  if (!newPin || newPin.length < 4) return { ok: false, error: 'El nuevo PIN debe tener al menos 4 caracteres.' };
  if (newPin !== confirmPin) return { ok: false, error: 'La confirmación del nuevo PIN no coincide.' };

  const currentHash = await hashPin(currentPin);
  const newHash = await hashPin(newPin);
  const url = getGoogleSheetUrl();

  if (url) {
    try {
      const changeUrl = `${url}?action=changePin&currentPinHash=${encodeURIComponent(currentHash)}&newPinHash=${encodeURIComponent(newHash)}`;
      const response = await fetch(changeUrl, { method: 'GET' });
      const result = await response.json();

      if (result && result.status === 'success') {
        D.pinHash = newHash;
        save();
        return { ok: true, message: '✅ PIN actualizado exitosamente en Google Sheets y en este equipo.' };
      } else {
        return { ok: false, error: result.message || 'Error al actualizar PIN en Google Sheets.' };
      }
    } catch (err) {
      return { ok: false, error: 'Error de conexión con Google Sheets: ' + err.message };
    }
  }

  // Local only change
  const storedHash = (D && D.pinHash) ? D.pinHash.toLowerCase() : DEFAULT_PIN_HASH;
  if (currentHash.toLowerCase() !== storedHash) {
    return { ok: false, error: 'El PIN actual no es correcto.' };
  }

  D.pinHash = newHash;
  save();
  return { ok: true, message: '✅ PIN actualizado localmente (conecta Google Sheets para sincronizarlo en la nube).' };
}

/**
 * Fetches all applicant attempts stored in Google Sheets and updates local state.
 */
async function fetchAttemptsFromGoogleSheets(silent = false) {
  const url = getGoogleSheetUrl();
  if (!url) {
    if (!silent) toast('No hay URL de Google Sheets configurada.');
    return { ok: false, error: 'Sin URL' };
  }

  if (!silent) toast('Consultando aspirantes en Google Sheets...');
  try {
    const fetchUrl = `${url}?action=getAttempts`;
    const response = await fetch(fetchUrl, { method: 'GET' });
    const result = await response.json();

    if (result && result.status === 'success' && Array.isArray(result.attempts)) {
      const localMap = new Map((D.att || []).map(a => [a.id, a]));
      let newCount = 0;

      result.attempts.forEach(remote => {
        if (!localMap.has(remote.id)) {
          localMap.set(remote.id, remote);
          newCount++;
        } else {
          const local = localMap.get(remote.id);
          localMap.set(remote.id, { ...local, ...remote });
        }
      });

      D.att = Array.from(localMap.values()).sort((a, b) => new Date(b.d) - new Date(a.d));
      save();

      if (!silent) {
        toast(`✅ Sincronizado: ${D.att.length} aspirante(s) disponibles.`);
        R();
      }
      return { ok: true, count: D.att.length, newCount };
    } else {
      if (!silent) toast('No se pudieron obtener los aspirantes de Google Sheets.');
      return { ok: false, error: 'Respuesta inválida' };
    }
  } catch (err) {
    console.error('Error al sincronizar desde Google Sheets:', err);
    if (!silent) toast('Error al conectar con Google Sheets: ' + err.message);
    return { ok: false, error: err.message };
  }
}
