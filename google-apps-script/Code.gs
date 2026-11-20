/**
 * ============================================================================
 * English Placement Test - Google Apps Script Backend (v2)
 * ============================================================================
 * 
 * Funcionalidades:
 * 1. Registro automático de resultados de evaluaciones de aspirantes.
 * 2. Autenticación y verificación segura del PIN docente (SHA-256).
 * 3. Cambio de PIN persistente en la hoja de cálculo.
 * 4. Reinicio de emergencia del PIN si el docente lo olvida.
 */

// Hash SHA-256 por defecto para el PIN '1234'
var DEFAULT_PIN_HASH = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';

/**
 * Manejo de peticiones POST
 */
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = {};
    
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
    
    return handleAction(ss, data);
  } catch (error) {
    return jsonResponse({ status: 'error', message: error.toString() });
  }
}

/**
 * Manejo de peticiones GET
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = (e && e.parameter) ? e.parameter : {};
    
    if (data.action) {
      return handleAction(ss, data);
    }
    
    return jsonResponse({
      status: 'active',
      message: 'English Placement Test Webhook activo y listo.'
    });
  } catch (error) {
    return jsonResponse({ status: 'error', message: error.toString() });
  }
}

/**
 * Despachador de acciones (POST o GET)
 */
function handleAction(ss, data) {
  var action = data.action || 'submit';
  
  // 1. Verificación de PIN docente
  if (action === 'verifyPin') {
    return verifyTeacherPin(ss, data.pinHash);
  }
  
  // 2. Cambio de PIN docente
  if (action === 'changePin') {
    return changeTeacherPin(ss, data.currentPinHash, data.newPinHash);
  }
  
  // 3. Ping de prueba de conexión
  if (action === 'ping') {
    var mainSheet = ss.getSheetByName('Evaluaciones') || ss.getActiveSheet();
    setupEvaluacionesSheet(mainSheet);
    
    mainSheet.appendRow([
      new Date(),
      'TEST-PING',
      'Prueba de conexión exitosa',
      '-', '-', '-', 'Conexión OK', '-', '-', '-', '-', '-', '-',
      'Verificación desde el panel docente',
      '{}'
    ]);
    
    return jsonResponse({ status: 'success', message: 'Conexión exitosa' });
  }
  
  // 4. Registro de resultados del aspirante (Submit)
  var evalSheet = ss.getSheetByName('Evaluaciones') || ss.getActiveSheet();
  setupEvaluacionesSheet(evalSheet);
  
  var fecha = data.timestamp ? new Date(data.timestamp) : new Date();
  
  evalSheet.appendRow([
    fecha,
    data.id || '',
    data.studentName || '',
    data.grade || '',
    data.overallScore || '',
    data.overallLevel || '',
    data.status || '',
    data.readingScore || '',
    data.readingLevel || '',
    data.listeningScore || '',
    data.listeningLevel || '',
    data.writingText || '',
    data.speakingAudio || '',
    data.teacherNotes || '',
    data.rawData || ''
  ]);
  
  return jsonResponse({ status: 'success', message: 'Evaluación registrada correctamente.' });
}

// ============================================================================
// Lógica de Seguridad y PIN Docente
// ============================================================================

/**
 * Obtiene o inicializa la pestaña '_Config' para almacenamiento de parámetros.
 */
function getOrCreateConfigSheet(ss) {
  var sheet = ss.getSheetByName('_Config');
  if (!sheet) {
    sheet = ss.insertSheet('_Config');
    sheet.appendRow(['Parámetro', 'Valor', 'Descripción']);
    sheet.appendRow(['DOCENTE_PIN_HASH', DEFAULT_PIN_HASH, "Hash SHA-256 del PIN docente (por defecto '1234')"]);
    sheet.appendRow(['ULTIMO_CAMBIO', new Date().toISOString(), 'Fecha del último cambio de PIN']);
    sheet.appendRow(['INTENTOS_FALLIDOS', 0, 'Contador de intentos erróneos']);
    sheet.appendRow(['REINICIO_EMERGENCIA', '', "Escribe 'RESET' aquí si olvidaste el PIN para restablecerlo a '1234'"]);
    
    var header = sheet.getRange(1, 1, 1, 3);
    header.setBackground('#4a5568');
    header.setFontColor('#ffffff');
    header.setFontWeight('bold');
    sheet.setColumnWidth(1, 200);
    sheet.setColumnWidth(2, 350);
    sheet.setColumnWidth(3, 400);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Lee el hash del PIN docente almacenado en la hoja de cálculo.
 */
function getStoredPinHash(ss) {
  var sheet = getOrCreateConfigSheet(ss);
  var data = sheet.getDataRange().getValues();
  
  var resetRow = -1;
  var pinRow = -1;
  var hash = DEFAULT_PIN_HASH;
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === 'DOCENTE_PIN_HASH') {
      pinRow = i + 1;
      hash = data[i][1] || DEFAULT_PIN_HASH;
    }
    if (data[i][0] === 'REINICIO_EMERGENCIA') {
      resetRow = i + 1;
      // Verificar si el administrador solicitó un reinicio manual de emergencia
      if (String(data[i][1]).trim().toUpperCase() === 'RESET') {
        hash = DEFAULT_PIN_HASH;
        sheet.getRange(pinRow, 2).setValue(DEFAULT_PIN_HASH);
        sheet.getRange(resetRow, 2).setValue('RESET_REALIZADO_' + new Date().toLocaleDateString('es-CO'));
      }
    }
  }
  return String(hash).trim().toLowerCase();
}

/**
 * Valida si el hash proporcionado coincide con el guardado en Google Sheets.
 */
function verifyTeacherPin(ss, clientPinHash) {
  if (!clientPinHash) {
    return jsonResponse({ status: 'error', authorized: false, message: 'PIN no proporcionado' });
  }
  
  var storedHash = getStoredPinHash(ss);
  var normalizedClient = String(clientPinHash).trim().toLowerCase();
  
  if (normalizedClient === storedHash) {
    // Éxito: resetear contador de fallos
    var sheet = getOrCreateConfigSheet(ss);
    updateConfigValue(sheet, 'INTENTOS_FALLIDOS', 0);
    return jsonResponse({
      status: 'success',
      authorized: true,
      message: 'PIN verificado correctamente.'
    });
  } else {
    // Incrementar intentos fallidos
    var sheet = getOrCreateConfigSheet(ss);
    var currentFails = Number(getConfigValue(sheet, 'INTENTOS_FALLIDOS') || 0) + 1;
    updateConfigValue(sheet, 'INTENTOS_FALLIDOS', currentFails);
    
    return jsonResponse({
      status: 'error',
      authorized: false,
      message: 'PIN incorrecto. Intento ' + currentFails + '.'
    });
  }
}

/**
 * Actualiza el hash del PIN docente en Google Sheets.
 */
function changeTeacherPin(ss, currentPinHash, newPinHash) {
  if (!newPinHash || newPinHash.length < 32) {
    return jsonResponse({ status: 'error', message: 'El nuevo PIN no es válido.' });
  }
  
  var storedHash = getStoredPinHash(ss);
  if (String(currentPinHash).trim().toLowerCase() !== storedHash) {
    return jsonResponse({ status: 'error', message: 'El PIN actual ingresado es incorrecto.' });
  }
  
  var sheet = getOrCreateConfigSheet(ss);
  updateConfigValue(sheet, 'DOCENTE_PIN_HASH', String(newPinHash).trim().toLowerCase());
  updateConfigValue(sheet, 'ULTIMO_CAMBIO', new Date().toISOString());
  updateConfigValue(sheet, 'INTENTOS_FALLIDOS', 0);
  
  return jsonResponse({
    status: 'success',
    message: 'PIN actualizado exitosamente en Google Sheets.'
  });
}

function getConfigValue(sheet, param) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === param) return data[i][1];
  }
  return null;
}

function updateConfigValue(sheet, param, value) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === param) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  sheet.appendRow([param, value, '']);
}

// ============================================================================
// Configuración de la Hoja Principal de Evaluaciones
// ============================================================================

function setupEvaluacionesSheet(sheet) {
  if (sheet.getName() !== 'Evaluaciones' && sheet.getLastRow() === 0) {
    try { sheet.setName('Evaluaciones'); } catch (e) {}
  }
  
  if (sheet.getLastRow() === 0) {
    var headers = [
      'Fecha y Hora',
      'ID Aspirante',
      'Nombre del Aspirante',
      'Grado',
      'Desempeño Total (%)',
      'Nivel MCER General',
      'Estado',
      'Reading (%)',
      'Reading (Nivel)',
      'Listening (%)',
      'Listening (Nivel)',
      'Writing (Texto)',
      'Speaking (Grabación)',
      'Observaciones Docente',
      'Datos JSON (Backup)'
    ];
    
    sheet.appendRow(headers);
    
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#2f5bea');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
    
    for (var i = 1; i <= headers.length; i++) {
      sheet.setColumnWidth(i, 160);
    }
  }
}

/**
 * Helper para respuestas en formato JSON
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
