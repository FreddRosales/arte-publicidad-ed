'use strict';

(() => {
  const KEY = 'ed_analitica_v1';
  const KEY_SESION = 'ed_sesion_v1';
  const MAX_EVENTOS = 4000;
  const DIA = 86400000;

  const PAGINAS = {
    inicio: 'Inicio', catalogo: 'Catálogo', cotizar: 'Cotizar', seguimiento: 'Mi pedido',
    eventos: 'Fechas', nosotros: 'Nosotros', opinion: 'Opinión'
  };

  const pagina = (document.body && document.body.dataset.page) || '';
  const esPublica = () => document.body.dataset.layout !== 'staff' && pagina in PAGINAS;

  const memSesion = {};
  const dispositivo = () => {
    const w = window.innerWidth || 1024;
    return w < 768 ? 'Móvil' : w < 992 ? 'Tableta' : 'Escritorio';
  };
  const clasificarOrigen = (txt) => {
    const t = String(txt || '').toLowerCase();
    if (!t) return 'Directo';
    if (/whatsapp|wa\.me/.test(t)) return 'WhatsApp';
    if (/facebook|fb\.com|fb\./.test(t)) return 'Facebook';
    if (/instagram/.test(t)) return 'Instagram';
    if (/tiktok/.test(t)) return 'TikTok';
    if (/google|bing|duckduckgo|yahoo/.test(t)) return 'Buscador';
    return 'Otros sitios';
  };
  const origenActual = () => {
    const utm = new URLSearchParams(location.search).get('utm_source');
    if (utm) return clasificarOrigen(utm);
    let host = '';
    try { host = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) { host = ''; }
    return host && host === location.hostname ? 'Directo' : clasificarOrigen(host);
  };
  const getSesion = () => {
    let s = null;
    try { s = JSON.parse(sessionStorage.getItem(KEY_SESION)); } catch (e) { s = null; }
    if (!s) s = memSesion.s || null;
    if (!s) {
      s = { sid: `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`, disp: dispositivo(), org: origenActual() };
      memSesion.s = s;
      try { sessionStorage.setItem(KEY_SESION, JSON.stringify(s)); } catch (e) { }
    }
    return s;
  };

  const leer = () => {
    const d = ED.store.get(KEY, null);
    return d && Array.isArray(d.e) ? d : { v: 1, e: [] };
  };
  const registrar = (tipo, extra) => {
    if (!esPublica()) return;
    const s = getSesion();
    const d = leer();
    d.e.push({ t: Date.now(), k: tipo, p: pagina, s: s.sid, d: s.disp, o: s.org, x: extra ? String(extra).slice(0, 80) : '' });
    if (d.e.length > MAX_EVENTOS) d.e.splice(0, d.e.length - MAX_EVENTOS);
    ED.store.set(KEY, d);
  };
  ED.track = registrar;

  if (esPublica()) {
    registrar('vista');

    let t0 = Date.now();
    let enviado = false;
    const cerrar = () => {
      if (enviado) return;
      enviado = true;
      const seg = Math.min(1800, Math.round((Date.now() - t0) / 1000));
      if (seg >= 1) registrar('tiempo', seg);
    };
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') cerrar();
      else { t0 = Date.now(); enviado = false; }
    });
    window.addEventListener('pagehide', cerrar);

    document.addEventListener('click', (e) => {
      const wa = e.target.closest('a[href*="wa.me"]');
      if (wa) registrar('wa', wa.id || 'enlace');
      const ax = e.target.closest('.btn-a11y');
      if (ax) registrar('a11y', ax.id || 'opcion');
    }, true);
    document.addEventListener('change', (e) => {
      if (e.target.id === 'sel-dalt') registrar('a11y', 'daltonismo');
      if (e.target.classList && e.target.classList.contains('filtro')) registrar('filtro', `${e.target.dataset.campo}:${e.target.value}`);
    });
    let iniciada = false;
    document.addEventListener('input', (e) => {
      if (!iniciada && e.target.closest && e.target.closest('#form-cotizar')) { iniciada = true; registrar('cot_ini'); }
    });
  }

  const mulberry32 = (a) => () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const elegir = (rnd, pares) => {
    const total = pares.reduce((a, p) => a + p[1], 0);
    let r = rnd() * total;
    for (const [v, p] of pares) { r -= p; if (r < 0) return v; }
    return pares[pares.length - 1][0];
  };
  const HORAS = [0.2, 0.1, 0.1, 0.1, 0.1, 0.3, 0.8, 1.6, 2.6, 3.6, 4.2, 4.4, 3.8, 3.2, 3.4, 3.6, 3.4, 3.0, 3.2, 4.0, 4.8, 4.6, 3.2, 1.2];
  const inicioDia = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

  function generarDemo(dias) {
    const out = [];
    const hoy = inicioDia(new Date());
    const ahora = new Date();
    let obras = [];
    try { obras = ED.getCatalog().map((o) => o.titulo); } catch (e) { obras = []; }
    if (!obras.length) obras = ['Banner de bienvenida', 'Letrero comercial', 'Estampado de polo'];
    const pesoObra = obras.map((_, i) => [i, 1 / Math.pow(i + 1, 0.8)]);

    for (let i = dias - 1; i >= 0; i--) {
      const dia = new Date(hoy); dia.setDate(hoy.getDate() - i);
      const semilla = dia.getFullYear() * 10000 + (dia.getMonth() + 1) * 100 + dia.getDate();
      const rnd = mulberry32(semilla);
      const base = [20, 32, 36, 35, 39, 44, 29][dia.getDay()];
      const crecimiento = 1 + (dias - 1 - i) * 0.004;
      const n = Math.max(6, Math.round(base * crecimiento * (0.8 + rnd() * 0.4)));
      const pesosHora = HORAS.map((w, h) => [h, i === 0 && h > ahora.getHours() ? 0 : w]);

      for (let k = 0; k < n; k++) {
        const sid = `d${semilla}-${k}`;
        const disp = elegir(rnd, [['Móvil', 0.64], ['Escritorio', 0.28], ['Tableta', 0.08]]);
        const org = elegir(rnd, [['Directo', 0.30], ['WhatsApp', 0.27], ['Facebook', 0.19], ['Instagram', 0.10], ['Buscador', 0.09], ['TikTok', 0.03], ['Otros sitios', 0.02]]);
        const hora = elegir(rnd, pesosHora);
        let t = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), hora, Math.floor(rnd() * 60), Math.floor(rnd() * 60)).getTime();

        const paginas = [];
        const ent = elegir(rnd, [['inicio', 0.66], ['catalogo', org === 'WhatsApp' ? 0.30 : 0.21], ['cotizar', 0.07], ['nosotros', 0.04], ['eventos', 0.02]]);
        paginas.push(ent);
        let vioCat = ent === 'catalogo';
        let vioCot = ent === 'cotizar';
        if (ent === 'inicio' && rnd() < 0.56) { paginas.push('catalogo'); vioCat = true; }
        if (!vioCot && rnd() < (vioCat ? 0.32 : 0.12)) { paginas.push('cotizar'); vioCot = true; }
        if (rnd() < 0.10) paginas.push('eventos');
        if (rnd() < 0.08) paginas.push('nosotros');
        if (rnd() < 0.04) paginas.push('seguimiento');
        if (rnd() < 0.015) paginas.push('opinion');

        const push = (k2, p, x, desfase) => { t += (desfase || 0); out.push({ t, k: k2, p, s: sid, d: disp, o: org, x: x || '', demo: true }); };
        const iniciaCot = vioCot && rnd() < 0.40;
        const enviaCot = iniciaCot && rnd() < 0.50;

        paginas.forEach((p) => {
          push('vista', p, '', 1000);
          if (p === 'catalogo') {
            if (rnd() < 0.35) push('filtro', p, 'categoria:Impresión', 6000);
            if (rnd() < 0.60) {
              const cuantas = 1 + Math.floor(rnd() * 3);
              for (let c = 0; c < cuantas; c++) push('obra', p, obras[elegir(rnd, pesoObra)], 9000);
            }
          }
          if (p === 'cotizar' && iniciaCot) {
            push('cot_ini', p, '', 15000);
            if (enviaCot) push('cot_env', p, '', 70000);
          }
          const seg = p === 'cotizar' ? 60 + Math.floor(rnd() * 180) : 12 + Math.floor(rnd() * 90);
          push('tiempo', p, seg, seg * 1000);
        });
        if (rnd() < 0.13) push('wa', paginas[paginas.length - 1], 'enlace', 1000);
        if (rnd() < 0.05) push('a11y', paginas[0], 'btn-mas', 1000);
      }
    }
    return out;
  }

  const claveDia = (ms) => ED.iso(new Date(ms));

  function calcular(ev) {
    const ses = new Map();
    const r = { vistas: 0, paginas: {}, tiempoPag: {}, horas: new Array(24).fill(0), obras: {}, wa: 0, a11y: 0, porDia: {} };
    for (const e of ev) {
      let s = ses.get(e.s);
      if (!s) { s = { d: e.d, o: e.o, vistas: 0, seg: 0, cat: false, cot: false, ini: false, env: false, wa: false }; ses.set(e.s, s); }
      const dia = claveDia(e.t);
      if (!r.porDia[dia]) r.porDia[dia] = { vistas: 0, sids: new Set(), wa: 0, ini: 0, env: 0 };
      const pd = r.porDia[dia];
      switch (e.k) {
        case 'vista':
          s.vistas++; r.vistas++; pd.vistas++; pd.sids.add(e.s);
          r.paginas[e.p] = (r.paginas[e.p] || 0) + 1;
          r.horas[new Date(e.t).getHours()]++;
          if (e.p === 'catalogo') s.cat = true;
          if (e.p === 'cotizar') s.cot = true;
          break;
        case 'tiempo': {
          const v = Number(e.x) || 0;
          s.seg += v;
          const tp = r.tiempoPag[e.p] || (r.tiempoPag[e.p] = { suma: 0, n: 0 });
          tp.suma += v; tp.n++;
          break;
        }
        case 'obra': r.obras[e.x] = (r.obras[e.x] || 0) + 1; s.cat = true; break;
        case 'cot_ini': s.ini = true; pd.ini++; break;
        case 'cot_env': s.env = true; pd.env++; break;
        case 'wa': s.wa = true; r.wa++; pd.wa++; break;
        case 'a11y': r.a11y++; break;
        default: break;
      }
    }
    const lista = [...ses.values()].filter((s) => s.vistas > 0);
    const n = lista.length;
    const sum = (f) => lista.reduce((a, s) => a + f(s), 0);
    r.sesiones = n;
    r.pps = n ? r.vistas / n : 0;
    r.segMedio = n ? sum((s) => s.seg) / n : 0;
    r.envios = lista.filter((s) => s.env).length;
    r.conv = n ? (r.envios / n) * 100 : 0;
    r.lista = lista;
    return r;
  }

  const contarPor = (lista, campo) => {
    const m = {};
    lista.forEach((s) => { m[s[campo]] = (m[s[campo]] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  };
  const pct = (a, b) => (b > 0 ? Math.round(((a - b) / b) * 100) : null);

  function resumen({ dias = 14, demo = true } = {}) {
    const hoy0 = inicioDia(new Date()).getTime();
    const desde = hoy0 - (dias - 1) * DIA;
    const desdePrev = desde - dias * DIA;
    let ev = leer().e;
    if (demo) ev = generarDemo(dias * 2).concat(ev);
    const actual = calcular(ev.filter((e) => e.t >= desde));
    const previo = calcular(ev.filter((e) => e.t >= desdePrev && e.t < desde));

    const serie = [];
    for (let i = 0; i < dias; i++) {
      const f = new Date(desde + i * DIA);
      const k = ED.iso(f);
      const d = actual.porDia[k] || { vistas: 0, sids: new Set(), wa: 0, ini: 0, env: 0 };
      serie.push({
        fecha: k, etiqueta: `${ED.iso(f).slice(8)}/${ED.iso(f).slice(5, 7)}`,
        vistas: d.vistas, sesiones: d.sids.size, wa: d.wa, ini: d.ini, env: d.env
      });
    }

    const L = actual.lista;
    const embudo = [
      ['Visitaron el sitio', L.length],
      ['Vieron el catálogo', L.filter((s) => s.cat).length],
      ['Abrieron el formulario', L.filter((s) => s.cot).length],
      ['Empezaron a llenarlo', L.filter((s) => s.ini).length],
      ['Enviaron la solicitud', L.filter((s) => s.env).length]
    ];
    const paginas = Object.entries(actual.paginas).map(([p, v]) => {
      const tp = actual.tiempoPag[p];
      return { pag: p, nombre: PAGINAS[p] || p, vistas: v, seg: tp && tp.n ? Math.round(tp.suma / tp.n) : 0 };
    }).sort((a, b) => b.vistas - a.vistas);

    return {
      dias, demo,
      actual, previo,
      delta: {
        vistas: pct(actual.vistas, previo.vistas),
        sesiones: pct(actual.sesiones, previo.sesiones),
        pps: pct(actual.pps, previo.pps),
        seg: pct(actual.segMedio, previo.segMedio),
        conv: pct(actual.conv, previo.conv),
        wa: pct(actual.wa, previo.wa)
      },
      serie,
      dispositivos: contarPor(L, 'd'),
      origenes: contarPor(L, 'o'),
      embudo,
      paginas,
      horas: actual.horas,
      obras: Object.entries(actual.obras).sort((a, b) => b[1] - a[1]).slice(0, 6),
      hayDatos: actual.sesiones > 0
    };
  }

  const contarReales = () => leer().e.length;
  const limpiar = () => ED.store.remove(KEY);

  const csv = (r) => {
    const filas = [['fecha', 'visitas', 'sesiones', 'clics_whatsapp', 'cotizaciones_iniciadas', 'cotizaciones_enviadas']];
    r.serie.forEach((d) => filas.push([d.fecha, d.vistas, d.sesiones, d.wa, d.ini, d.env]));
    return `\ufeff${filas.map((f) => f.join(',')).join('\r\n')}`;
  };

  ED.analitica = { resumen, contarReales, limpiar, csv, PAGINAS };
})();
