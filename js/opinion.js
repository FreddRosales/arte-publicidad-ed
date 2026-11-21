/* opinion.js — Evaluación del sitio (escala Likert de 5 puntos) y cuadro de comentarios */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-opinion');
  const lista = document.getElementById('likert-lista');
  const errores = document.getElementById('op-errores');
  const comentario = document.getElementById('op-comentario');
  const cuenta = document.getElementById('op-cuenta');
  const vistaForm = document.getElementById('vista-form');
  const vistaGracias = document.getElementById('vista-gracias');

  /* ---------- Pintar las afirmaciones Likert ---------- */
  const opcion = (itemId, e) => `
    <input class="btn-check" type="radio" name="lk-${itemId}" id="lk-${itemId}-${e.v}" value="${e.v}" required>
    <label class="btn likert-op" for="lk-${itemId}-${e.v}">
      <span class="likert-n" aria-hidden="true">${e.v}</span>
      <span class="likert-t d-none d-sm-block">${ED.esc(e.t)}</span>
      <span class="visually-hidden d-sm-none">${e.v}: ${ED.esc(e.t)}</span>
    </label>`;

  lista.innerHTML = ED.LIKERT_ITEMS.map((it, i) => `
    <fieldset class="likert-item" id="fs-${it.id}">
      <legend>${i + 1}. ${ED.esc(it.texto)}</legend>
      <div class="likert-grid" role="presentation">${ED.LIKERT_ESCALA.map((e) => opcion(it.id, e)).join('')}</div>
      <div class="likert-ejes" aria-hidden="true"><span>1 · Muy en desacuerdo</span><span>5 · Muy de acuerdo</span></div>
      <p class="text-danger small mb-0 mt-2 d-none" id="err-${it.id}" role="alert"><i class="bi bi-exclamation-circle" aria-hidden="true"></i> Elige una opción del 1 al 5.</p>
    </fieldset>`).join('');

  document.getElementById('op-tipo').innerHTML = ED.TIPOS_OPINION.map((t) => `<option>${ED.esc(t)}</option>`).join('');

  /* ---------- Contador de caracteres ---------- */
  const actualizarCuenta = () => { cuenta.textContent = `${comentario.value.length} / ${comentario.maxLength}`; };
  comentario.addEventListener('input', actualizarCuenta);

  /* Al marcar una opción, se quita el aviso de esa afirmación */
  lista.addEventListener('change', (e) => {
    const fs = e.target.closest('.likert-item');
    if (!fs) return;
    fs.classList.remove('falta');
    const id = fs.id.replace('fs-', '');
    document.getElementById(`err-${id}`).classList.add('d-none');
    if (!form.querySelector('.likert-item.falta')) errores.classList.add('d-none');
  });

  /* ---------- Enviar ---------- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const respuestas = {};
    const faltan = [];
    ED.LIKERT_ITEMS.forEach((it, i) => {
      const marcado = form.querySelector(`input[name="lk-${it.id}"]:checked`);
      const fs = document.getElementById(`fs-${it.id}`);
      const err = document.getElementById(`err-${it.id}`);
      if (marcado) {
        respuestas[it.id] = Number(marcado.value);
        fs.classList.remove('falta'); err.classList.add('d-none');
      } else {
        faltan.push(i + 1);
        fs.classList.add('falta'); err.classList.remove('d-none');
      }
    });

    if (faltan.length) {
      errores.innerHTML = `<strong>Falta responder ${faltan.length === 1 ? 'la afirmación' : 'las afirmaciones'} ${faltan.join(', ')}.</strong> Elige un valor del 1 al 5 en cada una.`;
      errores.classList.remove('d-none');
      errores.focus();
      return;
    }
    errores.classList.add('d-none');

    const opinion = {
      id: ED.nextOpinionId(),
      fecha: ED.iso(new Date()),
      nombre: document.getElementById('op-nombre').value.trim(),
      tipo: document.getElementById('op-tipo').value,
      respuestas,
      comentario: comentario.value.trim()
    };
    const todas = ED.getOpiniones();
    todas.push(opinion);
    ED.saveOpiniones(todas);

    document.getElementById('gracias-prom').textContent = ED.promedioOpinion(opinion).toFixed(1);
    vistaForm.classList.add('d-none');
    vistaGracias.classList.remove('d-none');
    vistaGracias.focus();
    toast('Opinión enviada. ¡Gracias!');
  });

  /* ---------- Enviar otra ---------- */
  document.getElementById('btn-otra').addEventListener('click', () => {
    form.reset(); actualizarCuenta();
    vistaGracias.classList.add('d-none');
    vistaForm.classList.remove('d-none');
    document.getElementById('contenido').focus();
  });
});
