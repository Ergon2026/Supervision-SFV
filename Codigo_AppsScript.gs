/**
 * SUPERVISIÓN SFV CAMPO — Backend Apps Script
 * -------------------------------------------------------------
 * Recibe los registros enviados por el aplicativo (PWA) cuando el
 * técnico recupera señal, los agrega a una Google Sheet y guarda
 * las fotos adjuntas en una carpeta de Drive.
 *
 * INSTALACIÓN:
 * 1. Crea una Google Sheet nueva (o usa una existente) y copia su ID
 *    (está en la URL: .../spreadsheets/d/ESTE_ES_EL_ID/edit).
 * 2. Extensiones > Apps Script, borra el contenido y pega este código.
 * 3. Reemplaza SPREADSHEET_ID y (opcional) DRIVE_FOLDER_ID abajo.
 * 4. Implementar > Nueva implementación > Tipo: Aplicación web.
 *    - Ejecutar como: Yo (tu cuenta)
 *    - Quién tiene acceso: Cualquier usuario
 * 5. Copia la URL que termina en /exec y pégala en el aplicativo,
 *    pestaña "Ajustes" > URL del Web App.
 * -------------------------------------------------------------
 */

const SPREADSHEET_ID = 'PEGA_AQUI_EL_ID_DE_TU_GOOGLE_SHEET';
const SHEET_NAME = 'Supervision SFV';
// Opcional: ID de una carpeta de Drive donde guardar las fotos.
// Si lo dejas vacío (''), las fotos se guardan en una carpeta
// "Fotos_Supervision_SFV" creada automáticamente en tu Drive raíz.
const DRIVE_FOLDER_ID = '';

const HEADERS = [
  'ID', 'Fecha/Hora recibido', 'Fecha/Hora registro', 'Técnico', 'Código suministro/Sistema', 'Registro de prueba',
  'GPS Lat', 'GPS Lng', 'GPS Margen de error (m)',
  'Departamento', 'Provincia', 'Distrito', 'Localidad',
  'Estado del Sistema fotovoltaico', 'Detalle sistema completo', 'Detalle sistema incompleto', 'Casuística',
  'Estado del Panel', 'Casuística (panel)',
  'Tensión panel circuito abierto (V)', 'Tensión batería (V)', 'Tipo batería', 'Capacidad carga batería (AH)',
  'Modelo batería', 'Tipo controlador', 'Tensión controlador tomacorriente (V)', 'Descarga data csv',
  'Módulo SFV libre deterioro', 'Orientación Norte', 'Inclinación 15-20°', 'Ubicación libre sombras',
  'Pedestal verticalidad', 'Controlador libre deterioro', 'Tensión punto entrega', 'Batería libre deterioro',
  'Cables protección UV', 'Cables instalación correcta',
  'Foto Panel', 'Foto Batería', 'Foto Controlador',
  'Foto Medición Panel', 'Foto Medición Batería', 'Foto Medición Tomacorriente', 'Foto Cables PVC'
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000); // evita que dos envíos simultáneos (dos celulares a la vez) pisen la misma fila
  try {
    return procesarRegistro_(e);
  } finally {
    lock.releaseLock();
  }
}

function procesarRegistro_(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const sheet = getSheet_();
    const folder = getFolder_();

    // Los registros marcados como PRUEBA en el celular no deberían llegar
    // aquí (la app los filtra antes de sincronizar), pero por seguridad
    // se rechazan también en el backend si alguno llegara a enviarse.
    if (body.prueba === true) {
      return ContentService.createTextOutput(JSON.stringify({ ok: true, skipped: 'registro de prueba, no se guarda' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Protección contra duplicados: si este ID ya existe en la Sheet
    // (por ejemplo, por una doble sincronización desde el celular),
    // no se vuelve a insertar la fila.
    if (body.id && yaExisteId_(sheet, body.id)) {
      return ContentService.createTextOutput(JSON.stringify({ ok: true, skipped: 'ID ya registrado, evitado duplicado' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const fotoPanelUrl = saveFotoIfPresent_(body.fotos && body.fotos.panel, folder, body.codigo_suministro, 'panel');
    const fotoBateriaUrl = saveFotoIfPresent_(body.fotos && body.fotos.bateria, folder, body.codigo_suministro, 'bateria');
    const fotoControladorUrl = saveFotoIfPresent_(body.fotos && body.fotos.controlador, folder, body.codigo_suministro, 'controlador');
    const fotoMedicionPanelUrl = saveFotoIfPresent_(body.fotos && body.fotos.medicionPanel, folder, body.codigo_suministro, 'medicion_panel');
    const fotoMedicionBateriaUrl = saveFotoIfPresent_(body.fotos && body.fotos.medicionBateria, folder, body.codigo_suministro, 'medicion_bateria');
    const fotoMedicionTomacorrienteUrl = saveFotoIfPresent_(body.fotos && body.fotos.medicionTomacorriente, folder, body.codigo_suministro, 'medicion_tomacorriente');
    const fotoCablesPvcUrl = saveFotoIfPresent_(body.fotos && body.fotos.cablesPvc, folder, body.codigo_suministro, 'cables_pvc');

    const m = body.mantenimiento || {};

    sheet.appendRow([
      body.id || '',
      new Date(),
      body.fecha_hora || '',
      body.tecnico || '',
      body.codigo_suministro || '',
      body.prueba ? 'SI' : 'NO',
      body.gps_lat || '',
      body.gps_lng || '',
      body.gps_precision || '',
      body.departamento || '',
      body.provincia || '',
      body.distrito || '',
      body.localidad || '',
      body.estado_sistema || '',
      body.detalle_completo || '',
      (body.detalle_incompleto || []).join(', '),
      body.casuistica || '',
      body.estado_panel || '',
      body.casuistica_panel || '',
      body.tension_panel_circuito_abierto || '',
      body.tension_bateria || '',
      body.tipo_bateria || '',
      body.capacidad_carga_bateria || '',
      body.modelo_bateria || '',
      body.tipo_controlador || '',
      body.tension_controlador_tomacorriente || '',
      body.descarga_data_csv || '',
      m.modulo_libre_deterioro || '',
      m.orientacion_norte || '',
      m.inclinacion || '',
      m.ubicacion_sombras || '',
      m.pedestal || '',
      m.controlador_deterioro || '',
      m.tension_entrega || '',
      m.bateria_deterioro || '',
      m.cables_uv || '',
      m.cables_instalacion || '',
      fotoPanelUrl,
      fotoBateriaUrl,
      fotoControladorUrl,
      fotoMedicionPanelUrl,
      fotoMedicionBateriaUrl,
      fotoMedicionTomacorrienteUrl,
      fotoCablesPvcUrl
    ]);

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, status: 'Backend Supervisión SFV activo' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Revisa si un ID de registro ya existe en la columna A de la Sheet,
 * para no insertar la misma fila dos veces si llegara a reintentarse
 * un envío (doble sincronización, corte de señal a mitad de envío, etc.).
 */
function yaExisteId_(sheet, id) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
  return ids.indexOf(id) !== -1;
}

function getSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  actualizarEncabezados_(sheet);
  return sheet;
}

/**
 * Mantiene la fila 1 (encabezados) siempre igual a HEADERS, incluso si el
 * código se actualizó después de que la Sheet ya tenía datos. Sin esto,
 * agregar un campo nuevo deja los encabezados viejos mientras las filas
 * nuevas ya traen columnas de más, desalineando todo.
 *
 * IMPORTANTE para futuras modificaciones: los campos nuevos SIEMPRE deben
 * agregarse al FINAL del arreglo HEADERS (y al final del arreglo en
 * sheet.appendRow(...) dentro de procesarRegistro_), nunca insertarse en
 * medio. Insertar en medio corre de lugar todas las columnas siguientes
 * para las filas nuevas, mientras las filas ya guardadas mantienen el
 * orden viejo — eso es lo que causó el desalineamiento actual.
 */
function actualizarEncabezados_(sheet) {
  const rango = sheet.getRange(1, 1, 1, HEADERS.length);
  const actuales = rango.getValues()[0];
  const igual = HEADERS.every((h, i) => actuales[i] === h);
  if (!igual) {
    rango.setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function getFolder_() {
  if (DRIVE_FOLDER_ID) {
    return DriveApp.getFolderById(DRIVE_FOLDER_ID);
  }
  const name = 'Fotos_Supervision_SFV';
  const existing = DriveApp.getFoldersByName(name);
  if (existing.hasNext()) return existing.next();
  return DriveApp.createFolder(name);
}

/**
 * Recibe un data URL base64 ("data:image/jpeg;base64,...."), lo guarda
 * como archivo en Drive y devuelve la URL de visualización.
 */
function saveFotoIfPresent_(dataUrl, folder, codigo, tipo) {
  if (!dataUrl || dataUrl.indexOf('base64,') === -1) return '';
  try {
    const base64 = dataUrl.split('base64,')[1];
    const bytes = Utilities.base64Decode(base64);
    const blob = Utilities.newBlob(bytes, 'image/jpeg',
      `${(codigo || 'SIN_CODIGO')}_${tipo}_${new Date().getTime()}.jpg`);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    return 'ERROR_AL_GUARDAR_FOTO: ' + String(err);
  }
}
