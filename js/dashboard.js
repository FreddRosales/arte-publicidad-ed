'use strict';

const Dashboard = (() => {
  const charts = {};
  let claveTema = '';

  const PALETAS = {
    normal: ['#1E6FB5', '#E69F00', '#009E73', '#CC79A7', '#56B4E9', '#D55E00', '#7A7A7A'],
    rv: ['#00507D', '#E69F00', '#56B4E9', '#7A7A7A', '#CC79A7', '#B34700', '#000000'],
    az: ['#A4123F', '#00696B', '#C9A227', '#5C0A24', '#009E9E', '#7A5C00', '#333333'],
    mono: ['#000000', '#8C8C8C', '#4A4A4A', '#BDBDBD', '#2B2B2B', '#6E6E6E', '#D9D9D9'],
    hc: ['#FFE600', '#7CC4FF', '#FF9E9A', '#7CFFB2', '#FFFFFF', '#FFB86B', '#D9A8FF']
  };
  const tema = () => {
    const c = document.body.classList;
    const hc = c.contains('alto-contraste');
    const clave = hc ? 'hc' : c.contains('dalt-mono') ? 'mono' : c.contains('dalt-az') ? 'az' : c.contains('dalt-rv') ? 'rv' : 'normal';
    return { clave, p: PALETAS[clave], texto: hc ? '#FFFFFF' : '#1F2933', grid: hc ? 'rgba(255,255,255,.35)' : '#D9E2EC', borde: hc ? '#000000' : '#FFFFFF' };
  };

  const animacion = () => (ED.anim && ED.anim.activo() ? { duration: 900, easing: 'easeOutQuart' } : false);
  const fmtSeg = (s) => { const n = Math.round(s); return n >= 60 ? `${Math.floor(n / 60)} min ${String(n % 60).padStart(2, '0')} s` : `${n} s`; };
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  const grafico = (id, alt) => `
    <div class="chart-box"><canvas id="ch-${id}" role="img" aria-label="${ED.esc(alt)}"></canvas></div>
    <details class="tabla-datos mt-2"><summary>Ver los datos en tabla</summary><div id="tb-${id}"></div></details>`;
  const caja = (id, titulo, desc) => `
    <section class="panel-card h-100" aria-labelledby="h-${id}">
      <h2 class="h6 mb-1" id="h-${id}">${ED.esc(titulo)}</h2>
      <p class="small text-muted mb-2">${ED.esc(desc)}</p>
      ${grafico(id, `${titulo}. ${desc} Los datos están en la tabla debajo del gráfico.`)}
    </section>`;

  const tabla = (id, cab, filas, titulo) => {
    const el = document.getElementById(`tb-${id}`);
    if (!el) return;
    el.innerHTML = `<div class="table-responsive"><table class="table table-sm mb-0">
      <caption class="visually-hidden">${ED.esc(titulo)}</caption>
      <thead><tr>${cab.map((c) => `<th scope="col">${ED.esc(c)}</th>`).join('')}</tr></thead>
      <tbody>${filas.map((f) => `<tr>${f.map((c, i) => (i === 0 ? `<th scope="row" class="fw-normal">${ED.esc(c)}</th>` : `<td>${ED.esc(c)}</td>`)).join('')}</tr>`).join('')}</tbody></table></div>`;
  };

  const etiquetas = {
    id: 'etiquetas',
    afterDatasetsDraw(chart, _args, opts) {
      if (!opts || !opts.activo) return;
      const { ctx } = chart;
      ctx.save();
      ctx.font = '600 12px "Open Sans", sans-serif';
      ctx.fillStyle = opts.color;
      const horizontal = chart.options.indexAxis === 'y';
      chart.data.datasets.forEach((ds, di) => {
        const meta = chart.getDatasetMeta(di);
        if (meta.hidden) return;
        meta.data.forEach((barra, i) => {
          const v = ds.data[i];
          if (v === null || v === undefined || (v === 0 && !opts.ceros)) return;
          const txt = opts.formato ? opts.formato(v, i) : String(v);
          if (horizontal) { ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(txt, barra.x + 6, barra.y); }
          else { ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(txt, barra.x, barra.y - 4); }
        });
      });
      ctx.restore();
    }
  };

  function dibujar(id, config) {
    const el = document.getElementById(`ch-${id}`);
    if (!el) return null;
    if (typeof Chart === 'undefined') {
      const box = el.closest('.chart-box');
      if (box) box.innerHTML = '<p class="text-muted small mb-0">No se pudo cargar la librería de gráficos. Los datos están en la tabla de abajo.</p>';
      const det = document.getElementById(`tb-${id}`);
      if (det && det.closest('details')) det.closest('details').open = true;
      return null;
    }
    if (charts[id]) charts[id].destroy();
    charts[id] = new Chart(el, config);
    return charts[id];
  }
  const vacio = (id, msg) => {
    const el = document.getElementById(`ch-${id}`);
    const box = el && el.closest('.chart-box');
    if (box) box.innerHTML = `<p class="text-muted small mb-0 pt-4 text-center">${ED.esc(msg)}</p>`;
  };

  const base = (t) => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: animacion(),
    color: t.texto,
    plugins: {
      legend: { labels: { color: t.texto, usePointStyle: true, boxWidth: 10 } },
      tooltip: { padding: 10, titleFont: { weight: '600' } }
    }
  });
  const ejes = (t, { horizontal = false, max = null, precision = 0 } = {}) => {
    const val = { beginAtZero: true, ticks: { color: t.texto, precision }, grid: { color: t.grid }, border: { color: t.grid } };
    if (max) val.max = max; else val.grace = '14%';
    const cat = { ticks: { color: t.texto, autoSkip: true, maxRotation: 0 }, grid: { display: false }, border: { color: t.grid } };
    return horizontal ? { x: val, y: cat } : { x: cat, y: val };
  };

  function barras(id, { labels, data, nombre, horizontal = true, max = null, formato = null, color = 0, precision = 0, etiquetasOn = true }) {
    const t = tema();
    const o = base(t);
    o.indexAxis = horizontal ? 'y' : 'x';
    o.scales = ejes(t, { horizontal, max, precision });
    o.plugins.legend = { display: false };
    o.plugins.etiquetas = { activo: etiquetasOn, color: t.texto, formato };
    return dibujar(id, {
      type: 'bar',
      data: { labels, datasets: [{ label: nombre, data, backgroundColor: t.p[color], borderRadius: 5, maxBarThickness: horizontal ? 30 : 38 }] },
      options: o,
      plugins: [etiquetas]
    });
  }

  function dona(id, pares, nombre) {
    const t = tema();
    const total = pares.reduce((a, p) => a + p[1], 0) || 1;
    const o = base(t);
    o.cutout = '58%';
    o.plugins.legend = {
      position: 'bottom',
      labels: {
        color: t.texto, usePointStyle: true, boxWidth: 10,
        generateLabels: (chart) => chart.data.labels.map((l, i) => ({
          text: `${l}: ${chart.data.datasets[0].data[i]} (${Math.round((chart.data.datasets[0].data[i] / total) * 100)} %)`,
          fillStyle: chart.data.datasets[0].backgroundColor[i],
          strokeStyle: chart.data.datasets[0].backgroundColor[i],
          fontColor: t.texto, pointStyle: 'circle', index: i, hidden: !chart.getDataVisibility(i)
        }))
      }
    };
    return dibujar(id, {
      type: 'doughnut',
      data: { labels: pares.map((p) => p[0]), datasets: [{ label: nombre, data: pares.map((p) => p[1]), backgroundColor: pares.map((_, i) => t.p[i % t.p.length]), borderColor: t.borde, borderWidth: 2 }] },
      options: o
    });
  }

  function negocio() {
    if (!document.getElementById('ch-estado')) return;
    const todas = ED.getRequests();

    const estados = [ED.RECIBIDA, ...ED.ESTADOS];
    const conteos = estados.map((e) => todas.filter((r) => r.estado === e.id).length);
    barras('estado', { labels: estados.map((e) => e.label), data: conteos, nombre: 'Pedidos', formato: (v) => `${v} de ${todas.length}` });
    tabla('estado', ['Estado', 'Pedidos'], estados.map((e, i) => [e.label, conteos[i]]), 'Pedidos por estado');

    const porServ = {};
    todas.forEach((r) => { porServ[r.servicio] = (porServ[r.servicio] || 0) + 1; });
    let pares = Object.entries(porServ).sort((a, b) => b[1] - a[1]);
    if (pares.length > 6) {
      const resto = pares.slice(5).reduce((a, p) => a + p[1], 0);
      pares = pares.slice(0, 5).concat([['Otros', resto]]);
    }
    if (pares.length) dona('servicio', pares, 'Solicitudes'); else vacio('servicio', 'Aún no hay solicitudes.');
    tabla('servicio', ['Servicio', 'Solicitudes'], pares, 'Solicitudes por servicio');

    const fechas = []; const etiq = [];
    for (let i = 13; i >= 0; i--) { const f = ED.addDays(-i); fechas.push(f); etiq.push(`${f.slice(8)}/${f.slice(5, 7)}`); }
    const porDia = fechas.map((f) => todas.filter((r) => r.recibida === f).length);
    barras('tiempo-sol', { labels: etiq, data: porDia, nombre: 'Solicitudes', horizontal: false, color: 1, formato: (v) => String(v) });
    tabla('tiempo-sol', ['Día', 'Solicitudes'], etiq.map((e, i) => [e, porDia[i]]), 'Solicitudes recibidas por día');
  }

  function opiniones() {
    const ops = ED.getOpiniones();
    if (!ops.length || !document.getElementById('ch-opi')) return;
    const cortos = { facil: 'Encontré lo que buscaba', claro: 'Información clara', cotizar: 'Cotizar fue sencillo', diseno: 'Diseño agradable', acces: 'Accesibilidad útil', global: 'Satisfacción general' };
    const proms = ED.LIKERT_ITEMS.map((it) => {
      const v = ops.map((o) => Number(o.respuestas[it.id])).filter((x) => x >= 1 && x <= 5);
      return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : 0;
    });
    barras('opi', { labels: ED.LIKERT_ITEMS.map((it) => cortos[it.id] || it.texto), data: proms, nombre: 'Promedio', max: 5, formato: (v) => `${v.toFixed(1)} / 5`, color: 2, precision: 1 });
    tabla('opi', ['Afirmación', 'Promedio (de 1 a 5)'], ED.LIKERT_ITEMS.map((it, i) => [it.texto, proms[i].toFixed(1)]), 'Promedio de cada afirmación');
  }

  const est = { dias: 14, demo: true };

  const kpiAn = (titulo, count, { dec = 0, formato = '', suffix = '', delta = null }) => {
    const d = delta === null || delta === undefined
      ? 'sin periodo anterior para comparar'
      : delta === 0 ? 'igual que el periodo anterior' : `${delta > 0 ? `▲ ${delta} % más` : `▼ ${Math.abs(delta)} % menos`} que el periodo anterior`;
    const attrs = `data-count="${count}"${dec ? ` data-dec="${dec}"` : ''}${formato ? ` data-formato="${formato}"` : ''}${suffix ? ` data-suffix="${suffix}"` : ''}`;
    return `<div class="col-6 col-md-4 col-xl-2"><div class="kpi"><div class="kpi-num kpi-num-sm" ${attrs}>${count}</div><div>${titulo}</div><div class="kpi-delta">${d}</div></div></div>`;
  };

  function lectura(r) {
    const a = r.actual;
    const frases = [];
    const mejor = [...r.serie].sort((x, y) => y.vistas - x.vistas)[0];
    if (mejor && mejor.vistas > 0) {
      const f = new Date(`${mejor.fecha}T00:00:00`);
      frases.push(`El día con más visitas fue el ${DIAS[f.getDay()]} ${mejor.etiqueta}, con ${mejor.vistas} páginas vistas.`);
    }
    if (r.dispositivos.length) {
      const [nom, n] = r.dispositivos[0];
      const p = Math.round((n / a.sesiones) * 100);
      frases.push(`El ${p} % de las sesiones se hace desde ${nom === 'Móvil' ? 'el celular' : nom === 'Tableta' ? 'una tableta' : 'una computadora'}.${nom === 'Móvil' ? ' Conviene seguir revisando que el calendario y el formulario se vean bien en pantallas pequeñas.' : ''}`);
    }
    if (r.origenes.length) {
      const [nom, n] = r.origenes[0];
      frases.push(`${nom} es el origen que más sesiones trae (${Math.round((n / a.sesiones) * 100)} %).`);
    }
    const e = r.embudo;
    if (e[0][1] > 0) {
      let peor = 0; let caida = -1;
      for (let i = 1; i < e.length; i++) {
        const c = e[i - 1][1] > 0 ? 1 - e[i][1] / e[i - 1][1] : 0;
        if (c > caida) { caida = c; peor = i; }
      }
      const de100 = (v) => Math.round((v / e[0][1]) * 100);
      frases.push(`De cada 100 sesiones, ${de100(e[1][1])} ven el catálogo, ${de100(e[2][1])} abren el formulario y ${de100(e[4][1])} envían una solicitud. La mayor pérdida ocurre entre «${e[peor - 1][0].toLowerCase()}» y «${e[peor][0].toLowerCase()}».`);
    }
    const hmax = r.horas.indexOf(Math.max(...r.horas));
    if (a.vistas > 0) frases.push(`La hora con más visitas es entre las ${hmax}:00 y las ${hmax + 1}:00.`);
    const conWa = a.lista.filter((s) => s.wa).length;
    if (conWa > 0 && a.sesiones > 0) frases.push(`${conWa} sesiones (${Math.round((conWa / a.sesiones) * 100)} %) terminaron con un toque en un botón de WhatsApp.`);
    if (r.obras.length) frases.push(`El trabajo más consultado en el catálogo es «${r.obras[0][0]}» (${r.obras[0][1]} aperturas).`);
    return frases;
  }

  function analitica() {
    const kp = document.getElementById('an-kpis');
    const root = document.getElementById('an-graficos');
    if (!kp || !root) return;
    const t = tema();
    const r = ED.analitica.resumen(est);
    const a = r.actual;

    document.getElementById('an-vacio').hidden = r.hayDatos;
    document.getElementById('an-estado').textContent =
      `Eventos reales registrados en este navegador: ${ED.analitica.contarReales()}. ${est.demo ? 'Se muestran junto con datos de muestra simulados.' : 'Se muestran solo los datos reales.'}`;

    if (!r.hayDatos) { kp.innerHTML = ''; root.innerHTML = ''; return; }

    kp.innerHTML =
      kpiAn('Páginas vistas', a.vistas, { delta: r.delta.vistas }) +
      kpiAn('Sesiones (visitas)', a.sesiones, { delta: r.delta.sesiones }) +
      kpiAn('Páginas por sesión', Math.round(a.pps * 10) / 10, { dec: 1, delta: r.delta.pps }) +
      kpiAn('Tiempo medio por sesión', Math.round(a.segMedio), { formato: 'tiempo', delta: r.delta.seg }) +
      kpiAn('Sesiones que envían una solicitud', Math.round(a.conv * 10) / 10, { dec: 1, suffix: ' %', delta: r.delta.conv }) +
      kpiAn('Clics en WhatsApp', a.wa, { delta: r.delta.wa });

    root.innerHTML = `
      <div class="row g-3 mb-3">
        <div class="col-lg-8">${caja('visitas', 'Visitas por día', 'Páginas vistas y sesiones en cada día del periodo.')}</div>
        <div class="col-lg-4">${caja('disp', 'Dispositivos', 'Desde qué tipo de pantalla entran las personas.')}</div>
      </div>
      <div class="row g-3 mb-3">
        <div class="col-lg-6">${caja('embudo', 'Camino hacia la cotización', 'Cuántas sesiones llegan a cada etapa.')}</div>
        <div class="col-lg-6">${caja('origen', 'Origen del tráfico', 'De dónde llegan las sesiones.')}</div>
      </div>
      <div class="row g-3 mb-3">
        <div class="col-lg-6">${caja('paginas', 'Páginas más vistas', 'Las tablas incluyen el tiempo medio en cada página.')}</div>
        <div class="col-lg-6">${caja('horas', 'Visitas por hora del día', 'A qué horas hay más movimiento en el sitio.')}</div>
      </div>
      <div class="row g-3">
        <div class="col-lg-6">${caja('obras', 'Trabajos más consultados', 'Los que más se abren con «Ver detalle» en el catálogo.')}</div>
        <div class="col-lg-6"><section class="panel-card h-100" aria-labelledby="h-lectura"><h2 class="h6 mb-2" id="h-lectura">Lectura del análisis</h2><ul class="lectura mb-0" id="an-lectura"></ul></section></div>
      </div>`;

    {
      const o = base(t);
      o.interaction = { mode: 'index', intersect: false };
      o.scales = ejes(t);
      o.scales.x.ticks.maxTicksLimit = 10;
      dibujar('visitas', {
        type: 'line',
        data: {
          labels: r.serie.map((d) => d.etiqueta),
          datasets: [
            { label: 'Páginas vistas', data: r.serie.map((d) => d.vistas), borderColor: t.p[0], backgroundColor: `${t.p[0]}26`, fill: true, tension: 0.3, pointRadius: 3, pointStyle: 'circle', borderWidth: 2.5 },
            { label: 'Sesiones', data: r.serie.map((d) => d.sesiones), borderColor: t.p[1], backgroundColor: t.p[1], borderDash: [7, 5], tension: 0.3, pointRadius: 3, pointStyle: 'rectRot', borderWidth: 2.5 }
          ]
        },
        options: o
      });
      tabla('visitas', ['Día', 'Páginas vistas', 'Sesiones'], r.serie.map((d) => [d.fecha, d.vistas, d.sesiones]), 'Visitas por día');
    }
    dona('disp', r.dispositivos, 'Sesiones');
    tabla('disp', ['Dispositivo', 'Sesiones'], r.dispositivos, 'Sesiones por dispositivo');
    {
      const total = r.embudo[0][1] || 1;
      barras('embudo', { labels: r.embudo.map((e) => e[0]), data: r.embudo.map((e) => e[1]), nombre: 'Sesiones', formato: (v) => `${v} (${Math.round((v / total) * 100)} %)`, color: 0 });
      tabla('embudo', ['Etapa', 'Sesiones', '% del total'], r.embudo.map((e) => [e[0], e[1], `${Math.round((e[1] / total) * 100)} %`]), 'Etapas del camino hacia la cotización');
    }
    barras('origen', { labels: r.origenes.map((e) => e[0]), data: r.origenes.map((e) => e[1]), nombre: 'Sesiones', color: 2, formato: (v) => String(v) });
    tabla('origen', ['Origen', 'Sesiones'], r.origenes, 'Sesiones por origen');
    barras('paginas', { labels: r.paginas.map((p) => p.nombre), data: r.paginas.map((p) => p.vistas), nombre: 'Páginas vistas', color: 3, formato: (v) => String(v) });
    tabla('paginas', ['Página', 'Vistas', 'Tiempo medio'], r.paginas.map((p) => [p.nombre, p.vistas, fmtSeg(p.seg)]), 'Páginas más vistas y tiempo medio');
    {
      const horas = r.horas.map((_, h) => `${h} h`);
      barras('horas', { labels: horas, data: r.horas, nombre: 'Páginas vistas', horizontal: false, color: 4, etiquetasOn: false });
      tabla('horas', ['Hora', 'Páginas vistas'], horas.map((h, i) => [h, r.horas[i]]), 'Páginas vistas por hora del día');
    }
    if (r.obras.length) {
      barras('obras', { labels: r.obras.map((o) => o[0]), data: r.obras.map((o) => o[1]), nombre: 'Aperturas', color: 5, formato: (v) => String(v) });
      tabla('obras', ['Trabajo', 'Aperturas'], r.obras, 'Trabajos más consultados');
    } else {
      vacio('obras', 'Todavía nadie abrió un trabajo del catálogo en este periodo.');
    }

    document.getElementById('an-lectura').innerHTML = lectura(r).map((f) => `<li>${ED.esc(f)}</li>`).join('');
    ED.anim.contarTodos(kp);
  }

  function activa() {
    const b = document.querySelector('#pestanas .nav-link.active');
    return b ? b.dataset.bsTarget : '#tab-resumen';
  }
  function pintarActiva() {
    const d = activa();
    if (d === '#tab-resumen') negocio();
    if (d === '#tab-analitica') analitica();
    if (d === '#tab-opiniones') opiniones();
  }

  function iniciar() {
    if (typeof Chart !== 'undefined') {
      Chart.defaults.font.family = "'Open Sans', system-ui, sans-serif";
      Chart.defaults.font.size = 12;
    }
    claveTema = tema().clave;

    document.querySelectorAll('#pestanas [data-bs-toggle="pill"]').forEach((b) => b.addEventListener('shown.bs.tab', (e) => {
      const d = e.target.dataset.bsTarget;
      if (d === '#tab-resumen') { negocio(); ED.anim.contarTodos(document.getElementById('kpis')); }
      if (d === '#tab-analitica') analitica();
      if (d === '#tab-opiniones') { opiniones(); ED.anim.contarTodos(document.getElementById('opi-kpis')); }
    }));

    document.querySelectorAll('input[name="an-rango"]').forEach((r) => {
      r.checked = Number(r.value) === est.dias;
      r.addEventListener('change', () => { est.dias = Number(r.value); analitica(); });
    });
    const demo = document.getElementById('an-demo');
    if (demo) { demo.checked = est.demo; demo.addEventListener('change', () => { est.demo = demo.checked; analitica(); }); }

    const csv = document.getElementById('an-csv');
    if (csv) csv.addEventListener('click', () => {
      const blob = new Blob([ED.analitica.csv(ED.analitica.resumen(est))], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `analitica-${ED.iso(new Date())}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    const borrar = document.getElementById('an-borrar');
    if (borrar) borrar.addEventListener('click', () => {
      if (confirm('¿Borrar los eventos reales registrados en este navegador? Los datos de muestra no se borran.')) {
        ED.analitica.limpiar(); analitica(); toast('Se borraron los eventos reales registrados.');
      }
    });

    new MutationObserver(() => {
      const nueva = tema().clave;
      if (nueva !== claveTema) { claveTema = nueva; pintarActiva(); }
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  return { grafico, caja, negocio, opiniones, analitica, iniciar };
})();
