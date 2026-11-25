'use strict';

(() => {
  const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const EASE = 'cubic-bezier(.22, .61, .36, 1)';

  const activo = () => !mq.matches;
  const puede = (el) => !!el && typeof el.animate === 'function';

  function entrar(el, { x = 0, y = 14, dur = 520, delay = 0 } = {}) {
    if (!activo() || !puede(el)) return null;
    return el.animate(
      [{ opacity: 0, transform: `translate(${x}px, ${y}px)` }, { opacity: 1, transform: 'none' }],
      { duration: dur, delay, easing: EASE, fill: 'backwards' }
    );
  }

  const formatoTiempo = (seg) => {
    const s = Math.round(seg);
    return s >= 60 ? `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s` : `${s} s`;
  };
  function texto(el, v) {
    const dec = Number(el.dataset.dec || 0);
    const pad = Number(el.dataset.pad || 0);
    const suf = el.dataset.suffix || '';
    if (el.dataset.formato === 'tiempo') return formatoTiempo(v);
    if (pad && !dec) return String(Math.round(v)).padStart(pad, '0') + suf;
    return v.toLocaleString('es-PE', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
  }
  function contar(el, dur = 900) {
    const fin = parseFloat(el.dataset.count);
    if (Number.isNaN(fin)) return;
    if (!activo()) { el.textContent = texto(el, fin); return; }
    const t0 = performance.now();
    const paso = (ahora) => {
      const k = Math.min(1, (ahora - t0) / dur);
      const suave = 1 - Math.pow(1 - k, 3);
      el.textContent = texto(el, fin * suave);
      if (k < 1) requestAnimationFrame(paso); else el.textContent = texto(el, fin);
    };
    requestAnimationFrame(paso);
  }
  const contarTodos = (raiz = document) => raiz.querySelectorAll('[data-count]').forEach((el) => contar(el));

  function revelarAlScroll(selector, raiz = document) {
    if (!activo() || !('IntersectionObserver' in window)) return;
    const els = [...raiz.querySelectorAll(selector)].filter((el) => !el.dataset.revelado);
    if (!els.length) return;
    const io = new IntersectionObserver((entradas) => {
      entradas.filter((e) => e.isIntersecting).forEach((e, i) => {
        io.unobserve(e.target);
        e.target.style.opacity = '';
        entrar(e.target, { y: 16, dur: 480, delay: Math.min(i, 5) * 70 });
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach((el) => { el.dataset.revelado = '1'; el.style.opacity = '0'; io.observe(el); });
    window.addEventListener('beforeprint', () => els.forEach((el) => { el.style.opacity = ''; }));
  }

  function portada() {
    const hero = document.querySelector('.hero');
    if (!hero || !activo()) return;
    const bloques = hero.querySelectorAll('.col-lg-6:first-child > *');
    bloques.forEach((el, i) => entrar(el, { y: 20, dur: 650, delay: 80 + i * 120 }));
    const foto = hero.querySelector('.nosotros-foto');
    if (puede(foto)) {
      foto.animate(
        [{ clipPath: 'inset(0 100% 0 0 round 14px)', opacity: 0.5 }, { clipPath: 'inset(0 0 0 0 round 14px)', opacity: 1 }],
        { duration: 950, delay: 220, easing: EASE, fill: 'backwards' }
      );
    }
  }

  function catalogo() {
    const grid = document.getElementById('grid-obras');
    if (!grid) return;
    new MutationObserver((muts) => {
      if (!activo()) return;
      const nuevos = [];
      muts.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1) nuevos.push(n); }));
      nuevos.forEach((n, i) => entrar(n, { y: 10, dur: 360, delay: Math.min(i, 8) * 40 }));
    }).observe(grid, { childList: true });
  }

  function cotizar() {
    const form = document.getElementById('form-cotizar');
    const ok = document.getElementById('vista-ok');
    if (!form) return;
    new MutationObserver((muts) => {
      muts.forEach((m) => {
        const el = m.target;
        if (el.matches && el.matches('section[data-step]') && !el.hidden) entrar(el, { x: 28, y: 0, dur: 380 });
      });
    }).observe(form, { attributes: true, attributeFilter: ['hidden'], subtree: true });

    if (ok) {
      new MutationObserver(() => {
        if (ok.hidden || !activo()) return;
        const icono = ok.querySelector('.confirm-icon');
        if (puede(icono)) {
          icono.animate(
            [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1.18)', opacity: 1, offset: 0.65 }, { transform: 'scale(1)', opacity: 1 }],
            { duration: 620, easing: EASE, fill: 'backwards' }
          );
        }
        const num = document.getElementById('ok-numero');
        if (puede(num)) num.animate([{ opacity: 0, letterSpacing: '.3em' }, { opacity: 1, letterSpacing: '.04em' }], { duration: 700, delay: 350, easing: EASE, fill: 'backwards' });
      }).observe(ok, { attributes: true, attributeFilter: ['hidden'] });
    }
  }

  function seguimiento() {
    const out = document.getElementById('resultado');
    if (!out) return;
    const animar = () => {
      const tl = out.querySelector('.timeline');
      if (!tl || !activo()) return;
      tl.querySelectorAll('li').forEach((li, i) => {
        const demora = i * 170;
        try {
          li.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 320, delay: demora, easing: EASE, fill: 'backwards', pseudoElement: '::before' });
        } catch (e) { }
        const punto = li.querySelector('.tl-dot');
        if (puede(punto)) punto.animate([{ transform: 'scale(.4)', opacity: 0 }, { transform: 'scale(1.2)', opacity: 1, offset: 0.7 }, { transform: 'scale(1)', opacity: 1 }], { duration: 440, delay: demora + 120, easing: EASE, fill: 'backwards' });
        const rotulo = li.querySelector('.tl-label');
        if (puede(rotulo)) rotulo.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 360, delay: demora + 200, easing: EASE, fill: 'backwards' });
      });
    };
    new MutationObserver(animar).observe(out, { childList: true });
    animar();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const publica = document.body.dataset.layout !== 'staff';
    portada();
    catalogo();
    cotizar();
    seguimiento();
    if (publica) revelarAlScroll('.service-card, .work-card, ol.row > li, .cta-band');
  });

  ED.anim = { activo, entrar, contar, contarTodos, revelarAlScroll };
})();
