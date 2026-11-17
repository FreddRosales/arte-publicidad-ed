/* ==========================================================================
   main.js — Encabezado, pie de página, accesibilidad, idioma y componentes
   compartidos. Se carga en TODAS las páginas (después de data.js).
   ========================================================================== */
'use strict';

/* ---------- Idioma (ES / EN) ----------
   Solo se traducen el menú, el pie y la portada (demostración de
   adaptación lingüística). Para agregar otro idioma (p. ej. quechua),
   basta con añadir otra clave en este diccionario. */
const I18N = {
  es: {
    skip: 'Saltar al contenido',
    'nav.servicios': 'Servicios', 'nav.catalogo': 'Catálogo', 'nav.cotizar': 'Cotizar',
    'nav.pedido': 'Mi pedido', 'nav.eventos': 'Fechas', 'nav.nosotros': 'Nosotros',
    'nav.pedir': 'Pedir cotización', 'nav.personal': 'Personal', 'nav.login': 'Acceso personal', 'nav.panel': 'Mi panel',
    'foot.tel': 'Teléfono', 'foot.ubic': 'Ubicación', 'foot.reclamos': 'Libro de reclamaciones',
    'foot.lema': 'Diseño, impresión y publicidad a tu medida.',
    'home.titulo': 'Tu Idea Merece Verse en Grande.',
    'home.sub': 'Diseño gráfico, impresión publicitaria, letreros, estampados, fotografía y video en Bambamarca. Cuéntanos qué necesitas y te respondemos en 24 a 48 horas hábiles.',
    'home.cta1': 'Pedir cotización', 'home.cta2': 'Ver trabajos',
    'home.servicios': 'Nuestros servicios', 'home.recientes': 'Nuevos trabajos', 'home.vermas': 'Ver todo el catálogo',
    'home.cierre': 'Hagamos realidad tu próximo proyecto.'
  },
  en: {
    skip: 'Skip to content',
    'nav.servicios': 'Services', 'nav.catalogo': 'Catalog', 'nav.cotizar': 'Get a quote',
    'nav.pedido': 'My order', 'nav.eventos': 'Dates', 'nav.nosotros': 'About us',
    'nav.pedir': 'Request a quote', 'nav.personal': 'Staff', 'nav.login': 'Staff login', 'nav.panel': 'My panel',
    'foot.tel': 'Phone', 'foot.ubic': 'Location', 'foot.reclamos': 'Complaints book',
    'foot.lema': 'Design, printing and advertising made to measure.',
    'home.titulo': 'Your Idea Deserves to be Seen Big.',
    'home.sub': 'Graphic design, advertising print, signs, custom apparel, photo and video in Bambamarca. Tell us what you need and we will reply within 24 to 48 business hours.',
    'home.cta1': 'Request a quote', 'home.cta2': 'See our work',
    'home.servicios': 'Our services', 'home.recientes': 'Latest work', 'home.vermas': 'View full catalog',
    'home.cierre': "Let's make your next project happen."
  }
};

/* ---------- Preferencias de accesibilidad ---------- */
const Prefs = (() => {
  const KEY = 'ed_prefs';
  let p = ED.store.get(KEY, null) || { fs: 100, hc: false, lang: 'es' };
  const save = () => ED.store.set(KEY, p);
  const apply = () => {
    document.documentElement.style.fontSize = `${p.fs}%`;
    document.body.classList.toggle('alto-contraste', p.hc);
    document.documentElement.lang = p.lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const t = I18N[p.lang][el.dataset.i18n];
      if (t) el.textContent = t;
    });
    const hcBtn = document.getElementById('btn-contraste');
    if (hcBtn) hcBtn.setAttribute('aria-pressed', String(p.hc));
    const lg = document.getElementById('btn-idioma');
    if (lg) { lg.textContent = p.lang === 'es' ? 'EN' : 'ES'; lg.setAttribute('aria-label', p.lang === 'es' ? 'Switch to English' : 'Cambiar a español'); }
  };
  return {
    get lang() { return p.lang; },
    init: apply,
    bigger() { p.fs = Math.min(150, p.fs + 10); save(); apply(); },
    smaller() { p.fs = Math.max(80, p.fs - 10); save(); apply(); },
    reset() { p.fs = 100; save(); apply(); },
    toggleContrast() { p.hc = !p.hc; save(); apply(); },
    toggleLang() { p.lang = p.lang === 'es' ? 'en' : 'es'; save(); apply(); }
  };
})();

const t = (k) => (I18N[Prefs.lang] && I18N[Prefs.lang][k]) || I18N.es[k] || k;

/* ---------- Encabezado y pie ---------- */
const NAV = [
  { key: 'servicios', href: 'index.html#servicios', page: 'inicio-serv' },
  { key: 'catalogo', href: 'catalogo.html', page: 'catalogo' },
  { key: 'cotizar', href: 'cotizar.html', page: 'cotizar' },
  { key: 'pedido', href: 'seguimiento.html', page: 'seguimiento' },
  { key: 'eventos', href: 'eventos.html', page: 'eventos' },
  { key: 'nosotros', href: 'nosotros.html', page: 'nosotros' }
];

function a11yBar() {
  return `
  <div class="a11y-bar" role="region" aria-label="Opciones de accesibilidad">
    <div class="container d-flex justify-content-end align-items-center gap-1 flex-wrap">
      <span class="small me-1" aria-hidden="true"><i class="bi bi-universal-access"></i></span>
      <button type="button" class="btn btn-sm btn-a11y" id="btn-menos" aria-label="Reducir tamaño de letra">A−</button>
      <button type="button" class="btn btn-sm btn-a11y" id="btn-normal" aria-label="Tamaño de letra normal">A</button>
      <button type="button" class="btn btn-sm btn-a11y" id="btn-mas" aria-label="Aumentar tamaño de letra">A+</button>
      <button type="button" class="btn btn-sm btn-a11y" id="btn-contraste" aria-pressed="false"><i class="bi bi-circle-half" aria-hidden="true"></i> Contraste</button>
      <button type="button" class="btn btn-sm btn-a11y" id="btn-idioma">EN</button>
    </div>
  </div>`;
}

function renderHeader(page, layout) {
  const host = document.getElementById('site-header');
  if (!host) return;
  const skip = `<a class="skip-link" href="#contenido" data-i18n="skip">Saltar al contenido</a>`;
  if (layout === 'staff') {
    const u = ED.getUser();
    host.innerHTML = `${skip}${a11yBar()}
    <header class="site-header border-bottom bg-white">
      <div class="container py-2 d-flex align-items-center justify-content-between gap-2 flex-wrap">
        <a href="index.html" class="navbar-brand m-0"><img src="assets/img/logo.png" alt="Arte y Publicidad E&D — ir al sitio" height="44"></a>
        <div class="d-flex align-items-center gap-2 flex-wrap">
          ${u ? `<span class="small text-muted"><i class="bi bi-person-circle" aria-hidden="true"></i> ${ED.esc(u.nombre)}</span>
          <button type="button" class="btn btn-sm btn-outline-primary" id="btn-salir">Cerrar sesión</button>` : ''}
          <a class="btn btn-sm btn-outline-secondary" href="index.html">Volver al sitio</a>
        </div>
      </div>
    </header>`;
    const out = document.getElementById('btn-salir');
    if (out) out.addEventListener('click', () => { ED.store.remove(ED.KEY_USER); location.href = 'login.html'; });
    return;
  }
  // Acceso del personal: si ya hay sesión, lleva directo a su panel
  const u = ED.getUser();
  const accesoHref = u ? (u.rol === 'admin' ? 'panel.html' : 'trabajos.html') : 'login.html';
  const accesoKey = u ? 'nav.panel' : 'nav.login';
  const accesoTxt = I18N.es[accesoKey];
  const links = NAV.map((n) => `
    <li class="nav-item"><a class="nav-link${n.page === page ? ' active' : ''}" ${n.page === page ? 'aria-current="page"' : ''}
      href="${n.href}" data-i18n="nav.${n.key}">${I18N.es['nav.' + n.key]}</a></li>`).join('');
  host.innerHTML = `${skip}${a11yBar()}
  <header class="site-header">
    <nav class="navbar navbar-expand-lg bg-white border-bottom" aria-label="Principal">
      <div class="container">
        <a class="navbar-brand" href="index.html"><img src="assets/img/logo.png" alt="Arte y Publicidad E&D — inicio" height="48"></a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menuPrincipal"
          aria-controls="menuPrincipal" aria-expanded="false" aria-label="Abrir o cerrar el menú">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="menuPrincipal">
          <ul class="navbar-nav ms-auto align-items-lg-center gap-lg-1">
            ${links}
            <li class="nav-item"><a class="nav-link" href="${accesoHref}"><i class="bi bi-person-circle" aria-hidden="true"></i> <span data-i18n="${accesoKey}">${accesoTxt}</span></a></li>
            <li class="nav-item ms-lg-2 my-2 my-lg-0"><a class="btn btn-primary" href="cotizar.html" data-i18n="nav.pedir">Pedir cotización</a></li>
          </ul>
        </div>
      </div>
    </nav>
  </header>`;
}

function renderFooter(layout) {
  const host = document.getElementById('site-footer');
  if (!host) return;
  if (layout === 'staff') { host.innerHTML = ''; return; }
  host.innerHTML = `
  <footer class="site-footer mt-5">
    <div class="container py-4">
      <div class="row g-4">
        <div class="col-12 col-md-4">
          <p class="fw-bold mb-2">Arte y Publicidad E&amp;D</p>
          <p class="mb-3" data-i18n="foot.lema">Diseño, impresión y publicidad a tu medida.</p>
          <ul class="list-unstyled d-flex flex-column gap-1 mb-0">
            <li><a href="#" class="footer-link"><i class="bi bi-instagram" aria-hidden="true"></i> Instagram</a></li>
            <li><a href="#" class="footer-link"><i class="bi bi-facebook" aria-hidden="true"></i> Facebook</a></li>
            <li><a href="#" class="footer-link"><i class="bi bi-tiktok" aria-hidden="true"></i> TikTok</a></li>
            <li><a href="${(ED.getUser() ? (ED.getUser().rol === 'admin' ? 'panel.html' : 'trabajos.html') : 'login.html')}" class="footer-link"><i class="bi bi-person-circle" aria-hidden="true"></i> <span data-i18n="nav.login">Acceso personal</span></a></li>
          </ul>
        </div>
        <div class="col-12 col-md-5">
          <p class="mb-1"><strong data-i18n="foot.tel">Teléfono</strong>: <a class="footer-link" href="tel:+51945380460">945 380 460</a></p>
          <p class="mb-0"><strong data-i18n="foot.ubic">Ubicación</strong>: Jr. Jorge Chávez 846 — Bambamarca, Cajamarca</p>
        </div>
        <div class="col-12 col-md-3">
          <button type="button" class="btn btn-outline-light w-100" data-bs-toggle="modal" data-bs-target="#modalReclamos">
            <i class="bi bi-book" aria-hidden="true"></i> <span data-i18n="foot.reclamos">Libro de reclamaciones</span>
          </button>
        </div>
      </div>
      <hr class="border-light opacity-25 my-3">
      <p class="small mb-0">© 2026 Arte y Publicidad E&amp;D · Prototipo académico — Universidad Privada del Norte</p>
    </div>
  </footer>

  <a class="wa-float" href="${ED.waLink('Hola, quisiera información sobre sus servicios.')}" target="_blank" rel="noopener"
     aria-label="Escribir por WhatsApp (se abre en una pestaña nueva)"><i class="bi bi-whatsapp" aria-hidden="true"></i></a>

  <div class="modal fade" id="modalReclamos" tabindex="-1" aria-labelledby="tituloReclamos" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered"><div class="modal-content">
      <div class="modal-header"><h2 class="modal-title fs-5" id="tituloReclamos">Libro de reclamaciones</h2>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div>
      <div class="modal-body">En el prototipo este botón lleva al libro de reclamaciones virtual de la empresa. Mientras tanto, puedes escribirnos por WhatsApp o acercarte a nuestro local.</div>
      <div class="modal-footer"><button type="button" class="btn btn-primary" data-bs-dismiss="modal">Entendido</button></div>
    </div></div>
  </div>`;
}

/* ---------- Avisos (toast accesible) ---------- */
function toast(msg, tipo = 'success') {
  let box = document.getElementById('toast-box');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toast-box';
    box.className = 'toast-container position-fixed bottom-0 start-50 translate-middle-x p-3';
    box.setAttribute('aria-live', 'polite');
    document.body.appendChild(box);
  }
  const el = document.createElement('div');
  el.className = `toast align-items-center text-bg-${tipo} border-0`;
  el.setAttribute('role', 'status');
  el.innerHTML = `<div class="d-flex"><div class="toast-body">${ED.esc(msg)}</div>
    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar aviso"></button></div>`;
  box.appendChild(el);
  const inst = new bootstrap.Toast(el, { delay: 4500 });
  el.addEventListener('hidden.bs.toast', () => el.remove());
  inst.show();
}

/* ---------- Componentes de interfaz compartidos ---------- */
ED.ui = {
  badge(id) { return `<span class="badge estado estado-${id}">${ED.esc(ED.estadoLabel(id))}</span>`; },

  timeline(estado) {
    const idx = ED.estadoIndex(estado);
    const items = ED.ESTADOS.map((e, i) => {
      const cls = i < idx ? 'done' : i === idx ? 'current' : '';
      const sr = i < idx ? ' (completado)' : i === idx ? ' (etapa actual)' : ' (pendiente)';
      return `<li class="${cls}" ${i === idx ? 'aria-current="step"' : ''}>
        <span class="tl-dot" aria-hidden="true"></span>
        <span class="tl-label">${ED.esc(e.label)}<span class="visually-hidden">${sr}</span></span></li>`;
    }).join('');
    return `<ol class="timeline" aria-label="Avance del pedido">${items}</ol>`;
  },

  ficha(r) {
    const fila = (k, v) => `<div class="col-6"><div class="ficha-dato"><span class="ficha-k">${k}</span><span class="ficha-v">${ED.esc(v || '—')}</span></div></div>`;
    return `
      <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
        <div><p class="small text-muted mb-0">${ED.esc(r.id)}</p><h3 class="h5 mb-0">${ED.esc(r.servicio)}</h3></div>
        ${ED.ui.badge(r.estado)}
      </div>
      <div class="row g-2">
        ${fila('Cliente', r.cliente)}${fila('Contacto', r.contacto)}
        ${fila('Medidas', r.medidas)}${fila('Material', r.material)}
        ${fila('Cantidad', r.cantidad)}${fila('Entrega', r.entrega ? ED.fmtDate(r.entrega) : 'Por confirmar')}
        ${r.tipoEvento ? fila('Evento', `${r.tipoEvento} · ${ED.fmtDate(r.fechaEvento)}`) : ''}
      </div>
      ${r.notas ? `<p class="mt-3 mb-1 small text-muted">Comentarios del cliente</p><p class="fst-italic mb-0">“${ED.esc(r.notas)}”</p>` : ''}
      <p class="mt-3 mb-1 small text-muted">Archivos del cliente</p>
      ${r.archivos && r.archivos.length
        ? `<ul class="list-inline mb-0">${r.archivos.map((a) => `<li class="list-inline-item"><i class="bi bi-paperclip" aria-hidden="true"></i> ${ED.esc(a)}</li>`).join('')}</ul>`
        : '<p class="mb-0">Sin archivos adjuntos.</p>'}`;
  },

  /* Grupo de botones de estado (radios accesibles) */
  estadoPicker(name, actual, ids) {
    const lista = ids || ['recibida', ...ED.ESTADOS.map((e) => e.id)];
    return `<div class="btn-group-wrap" role="radiogroup" aria-label="Cambiar estado">${lista.map((id) => `
      <input type="radio" class="btn-check" name="${name}" id="${name}-${id}" value="${id}" ${id === actual ? 'checked' : ''}>
      <label class="btn btn-outline-primary btn-sm" for="${name}-${id}">${ED.esc(ED.estadoLabel(id))}</label>`).join('')}</div>`;
  },

  placeholder(obra, claseExtra = '') {
    if (obra.img) {
      return `<img src="${ED.esc(obra.img)}" class="work-img-photo ${claseExtra}"
        alt="${ED.esc(obra.titulo)} (${ED.esc(obra.categoria)})" loading="lazy">`;
    }
    return `<div class="work-img cat-${ED.esc(obra.categoria)} ${claseExtra}" role="img"
      aria-label="Imagen de ejemplo: ${ED.esc(obra.titulo)} (${ED.esc(obra.categoria)})">
      <span class="work-img-cat">${ED.esc(obra.categoria)}</span><span class="work-img-title">${ED.esc(obra.titulo)}</span></div>`;
  }
};

/* ---------- Arranque ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page || '';
  const layout = document.body.dataset.layout || 'public';
  renderHeader(page, layout);
  renderFooter(layout);
  const on = (id, fn) => { const b = document.getElementById(id); if (b) b.addEventListener('click', fn); };
  on('btn-mas', () => Prefs.bigger());
  on('btn-menos', () => Prefs.smaller());
  on('btn-normal', () => Prefs.reset());
  on('btn-contraste', () => Prefs.toggleContrast());
  on('btn-idioma', () => Prefs.toggleLang());
  Prefs.init();
});
