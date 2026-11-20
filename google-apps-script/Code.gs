/**
 * ============================================================================
 * English Placement Test - Google Apps Script Backend
 * ============================================================================
 * 
 * Este script actúa como webhook para recibir automáticamente los resultados
 * de las pruebas de inglés y registrarlos en la hoja de cálculo de Google Sheets.
 */

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    // Configurar encabezados si la hoja está vacía
    setupHeaders(sheet);
    
    // Parsear payload recibido
    var data = JSON.parse(e.postData.contents);
    
    // Caso de prueba de conexión (Ping)
    if (data.action === 'ping') {
      sheet.appendRow([
        new Date(),
        'TEST-PING',
        'Prueba de conexión exitosa',
        '-',
        '-',
        '-',
        'Conexión OK',
        '-',
        '-',
        '-',
        '-',
        '-',
        '-',
        'Verificación desde el panel docente',
        '{}'
      ]);
      return ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'Conexión exitosa' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Formatear fecha
    var fecha = data.timestamp ? new Date(data.timestamp) : new Date();
    
    // Agregar registro del aspirante
    sheet.appendRow([
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
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("English Placement Test Webhook está activo y listo para recibir evaluaciones.");
}

/**
 * Crea y formatea la fila de títulos si la hoja está recién creada.
 */
function setupHeaders(sheet) {
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
    
    // Aplicar formato visual elegante a los encabezados
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#2f5bea');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
    
    // Autoajustar ancho básico
    for (var i = 1; i <= headers.length; i++) {
      sheet.setColumnWidth(i, 160);
    }
  }
}
