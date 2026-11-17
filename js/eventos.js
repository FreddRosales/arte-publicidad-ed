/* eventos.js — Calendario de fechas disponibles (solo consulta, no reserva) */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const DIAS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  let anio = hoy.getFullYear();
  let mes = hoy.getMonth();
  let elegida = null;

  const titulo = document.getElementById('mes-titulo');
  const cuerpo = document.getElementById('cal-body');
  const detalle = document.getElementById('detalle-fecha');
  const btnAnt = document.getElementById('mes-ant');
  document.getElementById('cal-head').innerHTML = DIAS.map((d) => `<th scope="col">${d}</th>`).join('');

  const larga = (d) => d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  function pintar() {
    const nombreMes = new Date(anio, mes, 1).toLocaleDateString('es-PE', { month: 'long' });
    titulo.textContent = `${nombreMes.charAt(0).toUpperCase()}${nombreMes.slice(1)} ${anio}`;
    btnAnt.disabled = anio === hoy.getFullYear() && mes === hoy.getMonth();
    const primero = new Date(anio, mes, 1).getDay();
    const total = new Date(anio, mes + 1, 0).getDate();
    let html = '<tr>';
    for (let i = 0; i < primero; i++) html += '<td></td>';
    for (let d = 1; d <= total; d++) {
      const fecha = new Date(anio, mes, d);
      const pasado = fecha < hoy;
      const ok = ED.fechaDisponible(fecha);
      const iso = ED.iso(fecha);
      const cls = pasado ? 'pasado' : ok ? '' : 'nodisp';
      const estado = pasado ? 'ya pasó' : ok ? 'disponible' : 'no disponible';
      html += `<td><button type="button" class="cal-day ${cls} ${iso === elegida ? 'sel' : ''}" data-fecha="${iso}"
        aria-label="${d} de ${fecha.toLocaleDateString('es-PE', { month: 'long' })}: ${estado}"
        ${pasado || !ok ? 'aria-disabled="true"' : ''} ${iso === elegida ? 'aria-pressed="true"' : ''}>${d}</button></td>`;
      if ((primero + d) % 7 === 0 && d !== total) html += '</tr><tr>';
    }
    cuerpo.innerHTML = `${html}</tr>`;
  }

  cuerpo.addEventListener('click', (e) => {
    const b = e.target.closest('.cal-day'); if (!b) return;
    const [y, m, d] = b.dataset.fecha.split('-').map(Number);
    const fecha = new Date(y, m - 1, d);
    if (b.getAttribute('aria-disabled') === 'true') {
      elegida = null; pintar();
      detalle.innerHTML = `<h2 class="h6">Fecha elegida</h2><p class="mb-0"><strong class="text-capitalize">${larga(fecha)}</strong> no está disponible. Elige otro día marcado como disponible.</p>`;
      return;
    }
    elegida = b.dataset.fecha; pintar();
    detalle.innerHTML = `<h2 class="h6">Fecha elegida</h2>
      <p class="text-capitalize fw-bold mb-1">${larga(fecha)}</p>
      <p class="mb-3"><span class="badge estado estado-aprobado">Disponible</span></p>
      <p class="small text-muted">Consulta referencial: no es una reserva. La fecha se confirma en tu cotización.</p>
      <a class="btn btn-accent w-100" href="cotizar.html?fecha=${elegida}">Cotizar para esta fecha</a>`;
    const nuevo = cuerpo.querySelector(`[data-fecha="${elegida}"]`); if (nuevo) nuevo.focus();
  });

  const mover = (n) => { mes += n; if (mes > 11) { mes = 0; anio++; } if (mes < 0) { mes = 11; anio--; } pintar(); };
  btnAnt.addEventListener('click', () => mover(-1));
  document.getElementById('mes-sig').addEventListener('click', () => mover(1));
  pintar();
});
