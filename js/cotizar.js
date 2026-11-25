/* cotizar.js — Formulario de cotización guiado en 4 pasos
   Reglas de negocio aplicadas: RN05 (nombre + medio de contacto), RN01 (24 a 48 h),
   RN02 (precios referenciales), RN13 (todo se puede usar con teclado). */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-cotizar');
  const f = form.elements;
  const secciones = [...form.querySelectorAll('[data-step]')];
  const pasos = [...document.querySelectorAll('#stepper li')];
  const btnAtras = document.getElementById('btn-atras');
  const btnSig = document.getElementById('btn-sig');
  const btnEnviar = document.getElementById('btn-enviar');
  const errores = document.getElementById('errores');
  const KEY_BORRADOR = 'ed_borrador';
  let paso = 1;

  /* ---------- Relleno de listas ---------- */
  ED.SERVICIOS.forEach((s) => f.servicio.add(new Option(s.nombre, s.nombre)));
  ED.TIPOS_EVENTO.forEach((t) => f.tipoEvento.add(new Option(t, t)));
  document.getElementById('materiales').innerHTML = ED.MATERIALES.map((m, i) => `
    <div class="col-md-6"><label class="material-option" for="mat-${i}">
      <input class="form-check-input me-2" type="radio" name="material" id="mat-${i}" value="${ED.esc(m.nombre)}">
      <strong>${ED.esc(m.nombre)}</strong><span class="d-block small text-muted ms-4">${ED.esc(m.ayuda)}</span>
    </label></div>`).join('');
  f.fechaEvento.min = ED.iso(new Date());
  document.getElementById('ayuda-wa').href = ED.waLink('Hola, necesito ayuda para llenar mi cotización.');

  /* ---------- Parámetros de la URL (desde catálogo o calendario) ---------- */
  const params = new URLSearchParams(location.search);
  if (params.get('obra')) f.comentarios.value = `Me interesa algo parecido a: ${params.get('obra')}.`;
  if (params.get('fecha')) {
    f.fechaEvento.value = params.get('fecha');
    const aviso = document.getElementById('aviso-fecha');
    aviso.textContent = `Fecha elegida en el calendario: ${ED.fmtDate(params.get('fecha'))}. Es referencial; la confirmaremos en tu cotización.`;
    aviso.classList.remove('d-none');
  }

  /* ---------- Borrador ---------- */
  const campos = ['nombres', 'apellidos', 'organizacion', 'telefono', 'correo', 'servicio', 'cantidad', 'medidas', 'tipoEvento', 'fechaEvento', 'comentarios'];
  const guardarBorrador = () => {
    const d = {}; campos.forEach((c) => { d[c] = f[c].value; });
    d.material = (form.querySelector('input[name="material"]:checked') || {}).value || '';
    ED.store.set(KEY_BORRADOR, d);
  };
  const borrador = ED.store.get(KEY_BORRADOR, null);
  if (borrador && !params.get('obra') && !params.get('fecha')) {
    campos.forEach((c) => { if (borrador[c] !== undefined) f[c].value = borrador[c]; });
    const r = [...form.querySelectorAll('input[name="material"]')].find((x) => x.value === borrador.material);
    if (r) r.checked = true;
    toast('Recuperamos tu borrador guardado.', 'primary');
  }
  document.getElementById('btn-guardar').addEventListener('click', () => { guardarBorrador(); toast('Borrador guardado en este dispositivo.'); });

  /* ---------- Datos y resumen ---------- */
  const datos = () => ({
    nombre: `${f.nombres.value.trim()} ${f.apellidos.value.trim()}`.trim(),
    organizacion: f.organizacion.value.trim(),
    telefono: f.telefono.value.replace(/\s/g, ''),
    correo: f.correo.value.trim(),
    servicio: f.servicio.value,
    cantidad: f.cantidad.value,
    medidas: f.medidas.value.trim(),
    material: (form.querySelector('input[name="material"]:checked') || {}).value || '',
    archivo: f.archivo.files[0] ? f.archivo.files[0].name : '',
    tipoEvento: f.tipoEvento.value,
    fechaEvento: f.fechaEvento.value,
    comentarios: f.comentarios.value.trim()
  });

  function pintarResumen(el) {
    const d = datos();
    const fila = (k, v) => `<dt>${k}</dt><dd>${ED.esc(v || '—')}</dd>`;
    el.innerHTML = `<dl class="mb-0">
      ${fila('Nombre', d.nombre)}${fila('Organización', d.organizacion)}
      ${fila('Contacto', [d.telefono, d.correo].filter(Boolean).join(' · '))}
      ${fila('Servicio', d.servicio)}${fila('Cantidad y medidas', [d.cantidad, d.medidas].filter(Boolean).join(' · '))}
      ${fila('Material', d.material)}${fila('Archivo', d.archivo)}
      ${fila('Evento', [d.tipoEvento, d.fechaEvento && ED.fmtDate(d.fechaEvento)].filter(Boolean).join(' · '))}
      ${fila('Comentarios', d.comentarios)}</dl>`;
  }
  const refrescarResumen = () => {
    pintarResumen(document.getElementById('resumen-lateral'));
    if (paso === 4) pintarResumen(document.getElementById('resumen-final'));
  };
  form.addEventListener('input', refrescarResumen);
  form.addEventListener('change', refrescarResumen);

  /* ---------- Validación ---------- */
  const marcar = (el, malo, msg) => {
    el.classList.toggle('is-invalid', malo);
    el.classList.toggle('is-valid', !malo && el.value.trim() !== '');
    el.setAttribute('aria-invalid', malo ? 'true' : 'false');
    if (malo && msg) { const fb = document.getElementById(`e-${el.id === 'fechaEvento' ? 'fecha' : el.id}`); if (fb) fb.textContent = msg; }
  };

  function validar(n) {
    const lista = [];
    const falla = (el, msg) => { marcar(el, true, msg); lista.push({ el, msg }); };
    if (n === 1) {
      [['nombres', 'Escribe tus nombres.'], ['apellidos', 'Escribe tus apellidos.']].forEach(([id, m]) => {
        if (!f[id].value.trim()) falla(f[id], m); else marcar(f[id], false);
      });
      const tel = f.telefono.value.replace(/\s/g, '');
      const mail = f.correo.value.trim();
      if (!tel && !mail) {
        falla(f.telefono, 'Escribe un teléfono o un correo (necesitamos al menos uno).');
        falla(f.correo, 'Escribe un correo o un teléfono (necesitamos al menos uno).');
      } else {
        if (tel && !/^9\d{8}$/.test(tel)) falla(f.telefono, 'Ingresa un número de 9 dígitos que empiece con 9.'); else marcar(f.telefono, false);
        if (mail && !f.correo.checkValidity()) falla(f.correo, 'Escribe un correo válido, por ejemplo nombre@correo.com.'); else marcar(f.correo, false);
      }
    }
    if (n === 2) {
      if (!f.servicio.value) falla(f.servicio, 'Elige un tipo de servicio.'); else marcar(f.servicio, false);
      const c = Number(f.cantidad.value);
      if (!Number.isInteger(c) || c < 1) falla(f.cantidad, 'Ingresa una cantidad de 1 o más.'); else marcar(f.cantidad, false);
    }
    if (n === 3) {
      const file = f.archivo.files[0];
      const fb = document.getElementById('e-archivo');
      if (file && !/\.(pdf|png|jpe?g)$/i.test(file.name)) { falla(f.archivo, 'Solo se permiten archivos PDF, PNG o JPG.'); fb.textContent = 'Solo se permiten archivos PDF, PNG o JPG.'; }
      else if (file && file.size > 5 * 1024 * 1024) { falla(f.archivo, 'El archivo supera los 5 MB.'); fb.textContent = 'El archivo supera los 5 MB.'; }
      else marcar(f.archivo, false);
      const fecha = f.fechaEvento.value;
      if (fecha && fecha < ED.iso(new Date())) falla(f.fechaEvento, 'Elige una fecha de hoy en adelante.'); else marcar(f.fechaEvento, false);
    }
    mostrarErrores(lista);
    return lista.length === 0;
  }

  function mostrarErrores(lista) {
    if (!lista.length) { errores.classList.add('d-none'); errores.innerHTML = ''; return; }
    errores.innerHTML = `<p class="fw-bold mb-1">Revisa estos campos:</p><ul class="mb-0">${lista.map((e) => `<li><a class="alert-link" href="#${e.el.id}">${ED.esc(e.msg)}</a></li>`).join('')}</ul>`;
    errores.classList.remove('d-none');
    errores.focus();
    errores.querySelectorAll('a').forEach((a) => a.addEventListener('click', (ev) => { ev.preventDefault(); document.getElementById(a.getAttribute('href').slice(1)).focus(); }));
  }

  /* ---------- Navegación entre pasos ---------- */
  function mostrar(n, mover = true) {
    paso = n;
    secciones.forEach((s) => { s.hidden = Number(s.dataset.step) !== n; });
    pasos.forEach((li, i) => {
      li.classList.toggle('done', i + 1 < n);
      li.classList.toggle('current', i + 1 === n);
      if (i + 1 === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    btnAtras.hidden = n === 1;
    btnSig.hidden = n === 4;
    btnEnviar.hidden = n !== 4;
    if (n === 4) pintarResumen(document.getElementById('resumen-final'));
    mostrarErrores([]);
    if (!mover) return; // carga inicial: no robar el foco ni hacer scroll
    const h = secciones[n - 1].querySelector('h2');
    h.setAttribute('tabindex', '-1'); h.focus();
    h.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  btnSig.addEventListener('click', () => { if (validar(paso)) mostrar(paso + 1); });
  btnAtras.addEventListener('click', () => mostrar(paso - 1));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (paso < 4) { if (validar(paso)) mostrar(paso + 1); return; } // Enter en pasos 1–3 avanza
    if (!(validar(1) && validar(2) && validar(3))) return;
    enviar();
  });

  function enviar() {
    const d = datos();
    const req = {
      id: ED.nextId(),
      cliente: d.organizacion ? `${d.nombre} (${d.organizacion})` : d.nombre,
      contacto: d.telefono || d.correo,
      servicio: d.servicio, medidas: d.medidas, material: d.material,
      cantidad: Number(d.cantidad), estado: 'recibida',
      recibida: ED.iso(new Date()), entrega: '', asignado: '',
      notas: d.comentarios, archivos: d.archivo ? [d.archivo] : [],
      tipoEvento: d.tipoEvento, fechaEvento: d.fechaEvento
    };
    const todas = ED.getRequests(); todas.push(req); ED.saveRequests(todas);
    ED.store.remove(KEY_BORRADOR);
    if (ED.track) ED.track('cot_env', req.servicio);
    document.getElementById('ok-numero').textContent = req.id;
    document.getElementById('ok-estado').href = `seguimiento.html?n=${req.id}`;
    document.getElementById('vista-form').hidden = true;
    const ok = document.getElementById('vista-ok');
    ok.hidden = false; ok.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  mostrar(1, false);
  refrescarResumen();
});
