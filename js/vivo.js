// Recarga sola mientras se trabaja en la PC. En GitHub Pages no hace nada.
(function () {
  if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;
  const archivos = ['index.html', 'css/estilo.css', 'css/juego.css', 'css/inscripcion.css', 'js/figura.js', 'js/dragon.js', 'js/portada.js', 'js/juego.js', 'js/inscripcion.js', 'js/app.js'];
  const visto = {};
  async function firma(a) {
    try {
      const r = await fetch(a + '?v=' + Date.now(), { method: 'HEAD', cache: 'no-store' });
      return (r.headers.get('last-modified') || '') + (r.headers.get('content-length') || '');
    } catch (e) { return null; }
  }
  async function vuelta() {
    for (const a of archivos) {
      const f = await firma(a);
      if (f === null) continue;
      if (visto[a] !== undefined && visto[a] !== f) {
        if (a.endsWith('.css')) {
          visto[a] = f;
          document.querySelectorAll('link[rel=stylesheet][href*="' + a + '"]').forEach(l => { l.href = a + '?v=' + Date.now(); });
          continue;
        }
        try { sessionStorage.setItem('vivo-scroll', String(scrollY)); } catch (e) {}
        location.reload();
        return;
      }
      visto[a] = f;
    }
    setTimeout(vuelta, 900);
  }
  try {
    const y = sessionStorage.getItem('vivo-scroll');
    if (y) { sessionStorage.removeItem('vivo-scroll'); addEventListener('load', () => scrollTo(0, +y)); }
  } catch (e) {}
  vuelta();
})();
