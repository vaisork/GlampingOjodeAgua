/*
 * GLAMPING OJO DE AGUA
 * Disponibilidad: Airbnb + Reservas Directas
 *
 * Mantiene el contrato:
 *   ok, ocupados, actualizado
 *
 * Agrega:
 *   fuentes.directas
 *   fuentes.airbnb       (copia importada en Google, tarda 8-24 h)
 *   fuentes.airbnb_ical  (enlace iCal de Airbnb, en minutos)
 *
 * Configuración: Propiedades del script → AIRBNB_ICAL_URL
 * (enlace de exportación de Airbnb; no va en el código).
 */

const CALENDARIOS = {
  directas:
    'f6e1c1451f312d568b13280a247a92be0ab4701a3e73d4365eb2c6df4bf3f655@group.calendar.google.com',

  airbnb:
    'gllnddlh1l77v85uc0cl91tbhonahu50@import.calendar.google.com'
};

function doGet(e) {
  const callback = e && e.parameter
    ? e.parameter.callback || ''
    : '';

  // Solo permitir nombres válidos de callback JSONP.
  if (
    callback &&
    !/^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/.test(callback)
  ) {
    return responder({
      ok: false,
      ocupados: [],
      actualizado: new Date().toISOString(),
      error: 'Callback JSONP inválido'
    }, '');
  }

  try {
    const hoy = new Date();

    const desde = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate() - 90,
      0, 0, 0
    );

    const hasta = new Date(
      hoy.getFullYear() + 2,
      hoy.getMonth(),
      hoy.getDate(),
      23, 59, 59
    );

    const ocupados = new Set();
    const fuentes = {};

    // Consultar ambas fuentes de Google Calendar.
    for (const [nombre, calendarId] of
      Object.entries(CALENDARIOS)) {

      const calendario =
        CalendarApp.getCalendarById(calendarId);

      if (!calendario) {
        throw new Error(
          'No se pudo acceder a la fuente: ' + nombre
        );
      }

      const eventos =
        calendario.getEvents(desde, hasta);

      const nochesFuente = new Set();

      for (const evento of eventos) {

        // Las reservas deben ser de día completo.
        if (!evento.isAllDayEvent()) {
          throw new Error(
            'Evento sin formato de día completo en: ' +
            nombre
          );
        }

        const inicio = evento.getAllDayStartDate();
        const fin = evento.getAllDayEndDate();

        let dia = new Date(
          inicio.getFullYear(),
          inicio.getMonth(),
          inicio.getDate(),
          12, 0, 0
        );

        const salida = new Date(
          fin.getFullYear(),
          fin.getMonth(),
          fin.getDate(),
          12, 0, 0
        );

        if (dia >= salida) {
          throw new Error(
            'Rango de fechas inválido en: ' + nombre
          );
        }

        // Entrada incluida, salida excluida.
        while (dia < salida) {
          const fecha = formatearFecha(dia);

          nochesFuente.add(fecha);
          ocupados.add(fecha);

          dia.setDate(dia.getDate() + 1);
        }
      }

      fuentes[nombre] = {
        ok: true,
        actualizado: new Date().toISOString(),
        n: eventos.length,
        noches_ocupadas: nochesFuente.size
      };
    }

    // Airbnb directo: suma reservas y bloqueos recientes que la copia
    // importada en Google todavía no tiene. Si falla, la copia de Google
    // sigue cubriendo lo ya sincronizado.
    const ical = leerIcalAirbnb();
    ical.fechas.forEach(fecha => ocupados.add(fecha));
    fuentes.airbnb_ical = {
      ok: ical.ok,
      actualizado: new Date().toISOString(),
      noches_ocupadas: ical.fechas.length,
      error: ical.error || undefined
    };

    return responder({
      ok: true,
      ocupados: Array.from(ocupados).sort(),
      actualizado: new Date().toISOString(),
      fuentes: fuentes
    }, callback);

  } catch (error) {

    // Fallar cerrado: nunca devolver ocupación parcial
    // como si la disponibilidad fuera confiable.
    console.error(
      'Error de disponibilidad: ' + String(error)
    );

    return responder({
      ok: false,
      ocupados: [],
      actualizado: new Date().toISOString(),
      error: 'No se pudo verificar toda la disponibilidad'
    }, callback);
  }
}

function leerIcalAirbnb() {
  const url = PropertiesService
    .getScriptProperties()
    .getProperty('AIRBNB_ICAL_URL');

  if (!url) {
    return { ok: false, fechas: [], error: 'Falta AIRBNB_ICAL_URL' };
  }

  try {
    const respuesta = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      followRedirects: true
    });

    if (respuesta.getResponseCode() !== 200) {
      return {
        ok: false,
        fechas: [],
        error: 'HTTP ' + respuesta.getResponseCode()
      };
    }

    // Une líneas plegadas del formato iCal.
    const texto = respuesta
      .getContentText()
      .replace(/\r?\n[ \t]/g, '');

    const fechas = new Set();

    texto.split('BEGIN:VEVENT').slice(1).forEach(bloque => {
      const inicio = (bloque.match(/DTSTART[^:]*:(\d{8})/) || [])[1];
      const fin = (bloque.match(/DTEND[^:]*:(\d{8})/) || [])[1];
      if (!inicio || !fin) return;

      const dia = new Date(
        +inicio.slice(0, 4), +inicio.slice(4, 6) - 1, +inicio.slice(6, 8), 12
      );
      const salida = new Date(
        +fin.slice(0, 4), +fin.slice(4, 6) - 1, +fin.slice(6, 8), 12
      );

      // Entrada incluida, salida excluida.
      while (dia < salida) {
        fechas.add(formatearFecha(dia));
        dia.setDate(dia.getDate() + 1);
      }
    });

    return { ok: true, fechas: Array.from(fechas) };

  } catch (error) {
    return { ok: false, fechas: [], error: String(error) };
  }
}

function formatearFecha(fecha) {
  return Utilities.formatDate(
    fecha,
    Session.getScriptTimeZone(),
    'yyyy-MM-dd'
  );
}

function responder(datos, callback) {
  const json = JSON.stringify(datos);

  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
