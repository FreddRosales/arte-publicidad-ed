/* inicio.js — Portada: servicios y trabajos recientes */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // Cada servicio enlaza con su categoría del catálogo
  const CATEGORIA = { banner: 'Impresión', tarjetas: 'Impresión', logotipo: 'Diseño', letrero: 'Exterior', estampado: 'Estampados', foto: 'Eventos' };

  document.getElementById('lista-servicios').innerHTML = ED.SERVICIOS.map((s) => `
    <div class="col-6 col-md-4">
      <a class="service-card d-block text-decoration-none text-reset" href="catalogo.html?cat=${encodeURIComponent(CATEGORIA[s.id])}">
        <i class="bi ${s.icono}" aria-hidden="true"></i>
        <h3 class="h6 mt-2 mb-1">${ED.esc(s.nombre)}</h3>
        <span class="small" style="color:var(--ed-red-aa)">Ver ejemplos <i class="bi bi-arrow-right" aria-hidden="true"></i></span>
      </a>
    </div>`).join('');

  document.getElementById('lista-recientes').innerHTML = ED.getCatalog().slice(0, 3).map((o) => `
    <div class="col-md-4">
      <article class="work-card">
        ${ED.ui.placeholder(o)}
        <div class="card-body">
          <p class="mb-1 small text-muted">${ED.esc(o.descripcion)}</p>
          <div class="d-flex gap-2 mt-auto">
            <a class="btn btn-outline-primary btn-sm" href="catalogo.html?obra=${o.id}">Ver detalle</a>
            <a class="btn btn-accent btn-sm" href="cotizar.html?obra=${encodeURIComponent(o.titulo)}">Solicitar</a>
          </div>
        </div>
      </article>
    </div>`).join('');

  document.getElementById('cta-wa').href = ED.waLink('Hola, quisiera cotizar un proyecto.');
});
