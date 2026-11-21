/* seguimiento.js — Consulta del estado de un pedido por número de solicitud */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-seg');
  const input = document.getElementById('numero');
  const out = document.getElementById('resultado');

  function consultar(texto) {
    const id = ED.normalizeId(texto);
    if (!id) {
      input.classList.add('is-invalid'); input.setAttribute('aria-invalid', 'true'); input.focus();
      out.innerHTML = '';
      return;
    }
    input.classList.remove('is-invalid'); input.setAttribute('aria-invalid', 'false');
    input.value = id;
    const r = ED.getRequests().find((x) => x.id === id);
    if (!r) {
      out.innerHTML = `<div class="alert alert-warning" role="alert"><strong>No encontramos la solicitud ${ED.esc(id)}.</strong>
        Revisa el número o escríbenos por WhatsApp.
        <a class="btn btn-whatsapp btn-sm mt-2 d-table" target="_blank" rel="noopener" href="${ED.waLink(`Hola, no encuentro mi solicitud ${id}.`)}"><i class="bi bi-whatsapp" aria-hidden="true"></i> Consultar por WhatsApp</a></div>`;
      return;
    }
    const idx = ED.estadoIndex(r.estado);
    const actual = idx === -1 ? ED.RECIBIDA : ED.ESTADOS[idx];
    out.innerHTML = `
      <section class="panel-card" aria-labelledby="h-res-seg">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
          <div><p class="small text-muted mb-0">${ED.esc(r.id)}</p><h2 class="h4 mb-0" id="h-res-seg">${ED.esc(r.servicio)}</h2></div>
          <span class="badge estado estado-${r.estado} fs-6">Estado actual: ${ED.esc(actual.label)}</span>
        </div>
        ${idx === -1 ? '' : ED.ui.timeline(r.estado)}
        <p class="mb-3 ${idx === -1 ? 'mt-3' : ''}"><i class="bi bi-info-circle" aria-hidden="true"></i> ${ED.esc(actual.desc)}</p>
        <div class="row g-3">
          <div class="col-md-6"><div class="summary-box h-100"><h3 class="h6">Entrega estimada</h3>
            <p class="mb-0">${r.entrega ? ED.fmtDate(r.entrega) : 'Se confirmará con tu cotización.'}</p></div></div>
          <div class="col-md-6"><div class="summary-box h-100"><h3 class="h6">Datos de la solicitud</h3>
            <p class="mb-0">${ED.esc([r.cantidad && `Cantidad: ${r.cantidad}`, r.medidas && `Medidas: ${r.medidas}`, r.material && `Material: ${r.material}`].filter(Boolean).join(' · ') || '—')}</p></div></div>
        </div>
        <a class="btn btn-whatsapp mt-3" target="_blank" rel="noopener" href="${ED.waLink(`Hola, consulto por mi solicitud ${r.id}.`)}">
          <i class="bi bi-whatsapp" aria-hidden="true"></i> Consultar por WhatsApp</a>
      </section>`;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); consultar(input.value); });
  const n = new URLSearchParams(location.search).get('n');
  if (n) consultar(n);
});
