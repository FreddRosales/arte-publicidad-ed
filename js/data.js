/* ==========================================================================
   data.js — Datos de muestra y utilidades compartidas
   Arte y Publicidad E&D · Prototipo (sin servidor: usa localStorage)
   ========================================================================== */
'use strict';

const ED = (() => {
  const WHATSAPP = '51945380460'; // RN11: siempre el número oficial de la empresa

  /* ---------- Almacenamiento (con respaldo en memoria) ---------- */
  const mem = {};
  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(key);
        if (v !== null) return JSON.parse(v);
      } catch (e) { /* localStorage no disponible */ }
      return key in mem ? mem[key] : fallback;
    },
    set(key, value) {
      mem[key] = value;
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignorar */ }
    },
    remove(key) {
      delete mem[key];
      try { localStorage.removeItem(key); } catch (e) { /* ignorar */ }
    }
  };

  /* ---------- Utilidades ---------- */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
  const fmtDate = (s) => {
    if (!s) return '—';
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const waLink = (msg) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;

  /* ---------- Estados del pedido ---------- */
  const RECIBIDA = { id: 'recibida', label: 'Recibida', desc: 'Recibimos tu solicitud. Te responderemos en 24 a 48 horas hábiles.' };
  const ESTADOS = [
    { id: 'cotizado', label: 'Cotizado', desc: 'Ya preparamos tu cotización.' },
    { id: 'aprobado', label: 'Aprobado', desc: 'La cotización fue aprobada.' },
    { id: 'diseno', label: 'En diseño', desc: 'Estamos diseñando tu trabajo.' },
    { id: 'produccion', label: 'En producción', desc: 'Tu trabajo se está imprimiendo o fabricando.' },
    { id: 'entregado', label: 'Entregado', desc: 'Trabajo entregado.' }
  ];
  const estadoLabel = (id) => ([RECIBIDA, ...ESTADOS].find((e) => e.id === id) || { label: id }).label;
  const estadoIndex = (id) => ESTADOS.findIndex((e) => e.id === id); // -1 = recibida

  /* ---------- Catálogos ---------- */
  const SERVICIOS = [
    { id: 'banner', nombre: 'Banner o gigantografía', icono: 'bi-image' },
    { id: 'tarjetas', nombre: 'Tarjetas y afiches', icono: 'bi-card-text' },
    { id: 'logotipo', nombre: 'Logotipo y diseño gráfico', icono: 'bi-palette' },
    { id: 'letrero', nombre: 'Letreros y estructuras', icono: 'bi-signpost-2' },
    { id: 'estampado', nombre: 'Estampados', icono: 'bi-bag-heart' },
    { id: 'foto', nombre: 'Fotografía y video', icono: 'bi-camera-video' }
  ];

  // Explicaciones en lenguaje sencillo (hallazgo de la etapa Empatizar)
  const MATERIALES = [
    { id: 'lona', nombre: 'Lona', ayuda: 'Material grueso y resistente. Ideal para exteriores (sol y lluvia).' },
    { id: 'vinil', nombre: 'Vinil adhesivo', ayuda: 'Se pega como un sticker en vidrios, paredes o vehículos.' },
    { id: 'papel', nombre: 'Papel o cartulina', ayuda: 'Para tarjetas, afiches y folletos. Uso en interiores.' },
    { id: 'tela', nombre: 'Tela', ayuda: 'Para polos, uniformes, gorras y banderolas.' },
    { id: 'noSe', nombre: 'No sé cuál elegir', ayuda: 'Te aconsejamos según lo que necesitas y dónde lo usarás.' }
  ];

  const TIPOS_EVENTO = ['Boda', 'Quince años', 'Cumpleaños', 'Evento institucional', 'Sesión fotográfica', 'Otro'];

    const CATALOGO_INICIAL = [
    { id: 1, titulo: 'Mural digital', categoria: 'Exterior', material: 'Vinil', descripcion: 'Mural publicitario para fachada de local comercial.'  , img: 'assets/img/Muraldigital.jpeg' },
    { id: 2, titulo: 'Panel luminoso', categoria: 'Exterior', material: 'Otro', descripcion: 'Caja de luz con impresión a todo color.' , img: 'assets/img/Panelluminoso.jpeg' },
    { id: 3, titulo: 'Afiche cultural', categoria: 'Impresión', material: 'Papel', descripcion: 'Afiche para evento cultural, impresión en gran formato.' , img: 'assets/img/Afiche.jpeg' },
    { id: 4, titulo: 'Diploma', categoria: 'Diseño', material: 'Papel', descripcion: 'Diploma de reconocimiento con diseño personalizado.'  , img: 'assets/img/Diploma.jpeg'  },
    { id: 5, titulo: 'Estampado de polo', categoria: 'Estampados', material: 'Tela', descripcion: 'Estampado a todo color en polo de algodón.' , img: 'assets/img/Estampado.jpeg'  },
    { id: 6, titulo: 'Banderola', categoria: 'Impresión', material: 'Tela', descripcion: 'Banderola para exposición, con soporte.'  , img: 'assets/img/Banderola.jpeg' },
    { id: 7, titulo: 'Banner de bienvenida', categoria: 'Impresión', material: 'Lona', descripcion: 'Banner 2 × 1 m con ojales para colgar.'  , img: 'assets/img/BannerBienveida.jpg'  },
    { id: 8, titulo: 'Logotipo para negocio', categoria: 'Diseño', material: 'Otro', descripcion: 'Identidad visual: logotipo y paleta de colores.'  , img: 'assets/img/logo.png'  },
        { id: 9, titulo: 'Letrero comercial', categoria: 'Exterior', material: 'Otro', descripcion: 'Letrero con letras block instalado en fachada.', img: 'assets/img/Letrerocomercial.jpg' },
    { id: 10, titulo: 'Cobertura de boda', categoria: 'Eventos', material: 'Otro', descripcion: 'Fotografía y video de ceremonia y recepción.', img: 'assets/img/Coberturaboda.jpg' },
    { id: 11, titulo: 'Quince años', categoria: 'Eventos', material: 'Otro', descripcion: 'Sesión fotográfica y video resumen de la fiesta.', img: 'assets/img/CoberturaXV.jpg' },
    { id: 12, titulo: 'Vinil para vitrina', categoria: 'Impresión', material: 'Vinil', descripcion: 'Vinil microperforado para vidrio de tienda.', img: 'assets/img/Vinil.jpg' }
  ];

  /* ---------- Solicitudes de muestra ---------- */
  const seedRequests = () => ([
    { id: 'AP-0001', cliente: 'Juan Perez Llanos', contacto: '967 349 321', servicio: 'Banner publicitario', medidas: '2 × 1 m', material: 'Lona', cantidad: 1, estado: 'diseno', recibida: addDays(-6), entrega: addDays(3), asignado: 'Diego', notas: 'Necesito un banner para la entrada de mi negocio.', archivos: ['referencia.pdf'], tipoEvento: '', fechaEvento: '' },
    { id: 'AP-0002', cliente: 'Claudia Llanos Urteaga', contacto: '957 124 098', servicio: 'Tarjetas de presentación', medidas: '9 × 5 cm', material: 'Papel', cantidad: 500, estado: 'diseno', recibida: addDays(-5), entrega: addDays(5), asignado: 'Diego', notas: 'Diseño sencillo, en azul y blanco.', archivos: ['logo.png'], tipoEvento: '', fechaEvento: '' },
    { id: 'AP-0003', cliente: 'Itzel Rodriguez Sánchez', contacto: '976 540 324', servicio: 'Letrero comercial', medidas: '3 × 0.8 m', material: 'Otro', cantidad: 1, estado: 'produccion', recibida: addDays(-9), entrega: addDays(2), asignado: 'Diego', notas: 'Letras block con luz.', archivos: [], tipoEvento: '', fechaEvento: '' },
    { id: 'AP-0004', cliente: 'Karla Hidalgo Perez', contacto: '947 854 631', servicio: 'Estampado personalizado', medidas: 'A4', material: 'Tela', cantidad: 25, estado: 'entregado', recibida: addDays(-14), entrega: addDays(-2), asignado: 'Diego', notas: 'Uniformes para equipo deportivo.', archivos: ['escudo.png'], tipoEvento: '', fechaEvento: '' },
    { id: 'AP-0005', cliente: 'Lorena Vigo Narro', contacto: '965 786 540', servicio: 'Vinil para vitrina', medidas: '1.5 × 1 m', material: 'Vinil', cantidad: 2, estado: 'cotizado', recibida: addDays(-2), entrega: '', asignado: '', notas: '', archivos: [], tipoEvento: '', fechaEvento: '' },
    { id: 'AP-0006', cliente: 'Simón Suarez Vertiz', contacto: '954 876 943', servicio: 'Fotografía y video', medidas: '', material: '', cantidad: 1, estado: 'recibida', recibida: addDays(-1), entrega: '', asignado: '', notas: 'Cobertura de boda civil.', archivos: [], tipoEvento: 'Boda', fechaEvento: addDays(40) },
  
  ]);

  const KEY_REQ = 'ed_solicitudes_v3';
  const KEY_CAT = 'ed_catalogo_v3';
  const KEY_USER = 'ed_usuario';

  const getRequests = () => {
    let r = store.get(KEY_REQ, null);
    if (!r) { r = seedRequests(); store.set(KEY_REQ, r); }
    return r;
  };
  const saveRequests = (r) => store.set(KEY_REQ, r);
  const nextId = () => {
    const max = getRequests().reduce((m, r) => Math.max(m, parseInt(r.id.replace(/\D/g, ''), 10) || 0), 0);
    return `AP-${String(max + 1).padStart(4, '0')}`;
  };
  const normalizeId = (txt) => {
    const digits = String(txt || '').replace(/\D/g, '');
    return digits ? `AP-${digits.padStart(4, '0')}` : '';
  };

  const getCatalog = () => {
    let c = store.get(KEY_CAT, null);
    if (!c) { c = CATALOGO_INICIAL; store.set(KEY_CAT, c); }
    return c;
  };
  const saveCatalog = (c) => store.set(KEY_CAT, c);

  /* Clientes: se derivan de las solicitudes (agrupadas por nombre) */
  const getClients = () => {
    const map = new Map();
    getRequests().forEach((r) => {
      if (!map.has(r.cliente)) map.set(r.cliente, { nombre: r.cliente, contacto: r.contacto, pedidos: [] });
      map.get(r.cliente).pedidos.push(r);
    });
    return [...map.values()];
  };

  /* Disponibilidad referencial del calendario (RN02: no es una reserva) */
  const fechaDisponible = (d) => {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    if (d < hoy) return false;
    return (d.getDate() * 7 + d.getMonth() * 3) % 5 !== 0;
  };

  /* Sesión de personal (solo demostración; NO es seguridad real) */
  const USUARIOS = {
    admin: { pass: 'admin123', rol: 'admin', nombre: 'Eberth' },
    diego: { pass: 'diseno123', rol: 'diseno', nombre: 'Diego' }
  };
  const getUser = () => store.get(KEY_USER, null);
  const requireRole = (rol) => {
    const u = getUser();
    if (!u || u.rol !== rol) { location.replace(`login.html?next=${encodeURIComponent(location.pathname.split('/').pop())}`); return null; }
    return u;
  };

  return {
    WHATSAPP, store, esc, iso, addDays, fmtDate, waLink,
    RECIBIDA, ESTADOS, estadoLabel, estadoIndex,
    SERVICIOS, MATERIALES, TIPOS_EVENTO,
    getRequests, saveRequests, nextId, normalizeId,
    getCatalog, saveCatalog, getClients, fechaDisponible,
    USUARIOS, KEY_USER, getUser, requireRole
  };
})();
