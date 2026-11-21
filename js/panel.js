/* panel.js — Panel administrativo: dashboard, solicitudes, clientes y catálogo
   HU10 a HU14 · RN03, RN08, RN09, RN10 (orden de llegada, FIFO) */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const user = ED.requireRole('admin');
  if (!user) return;
  document.getElementById('saludo').textContent = `Hola, ${user.nombre}`;

  let seleccionSol = null;
  let seleccionCli = null;

  const ordenLlegada = () => [...ED.getRequests()].sort((a, b) => a.recibida.localeCompare(b.recibida) || a.id.localeCompare(b.id));
  const itemSol = (r, extra = '') => `
    <li><button type="button" class="req-item" data-id="${r.id}" ${seleccionSol === r.id ? 'aria-current="true"' : ''}>
      <span><strong>${ED.esc(r.id)}</strong> · ${ED.esc(r.cliente)}<br><small>${ED.esc(r.servicio)} · ${ED.fmtDate(r.recibida)}${extra}</small></span>
      ${ED.ui.badge(r.estado)}</button></li>`;

  /* ---------- Resumen (dashboard) ---------- */
  function pintarResumen() {
    const todas = ED.getRequests();
    const cuenta = (...ids) => todas.filter((r) => ids.includes(r.estado)).length;
    const kpi = (n, t) => `<div class="col-6 col-lg-3"><div class="kpi"><div class="kpi-num">${String(n).padStart(2, '0')}</div><div>${t}</div></div></div>`;
    document.getElementById('kpis').innerHTML =
      kpi(cuenta('recibida'), 'Recibidas') + kpi(cuenta('cotizado'), 'Cotizadas') +
      kpi(cuenta('diseno', 'produccion'), 'En diseño o producción') + kpi(cuenta('entregado'), 'Entregadas');

    const total = todas.length || 1;
    document.getElementById('barras').innerHTML = [ED.RECIBIDA, ...ED.ESTADOS].map((e) => {
      const n = cuenta(e.id);
      const pct = Math.round((n / total) * 100);
      return `<div class="mb-3"><div class="d-flex justify-content-between small mb-1"><span>${e.label}</span><span><strong>${n}</strong> de ${todas.length}</span></div>
        <div class="progress" role="progressbar" aria-label="${e.label}" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><div class="progress-bar" style="width:${pct}%"></div></div></div>`;
    }).join('');

    const pend = ordenLlegada().filter((r) => ['recibida', 'cotizado'].includes(r.estado)).slice(0, 5);
    document.getElementById('pendientes').innerHTML = pend.length
      ? pend.map((r) => `<li class="req-item"><span><strong>${ED.esc(r.id)}</strong> · ${ED.esc(r.cliente)}<br><small>${ED.esc(r.servicio)} · ${ED.fmtDate(r.recibida)}</small></span>${ED.ui.badge(r.estado)}</li>`).join('')
      : '<li class="text-muted">No hay solicitudes pendientes. ¡Buen trabajo!</li>';
  }

  /* ---------- Solicitudes ---------- */
  function pintarSolicitudes() {
    const q = document.getElementById('buscar-sol').value.trim().toLowerCase();
    const lista = ordenLlegada().filter((r) => !q || `${r.id} ${r.cliente} ${r.servicio}`.toLowerCase().includes(q));
    document.getElementById('lista-sol').innerHTML = lista.length ? lista.map((r) => itemSol(r)).join('') : '<li class="text-muted">Sin resultados.</li>';
    pintarFicha();
  }

  function pintarFicha() {
    const box = document.getElementById('ficha-sol');
    const r = ED.getRequests().find((x) => x.id === seleccionSol);
    if (!r) { box.innerHTML = '<p class="text-muted mb-0">Elige una solicitud de la lista.</p>'; return; }
    const tel = r.contacto.replace(/\D/g, '');
    const waOk = /^9\d{8}$/.test(tel);
    box.innerHTML = `${ED.ui.ficha(r)}
      <hr><p class="fw-semibold mb-2" id="lbl-cambiar">Cambiar estado</p>
      <div aria-labelledby="lbl-cambiar">${ED.ui.estadoPicker('est-sol', r.estado)}</div>
      <div class="d-flex flex-wrap gap-2 mt-3">
        <button class="btn btn-primary" type="button" id="guardar-sol"><i class="bi bi-check2" aria-hidden="true"></i> Guardar estado</button>
        ${waOk ? `<a class="btn btn-whatsapp" id="avisar" target="_blank" rel="noopener" href="#"><i class="bi bi-whatsapp" aria-hidden="true"></i> Avisar al cliente</a>`
               : '<span class="small text-muted align-self-center">Contacto por correo: avisar por ese medio.</span>'}
      </div>`;
    document.getElementById('guardar-sol').addEventListener('click', () => {
      const nuevo = box.querySelector('input[name="est-sol"]:checked').value;
      const todas = ED.getRequests();
      const x = todas.find((y) => y.id === r.id);
      x.estado = nuevo;
      if (nuevo === 'diseno' && !x.asignado) x.asignado = 'Diego'; // asignación por defecto del prototipo
      ED.saveRequests(todas);
      toast(`${r.id}: estado cambiado a “${ED.estadoLabel(nuevo)}”.`);
      refrescar();
    });
    const av = document.getElementById('avisar');
    if (av) av.href = `https://wa.me/51${tel}?text=${encodeURIComponent(`Hola ${r.cliente}, te escribimos de Arte y Publicidad E&D sobre tu solicitud ${r.id}: estado actual “${ED.estadoLabel(r.estado)}”.`)}`;
  }

  document.getElementById('lista-sol').addEventListener('click', (e) => {
    const b = e.target.closest('[data-id]'); if (!b) return;
    seleccionSol = b.dataset.id; pintarSolicitudes();
  });
  document.getElementById('buscar-sol').addEventListener('input', pintarSolicitudes);

  /* ---------- Clientes ---------- */
  function pintarClientes() {
    const q = document.getElementById('buscar-cli').value.trim().toLowerCase();
    const lista = ED.getClients().filter((c) => !q || `${c.nombre} ${c.contacto}`.toLowerCase().includes(q));
    document.getElementById('lista-cli').innerHTML = lista.length ? lista.map((c) => `
      <li><button type="button" class="req-item" data-cli="${ED.esc(c.nombre)}" ${seleccionCli === c.nombre ? 'aria-current="true"' : ''}>
        <span><strong>${ED.esc(c.nombre)}</strong><br><small>${ED.esc(c.contacto)}</small></span>
        <span class="badge text-bg-light border">${c.pedidos.length} pedido${c.pedidos.length === 1 ? '' : 's'}</span></button></li>`).join('')
      : '<li class="text-muted">Sin resultados.</li>';
    const c = ED.getClients().find((x) => x.nombre === seleccionCli);
    const h = document.getElementById('historial');
    if (!c) { h.innerHTML = '<p class="text-muted mb-0">Elige un cliente.</p>'; return; }
    const tel = c.contacto.replace(/\D/g, '');
    h.innerHTML = `<h3 class="h5">${ED.esc(c.nombre)}</h3><p class="text-muted">${ED.esc(c.contacto)}</p>
      <ul class="list-req">${[...c.pedidos].reverse().map((r) => `<li class="req-item"><span><strong>${ED.esc(r.id)}</strong><br><small>${ED.esc(r.servicio)}</small></span>${ED.ui.badge(r.estado)}</li>`).join('')}</ul>
      ${/^9\d{8}$/.test(tel) ? `<a class="btn btn-whatsapp w-100 mt-3" target="_blank" rel="noopener" href="https://wa.me/51${tel}"><i class="bi bi-whatsapp" aria-hidden="true"></i> Escribir por WhatsApp</a>` : ''}`;
  }
  document.getElementById('lista-cli').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cli]'); if (!b) return;
    seleccionCli = b.dataset.cli; pintarClientes();
  });
  document.getElementById('buscar-cli').addEventListener('input', pintarClientes);

  /* ---------- Catálogo (RN03: solo el administrador) ---------- */
   function pintarCatalogo() {
    const obras = ED.getCatalog();
    document.getElementById('lista-cat').innerHTML = obras.map((o) => `
      <li class="req-item"><span class="d-flex align-items-center gap-2">
        ${o.img ? `<img src="${ED.esc(o.img)}" alt="" width="48" height="48" style="object-fit:cover;border-radius:6px">` : ''}
        <span><strong>${ED.esc(o.titulo)}</strong><br><small>${ED.esc(o.categoria)} · ${ED.esc(o.material)}</small></span></span>
        <button type="button" class="btn btn-outline-primary btn-sm" data-del="${o.id}" aria-label="Eliminar ${ED.esc(o.titulo)}"><i class="bi bi-trash" aria-hidden="true"></i></button></li>`).join('');
  }
  document.getElementById('lista-cat').addEventListener('click', (e) => {
    const b = e.target.closest('[data-del]'); if (!b) return;
    const o = ED.getCatalog().find((x) => x.id === Number(b.dataset.del));
    if (o && confirm(`¿Eliminar “${o.titulo}” del catálogo?`)) {
      ED.saveCatalog(ED.getCatalog().filter((x) => x.id !== o.id));
      pintarCatalogo(); toast('Trabajo eliminado del catálogo.');
    }
  });
  document.getElementById('form-obra').addEventListener('submit', (e) => {
    e.preventDefault();
    const t = document.getElementById('o-titulo');
    if (!t.value.trim()) { t.classList.add('is-invalid'); t.focus(); return; }
    t.classList.remove('is-invalid');
    const obras = ED.getCatalog();
    obras.unshift({ id: obras.reduce((m, o) => Math.max(m, o.id), 0) + 1, titulo: t.value.trim(), categoria: document.getElementById('o-cat').value, material: document.getElementById('o-mat').value, descripcion: document.getElementById('o-desc').value.trim() });
    ED.saveCatalog(obras);
    e.target.reset(); pintarCatalogo(); toast('Trabajo publicado en el catálogo.');
  });
    /* ---------- Foto del trabajo: se reduce y se guarda como texto (base64) ---------- */
  function reducirImagen(file, maxW = 900) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('El archivo no es una imagen válida.'));
        img.onload = () => {
          const k = Math.min(1, maxW / img.width);
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * k);
          c.height = Math.round(img.height * k);
          const ctx = c.getContext('2d');
          ctx.fillStyle = '#fff';            // fondo blanco para PNG con transparencia
          ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.8));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  const inputImg = document.getElementById('o-img');
  const prevImg = document.getElementById('o-img-prev');
  inputImg.addEventListener('change', async () => {
    const f = inputImg.files[0];
    if (!f) { prevImg.classList.add('d-none'); return; }
    if (f.size > 10 * 1024 * 1024) { toast('La foto supera los 10 MB.'); inputImg.value = ''; return; }
    try {
      prevImg.src = await reducirImagen(f);
      prevImg.classList.remove('d-none');
    } catch (err) { toast(err.message); inputImg.value = ''; }
  });

  document.getElementById('form-obra').addEventListener('submit', (e) => {
    e.preventDefault();
    const t = document.getElementById('o-titulo');
    if (!t.value.trim()) { t.classList.add('is-invalid'); t.focus(); return; }
    t.classList.remove('is-invalid');
    const obras = ED.getCatalog();
    const nueva = {
      id: obras.reduce((m, o) => Math.max(m, o.id), 0) + 1,
      titulo: t.value.trim(),
      categoria: document.getElementById('o-cat').value,
      material: document.getElementById('o-mat').value,
      descripcion: document.getElementById('o-desc').value.trim()
    };
    if (!prevImg.classList.contains('d-none') && prevImg.src.startsWith('data:image')) nueva.img = prevImg.src;
    obras.unshift(nueva);
    ED.saveCatalog(obras);
    e.target.reset();
    prevImg.classList.add('d-none'); prevImg.removeAttribute('src');
    pintarCatalogo(); toast('Trabajo publicado en el catálogo.');
  });

  /* ---------- Opiniones (escala Likert) ---------- */
  function pintarOpiniones() {
    const ops = ED.getOpiniones();
    const n = ops.length;
    const promGlobal = n ? ops.reduce((a, o) => a + ED.promedioOpinion(o), 0) / n : 0;
    const conComentario = ops.filter((o) => o.comentario).length;
    const kpi = (num, t) => `<div class="col-6 col-lg-4"><div class="kpi"><div class="kpi-num">${num}</div><div>${t}</div></div></div>`;
    document.getElementById('opi-kpis').innerHTML =
      kpi(String(n).padStart(2, '0'), 'Opiniones recibidas') +
      kpi(n ? promGlobal.toFixed(1) : '—', 'Promedio general (de 5)') +
      kpi(String(conComentario).padStart(2, '0'), 'Con comentarios');

    document.getElementById('opi-promedios').innerHTML = n ? ED.LIKERT_ITEMS.map((it) => {
      const vals = ops.map((o) => Number(o.respuestas[it.id])).filter((v) => v >= 1 && v <= 5);
      const prom = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      const pct = Math.round((prom / 5) * 100);
      return `<div class="mb-3">
        <div class="d-flex justify-content-between gap-2 small mb-1"><span>${ED.esc(it.texto)}</span><span class="text-nowrap"><strong>${prom.toFixed(1)}</strong> / 5</span></div>
        <div class="opi-barra" role="progressbar" aria-label="${ED.esc(it.texto)}" aria-valuenow="${prom.toFixed(1)}" aria-valuemin="1" aria-valuemax="5"><span style="width:${pct}%"></span></div>
      </div>`;
    }).join('') : '<p class="text-muted mb-0">Aún no hay opiniones.</p>';

    const conTexto = [...ops].reverse().filter((o) => o.comentario);
    document.getElementById('opi-comentarios').innerHTML = conTexto.length ? conTexto.map((o) => `
      <li class="opi-item">
        <div class="d-flex justify-content-between align-items-start gap-2 flex-wrap">
          <span><strong>${ED.esc(o.nombre || 'Anónimo')}</strong> · <small class="text-muted">${ED.fmtDate(o.fecha)}</small></span>
          <span><span class="badge text-bg-light border">${ED.esc(o.tipo)}</span> <span class="badge text-bg-light border">${ED.promedioOpinion(o).toFixed(1)} / 5</span></span>
        </div>
        <blockquote>“${ED.esc(o.comentario)}”</blockquote>
      </li>`).join('') : '<li class="text-muted">Todavía no hay comentarios escritos.</li>';
  }

  function refrescar() { pintarResumen(); pintarSolicitudes(); pintarClientes(); pintarCatalogo(); pintarOpiniones(); }
  refrescar();
});
