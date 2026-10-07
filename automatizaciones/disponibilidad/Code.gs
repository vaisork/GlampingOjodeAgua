const CALENDARIOS = [
  // Reservas directas
  'f6e1c1451f312d568b13280a247a92be0ab4701a3e73d4365eb2c6df4bf3f655@group.calendar.google.com',

  // Airbnb Ojo de Agua
  'gllnddlh1l77v85uc0cl91tbhonahu50@import.calendar.google.com'
];

function doGet(e) {
  try {
    const callback = e && e.parameter ? e.parameter.callback : '';

    const hoy = new Date();

    // Consultamos desde 90 días atrás hasta 2 años adelante.
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

    CALENDARIOS.forEach(calendarId => {
      const calendario = CalendarApp.getCalendarById(calendarId);

      if (!calendario) {
        throw new Error('No se pudo acceder al calendario: ' + calendarId);
      }

      const eventos = calendario.getEvents(desde, hasta);

      eventos.forEach(evento => {
        let inicio;
        let fin;

        if (evento.isAllDayEvent()) {
          inicio = evento.getAllDayStartDate();
          fin = evento.getAllDayEndDate();
        } else {
          inicio = evento.getStartTime();
          fin = evento.getEndTime();
        }

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

        // Entrada incluida, salida excluida.
        while (dia < salida) {
          ocupados.add(formatearFecha(dia));
          dia.setDate(dia.getDate() + 1);
        }
      });
    });

    const respuesta = {
      ok: true,
      ocupados: Array.from(ocupados).sort(),
      actualizado: new Date().toISOString()
    };

    const json = JSON.stringify(respuesta);

    // La página pública usa JSONP.
    if (callback) {
      return ContentService
        .createTextOutput(callback + '(' + json + ');')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return ContentService
      .createTextOutput(json)
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    const callback = e && e.parameter ? e.parameter.callback : '';

    const respuesta = {
      ok: false,
      error: String(error)
    };

    const json = JSON.stringify(respuesta);

    if (callback) {
      return ContentService
        .createTextOutput(callback + '(' + json + ');')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return ContentService
      .createTextOutput(json)
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function formatearFecha(fecha) {
  return Utilities.formatDate(
    fecha,
    Session.getScriptTimeZone(),
    'yyyy-MM-dd'
  );
}
