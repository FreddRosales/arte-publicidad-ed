/* trabajos.js — Vista del diseñador: trabajos asignados y cambio de estado (HU15 a HU17) */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const user = ED.requireRole('diseno');
  if (!user) return;

  let seleccion = null;
  const lista = document.getElementById('lista-trab');
  const ficha = document.getElementById('ficha-trab');
  const cambio = document.getElementById('cambio-trab');

  const misTrabajos = () => ED.getRequests()
    .filter((r) => r.asignado === user.nombre)
    .sort((a, b) => (a.entrega || '9999').localeCompare(b.entrega || '9999'));

  function pintarLista() {
    const t = misTrabajos();
    lista.innerHTML = t.length ? t.map((r) => `
      <li><button type="button" class="req-item" data-id="${r.id}" ${seleccion === r.id ? 'aria-current="true"' : ''}>
        <span><strong>${ED.esc(r.id)}</strong> · ${ED.esc(r.servicio)}<br><small>Entrega: ${r.entrega ? ED.fmtDate(r.entrega) : 'por confirmar'} · ${ED.esc(r.cliente)}</small></span>
        ${ED.ui.badge(r.estado)}</button></li>`).join('')
      : '<li class="text-muted">No tienes trabajos asignados por ahora.</li>';
  }

  function pintarFicha() {
    const r = misTrabajos().find((x) => x.id === seleccion);
    if (!r) { ficha.innerHTML = '<p class="text-muted mb-0">Elige un trabajo de la lista.</p>'; cambio.hidden = true; return; }
    ficha.innerHTML = ED.ui.ficha(r);
    document.getElementById('picker-trab').innerHTML = ED.ui.estadoPicker('est-trab', r.estado, ['diseno', 'produccion', 'entregado']);
    cambio.hidden = false;
  }

  lista.addEventListener('click', (e) => {
    const b = e.target.closest('[data-id]'); if (!b) return;
    seleccion = b.dataset.id; pintarLista(); pintarFicha();
  });

  document.getElementById('guardar-trab').addEventListener('click', () => {
    const marcado = document.querySelector('input[name="est-trab"]:checked');
    if (!marcado || !seleccion) { toast('Elige un estado para guardar.', 'warning'); return; }
    const todas = ED.getRequests();
    todas.find((x) => x.id === seleccion).estado = marcado.value;
    ED.saveRequests(todas);
    toast(`${seleccion}: estado cambiado a “${ED.estadoLabel(marcado.value)}”.`);
    pintarLista(); pintarFicha();
  });

  pintarLista();
});
