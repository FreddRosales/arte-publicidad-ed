/* login.js — Ingreso del personal (SOLO DEMOSTRACIÓN)
   Las credenciales viven en el navegador: no ofrece seguridad real.
   En un sistema real la autenticación debe validarse en el servidor. */
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-login');
  const usuario = document.getElementById('usuario');
  const clave = document.getElementById('clave');
  const error = document.getElementById('login-error');
  const ver = document.getElementById('ver-clave');

  ver.addEventListener('click', () => {
    const mostrar = clave.type === 'password';
    clave.type = mostrar ? 'text' : 'password';
    ver.setAttribute('aria-pressed', String(mostrar));
    ver.setAttribute('aria-label', mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña');
    ver.innerHTML = `<i class="bi ${mostrar ? 'bi-eye-slash' : 'bi-eye'}" aria-hidden="true"></i>`;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const u = usuario.value.trim().toLowerCase();
    const cuenta = ED.USUARIOS[u];
    if (!u || !clave.value) {
      error.textContent = 'Escribe tu usuario y tu contraseña.';
    } else if (!cuenta || cuenta.pass !== clave.value) {
      error.textContent = 'Usuario o contraseña incorrectos. Revisa los datos e inténtalo de nuevo.';
    } else {
      ED.store.set(ED.KEY_USER, { usuario: u, rol: cuenta.rol, nombre: cuenta.nombre });
      location.href = cuenta.rol === 'admin' ? 'panel.html' : 'trabajos.html';
      return;
    }
    error.classList.remove('d-none');
    usuario.focus();
  });
});
