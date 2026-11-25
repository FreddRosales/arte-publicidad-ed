/* catalogo.js — Catálogo con filtros por tipo y material, y detalle en modal */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const obras = ED.getCatalog();
  const params = new URLSearchParams(location.search);
  const grid = document.getElementById('grid-obras');
  const contador = document.getElementById('contador');
  const vacio = document.getElementById('sin-resultados');

  const unicos = (campo) => [...new Set(obras.map((o) => o[campo]))].sort((a, b) => a.localeCompare(b, 'es'));
  const checks = (campo, lista, marcadas) => lista.map((v, i) => `
    <div class="form-check">
      <input class="form-check-input filtro" type="checkbox" id="${campo}-${i}" data-campo="${campo}" value="${ED.esc(v)}" ${marcadas.includes(v) ? 'checked' : ''}>
      <label class="form-check-label" for="${campo}-${i}">${ED.esc(v)}</label>
    </div>`).join('');

  const catInicial = params.get('cat') ? [params.get('cat')] : [];
  document.getElementById('f-categorias').innerHTML = checks('categoria', unicos('categoria'), catInicial);
  document.getElementById('f-materiales').innerHTML = checks('material', unicos('material'), []);

  const seleccion = (campo) => [...document.querySelectorAll(`.filtro[data-campo="${campo}"]:checked`)].map((c) => c.value);

  function pintar() {
    const cats = seleccion('categoria');
    const mats = seleccion('material');
    const lista = obras.filter((o) => (!cats.length || cats.includes(o.categoria)) && (!mats.length || mats.includes(o.material)));
    contador.textContent = lista.length;
    vacio.classList.toggle('d-none', lista.length > 0);
    grid.innerHTML = lista.map((o) => `
      <div class="col-sm-6 col-xl-4">
        <article class="work-card">
          ${ED.ui.placeholder(o)}
          <div class="card-body">
            <h3 class="h6 mb-0">${ED.esc(o.titulo)}</h3>
            <p class="small text-muted mb-2">${ED.esc(o.material)}</p>
            <div class="d-flex gap-2 mt-auto">
              <button class="btn btn-outline-primary btn-sm" type="button" data-obra="${o.id}">Ver detalle</button>
              <a class="btn btn-accent btn-sm" href="cotizar.html?obra=${encodeURIComponent(o.titulo)}">Solicitar</a>
            </div>
          </div>
        </article>
      </div>`).join('');
  }

  const modalEl = document.getElementById('modalObra');
  const modal = new bootstrap.Modal(modalEl);
  function abrir(id) {
    const o = obras.find((x) => x.id === Number(id));
    if (!o) return;
    if (ED.track) ED.track('obra', o.titulo);
    document.getElementById('obraTitulo').textContent = o.titulo;
    document.getElementById('obraCuerpo').innerHTML = `
      ${ED.ui.placeholder(o, 'lg rounded-3 mb-3')}
      <p>${ED.esc(o.descripcion)}</p>
      <dl class="row mb-0"><dt class="col-4">Tipo</dt><dd class="col-8">${ED.esc(o.categoria)}</dd>
      <dt class="col-4">Material</dt><dd class="col-8">${ED.esc(o.material)}</dd></dl>
      <p class="small text-muted mt-3 mb-0">Precio y plazo: se confirman solo con la cotización personalizada.</p>`;
    document.getElementById('obraCotizar').href = `cotizar.html?obra=${encodeURIComponent(o.titulo)}`;
    modal.show();
  }

  grid.addEventListener('click', (e) => { const b = e.target.closest('[data-obra]'); if (b) abrir(b.dataset.obra); });
  document.getElementById('filtros').addEventListener('change', pintar);
  document.getElementById('limpiar').addEventListener('click', () => {
    document.querySelectorAll('.filtro').forEach((c) => { c.checked = false; });
    pintar();
  });

  pintar();
  if (params.get('obra')) abrir(params.get('obra'));
});
