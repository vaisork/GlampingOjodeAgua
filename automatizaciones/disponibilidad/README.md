# Respaldo — disponibilidad del calendario de Ojo de Agua

Este directorio permite reconstruir rápidamente el Google Apps Script que alimenta la disponibilidad pública de:

`https://glampingojodeagua.mx/calendario.html`

## Proyecto actual

- Cuenta propietaria recomendada: `canvas90.tu.complice@gmail.com`
- Nombre del proyecto: `Ojo de Agua - Disponibilidad`
- Zona horaria: `America/Mexico_City`
- Aplicación web actual:
  `https://script.google.com/macros/s/AKfycbzpfwn2K9ss4Jokeh3yKJlVkOZBAuVOyajXf7iBturQzcaTB2ef2kg3Ujg_XnDmTj4ZVw/exec`

## Calendarios que consulta

- Reservas directas:
  `f6e1c1451f312d568b13280a247a92be0ab4701a3e73d4365eb2c6df4bf3f655@group.calendar.google.com`
- Airbnb Ojo de Agua:
  `gllnddlh1l77v85uc0cl91tbhonahu50@import.calendar.google.com`

## Recuperación rápida si el Apps Script se borra

1. Entrar a `script.google.com` con `canvas90.tu.complice@gmail.com`.
2. Crear un proyecto llamado `Ojo de Agua - Disponibilidad`.
3. Ajustar la zona horaria a Ciudad de México / `America/Mexico_City`.
4. Copiar y pegar íntegramente `Code.gs` de este directorio.
5. Guardar.
6. Implementar > Nueva implementación > Aplicación web.
7. Ejecutar como: **Yo**.
8. Acceso: **Cualquier usuario**.
9. Autorizar acceso a Google Calendar.
10. Abrir la nueva URL `/exec` y comprobar que responda:
    `{"ok":true,"ocupados":[...]}`
11. En `calendario.html`, reemplazar únicamente el valor de `APPS_SCRIPT_URL` por la nueva URL `/exec`.
12. Publicar y probar el calendario público.

## Comportamiento esperado

El script combina Airbnb y reservas directas y sólo expone fechas ocupadas, nunca nombres de huéspedes ni detalles privados.

Las reservas se interpretan como noches: fecha de entrada incluida y fecha de salida excluida. Por ejemplo, una reserva del 8 al 9 bloquea el día 8 y permite usar el 9 como salida o nueva entrada.

La página pública consume el endpoint mediante JSONP usando el parámetro `callback`.
