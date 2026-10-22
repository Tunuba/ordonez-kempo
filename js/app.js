// Lo comun de la pagina, logo, menu, apariciones, promos, cinturones y horario.
(function () {
  const NS = 'http://www.w3.org/2000/svg';

  // Logo, un dragon que da la vuelta al sol rojo con el kanji del puño al centro.
  function logo(svg, conTexto) {
    const c = 100;
    const id = 'l' + Math.random().toString(36).slice(2, 7);
    const pts = (arr) => arr.map(p => p[0].toFixed(2) + ',' + p[1].toFixed(2)).join(' ');
    const a0 = -0.95, vuelta = Math.PI * 1.78, N = 90;
    const borde1 = [], borde2 = [], puas = [];
    for (let i = 0; i <= N; i++) {
      const s = i / N;
      const a = a0 - s * vuelta;
      const r = 63 + 5 * Math.sin(s * Math.PI * 4);
      const w = 12.5 * Math.pow(1 - s, 0.75) + 1.2;
      const x = c + Math.cos(a) * r, y = c + Math.sin(a) * r;
      const nx = Math.cos(a), ny = Math.sin(a);
      borde1.push([x + nx * w / 2, y + ny * w / 2]);
      borde2.push([x - nx * w / 2, y - ny * w / 2]);
      if (i > 3 && i % 5 === 0 && s < .92) {
        const tx = Math.sin(a), ty = -Math.cos(a);
        const h = 4 + 7 * (1 - s);
        const bx = x + nx * w / 2, by = y + ny * w / 2;
        puas.push([[bx - tx * h * .55, by - ty * h * .55], [bx + nx * h + tx * h * .5, by + ny * h + ty * h * .5], [bx + tx * h * .35, by + ty * h * .35]]);
      }
    }
    const cuerpo = borde1.concat(borde2.reverse());
    // Cabeza, mirando en el sentido del avance (horario)
    const hx = c + Math.cos(a0) * 63, hy = c + Math.sin(a0) * 63;
    const ang = a0 + Math.PI / 2;
    const cab = [[-6, -7], [4, -9], [9, -10], [-4, -21], [13, -11], [22, -8], [31, -5], [34, -1], [24, 1], [32, 6], [21, 8], [8, 9], [-6, 7]];
    const rot = cab.map(([u, v]) => [hx + Math.cos(ang) * u - Math.sin(ang) * v, hy + Math.sin(ang) * u + Math.cos(ang) * v]);
    const ojo = [hx + Math.cos(ang) * 15 - Math.sin(ang) * -4, hy + Math.sin(ang) * 15 + Math.cos(ang) * -4];
    let h = '';
    h += `<defs><radialGradient id="${id}s" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="#ff5a36"/><stop offset=".6" stop-color="#d7261e"/><stop offset="1" stop-color="#7c0f0b"/></radialGradient>`;
    h += `<linearGradient id="${id}o" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe29a"/><stop offset=".5" stop-color="#e8b04a"/><stop offset="1" stop-color="#a86d1c"/></linearGradient>`;
    h += `<path id="${id}t" d="M ${c - 86} ${c} A 86 86 0 0 1 ${c + 86} ${c}"/><path id="${id}b" d="M ${c - 86} ${c} A 86 86 0 0 0 ${c + 86} ${c}"/></defs>`;
    h += `<circle cx="100" cy="100" r="98" fill="#0c0a0b"/><circle cx="100" cy="100" r="96" fill="none" stroke="url(#${id}o)" stroke-width="3"/>`;
    if (conTexto) {
      h += `<circle cx="100" cy="100" r="77" fill="none" stroke="url(#${id}o)" stroke-width="1.2" opacity=".7"/>`;
      h += `<text font-family="Big Shoulders Display, Arial Narrow, sans-serif" font-weight="900" font-size="15" letter-spacing="3.2" fill="#f3ece0"><textPath href="#${id}t" startOffset="50%" text-anchor="middle" dominant-baseline="middle">ORDÓÑEZ TEAM</textPath></text>`;
      h += `<text font-family="Big Shoulders Display, Arial Narrow, sans-serif" font-weight="800" font-size="12.5" letter-spacing="3.6" fill="#e8b04a"><textPath href="#${id}b" startOffset="50%" text-anchor="middle" dominant-baseline="middle">ELEMENT KARATE</textPath></text>`;
      h += `<circle cx="17" cy="100" r="2.4" fill="#d7261e"/><circle cx="183" cy="100" r="2.4" fill="#d7261e"/>`;
    }
    const k = conTexto ? .82 : 1.12;
    h += `<g transform="translate(100 100) scale(${k}) translate(-100 -100)">`;
    h += `<circle cx="100" cy="100" r="47" fill="url(#${id}s)"/>`;
    h += `<text x="100" y="101" text-anchor="middle" dominant-baseline="central" font-family="Yuji Syuku, Yu Mincho, serif" font-size="56" fill="#f3ece0">拳</text>`;
    h += `<g fill="url(#${id}o)" stroke="#0c0a0b" stroke-width="1.6" stroke-linejoin="round">`;
    puas.forEach(p => { h += `<polygon points="${pts(p)}"/>`; });
    h += `<polygon points="${pts(cuerpo)}"/><polygon points="${pts(rot)}"/></g>`;
    h += `<circle cx="${ojo[0].toFixed(1)}" cy="${ojo[1].toFixed(1)}" r="2" fill="#d7261e"/>`;
    h += `</g>`;
    svg.innerHTML = h;
  }
  // El logo del dojo es el tigre de Element Karate, el dibujado queda de respaldo
  function logoDojo(svg) {
    svg.innerHTML = '<image href="img/logo-tigre.png" x="0" y="0" width="200" height="200"/>';
  }
  document.querySelectorAll('[data-logo]').forEach(s => logoDojo(s));
  window.pintarLogo = logoDojo;
  window.pintarLogoDragon = logo;

  // Titulo de la portada letra por letra
  document.querySelectorAll('.portada h1 > span').forEach((sp, j) => {
    const txt = sp.textContent;
    sp.textContent = '';
    let i = 0;
    txt.split(' ').forEach((pal, w) => {
      if (w) sp.appendChild(document.createTextNode(' '));
      const caja = document.createElement('span');
      caja.className = 'palabra';
      [...pal].forEach(c => {
        const l = document.createElement('i');
        l.className = 'letra';
        l.textContent = c;
        l.style.animationDelay = (j * .35 + i++ * .045) + 's';
        caja.appendChild(l);
      });
      sp.appendChild(caja);
    });
  });

  // Barra que se llena al bajar y menu que marca la seccion
  const barra = document.getElementById('barra');
  const enlaces = [...document.querySelectorAll('.menu a')];
  function alBajar() {
    barra.classList.toggle('llena', scrollY > 40);
  }
  addEventListener('scroll', alBajar, { passive: true });
  alBajar();
  // Paginas, una seccion a la vez como en una app
  const paginas = [...document.querySelectorAll('main > section[id]')];
  const NOMBRES = { inicio: 'Inicio', promos: 'Promociones', clases: 'Clases', estilo: 'Nuestro estilo', equipo: 'Nuestro equipo', tecnicas: 'Técnicas', horario: 'Horario', juego: 'Reto del Dragón', inscripcion: 'Preinscripción', contacto: 'Visítanos' };
  paginas.forEach((s, i) => {
    const sig = paginas[i + 1];
    if (!sig || s.id === 'inicio') return;
    const a = document.createElement('a');
    a.className = 'siguiente';
    a.href = '#' + sig.id;
    a.innerHTML = `<small>Sigue con</small><b>${NOMBRES[sig.id]}</b><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
    s.appendChild(a);
  });
  let actual = null;
  function mostrar(id, primera) {
    const p = paginas.find(s => s.id === id) || paginas[0];
    if (actual === p) { scrollTo({ top: 0, behavior: 'smooth' }); return; }
    paginas.forEach(s => { s.style.clipPath = ''; s.style.transition = ''; });
    if (actual) actual.classList.remove('activa');
    p.classList.add('activa');
    actual = p;
    document.body.dataset.pagina = p.id;
    enlaces.forEach(a => a.classList.toggle('activo', a.getAttribute('href') === '#' + p.id));
    const activo = document.querySelector('.menu a.activo');
    if (activo && activo.scrollIntoView && innerWidth < 1060) activo.scrollIntoView({ inline: 'center', block: 'nearest', behavior: primera ? 'auto' : 'smooth' });
    scrollTo(0, 0);
    const conBoca = ['promos', 'juego', 'inscripcion'].includes(p.id);
    if (!primera && conBoca && window.dragonBoca) {
      // la pagina sale de la boca del dragon
      p.style.transition = 'none';
      p.style.clipPath = 'circle(0px at 30% 50%)';
      window.dragonBoca((x, y) => {
        p.style.clipPath = `circle(0px at ${x}px ${y}px)`;
        void p.offsetWidth;
        p.style.transition = 'clip-path .9s cubic-bezier(.7,0,.2,1)';
        p.style.clipPath = `circle(160vmax at ${x}px ${y}px)`;
        setTimeout(() => { p.style.clipPath = ''; p.style.transition = ''; }, 950);
      });
    } else if (!primera && p.id !== 'inicio' && window.dragonPasa) window.dragonPasa();
    dispatchEvent(new CustomEvent('pagina', { detail: { id: p.id } }));
    alBajar();
  }
  addEventListener('hashchange', () => mostrar(location.hash.slice(1)));
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    if (!paginas.some(s => s.id === id)) return;
    e.preventDefault();
    if (location.hash !== '#' + id) history.pushState(null, '', '#' + id);
    mostrar(id);
  });
  addEventListener('popstate', () => mostrar(location.hash.slice(1) || 'inicio'));
  mostrar(location.hash.slice(1) || 'inicio', true);

  // Aparicion al bajar
  const piezas = document.querySelectorAll('.cabeza, .eq-grande, .eq-tira figure, .promo, .clase, .estilo-txt, .pilar, .tec-escena, .tec-botones, .cintas, .filtros, .dia, .juego-marco, .inscripcion, .contacto-txt, .mapa');
  const obs = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visto'); obs.unobserve(e.target); } });
  }, { threshold: .12 });
  piezas.forEach((p, i) => {
    p.classList.add('revela');
    const hermanos = [...p.parentElement.children].filter(h => h.classList.contains('revela'));
    p.style.transitionDelay = (hermanos.indexOf(p) * 0.08) + 's';
    obs.observe(p);
  });

  // Tarjetas que se inclinan con el raton
  document.querySelectorAll('[data-inclinar]').forEach(t => {
    t.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = t.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      t.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 8}deg) rotateY(${(x - 0.5) * 10}deg) translateZ(0)`;
      t.style.setProperty('--mx', x * 100 + '%');
      t.style.setProperty('--my', y * 100 + '%');
    });
    t.addEventListener('pointerleave', () => { t.style.transform = ''; });
  });

  // Cuenta regresiva de la inscripcion gratis
  const fin = new Date(2026, 10, 30, 23, 59, 59).getTime();
  const celdas = {};
  document.querySelectorAll('#cuenta [data-c]').forEach(b => { celdas[b.dataset.c] = b; });
  function cuenta() {
    let d = Math.max(0, fin - Date.now()) / 1000;
    const v = { d: Math.floor(d / 86400), h: Math.floor(d % 86400 / 3600), m: Math.floor(d % 3600 / 60), s: Math.floor(d % 60) };
    for (const k in v) {
      const t = String(v[k]).padStart(2, '0');
      if (celdas[k] && celdas[k].textContent !== t) {
        celdas[k].textContent = t;
        celdas[k].classList.remove('gira'); void celdas[k].offsetWidth; celdas[k].classList.add('gira');
      }
    }
  }
  cuenta();
  setInterval(cuenta, 1000);

  // Cinturones
  const CINTAS = [
    ['Blanco', '#f3ece0', 'El primer día'],
    ['Amarillo', '#f2c230', '3 meses'],
    ['Naranja', '#f07b22', '6 meses'],
    ['Verde', '#2f9e4a', '1 año'],
    ['Azul', '#2f6fd6', '1 año y medio'],
    ['Morado', '#7b3fb8', '2 años'],
    ['Café', '#7a4a26', '3 años'],
    ['Negro', '#141012', '4 años o más']
  ];
  window.CINTAS = CINTAS;
  const fila = document.querySelector('.cintas-fila');
  if (fila) {
    fila.innerHTML = CINTAS.map(([n, col, t]) => `
      <div class="cinta-item">
        <svg viewBox="0 0 160 64" aria-hidden="true">
          <path d="M6 22h148v14H6z" fill="${col}" stroke="${n === 'Negro' ? '#4a3d40' : 'rgba(0,0,0,.35)'}" stroke-width="1.5"/>
          <path d="M70 36l-16 26h10l14-20M90 36l16 26H96L82 42" fill="${col}" stroke="${n === 'Negro' ? '#4a3d40' : 'rgba(0,0,0,.35)'}" stroke-width="1.5" stroke-linejoin="round"/>
          <rect x="68" y="16" width="24" height="26" rx="5" fill="${col}" stroke="${n === 'Negro' ? '#4a3d40' : 'rgba(0,0,0,.4)'}" stroke-width="1.5"/>
          ${n === 'Negro' ? '<rect x="130" y="22" width="16" height="14" fill="#d7261e"/>' : ''}
        </svg>
        <b>${n}</b><small>${t}</small>
      </div>`).join('');
  }

  // Horario
  const DIAS = [
    ['Lunes', 1, [['ninos', 'Niños', '4 a 5 pm'], ['jovenes', 'Jóvenes', '5 a 6 pm'], ['adultos', 'Adultos', '7 a 8.30 pm']]],
    ['Miércoles', 3, [['ninos', 'Niños', '4 a 5 pm'], ['jovenes', 'Jóvenes', '5 a 6 pm'], ['adultos', 'Adultos', '7 a 8.30 pm']]],
    ['Viernes', 5, [['ninos', 'Niños', '4 a 5 pm'], ['jovenes', 'Jóvenes', '5 a 6 pm'], ['adultos', 'Adultos', '7 a 8.30 pm']]],
    ['Sábado', 6, [['ninos', 'Niños', '8 a 9.30 am'], ['jovenes', 'Jóvenes', '9.30 a 11 am'], ['adultos', 'Adultos', '11 am a 12.30 pm']]],
    ['Domingo', 0, [['todos', 'Entreno en familia', '9 a 10.30 am'], ['adultos', 'Combate adultos', '10.30 am a 12 pm']]]
  ];
  window.DIAS = DIAS;
  const tabla = document.getElementById('tabla-horario');
  const hoy = new Date().getDay();
  tabla.innerHTML = DIAS.map(([n, d, ts]) => `
    <div class="dia${d === hoy ? ' hoy' : ''}">
      <h3>${n}${d === hoy ? '<small>HOY</small>' : ''}</h3>
      ${ts.map(([g, t, h]) => `<div class="turno" data-g="${g}"><b>${t}</b><span>${h}</span></div>`).join('')}
    </div>`).join('');
  document.getElementById('filtros').addEventListener('click', e => {
    const b = e.target.closest('.filtro');
    if (!b) return;
    document.querySelectorAll('.filtro').forEach(x => x.classList.toggle('activo', x === b));
    const f = b.dataset.f;
    tabla.querySelectorAll('.turno').forEach(t => {
      t.classList.toggle('apagado', f !== 'todos' && t.dataset.g !== f && t.dataset.g !== 'todos');
    });
  });

  // Fotos del equipo, visor a pantalla completa con flechas, teclado y deslizar
  const fotos = [...document.querySelectorAll('[data-foto]')].sort((a, b) => a.dataset.foto - b.dataset.foto);
  const visor = document.getElementById('visor');
  if (visor && fotos.length) {
    const vImg = visor.querySelector('img'), vPie = visor.querySelector('.visor-pie');
    let vi = 0;
    const poner = (i, dir) => {
      vi = (i + fotos.length) % fotos.length;
      const f = fotos[vi], im = f.querySelector('img');
      vImg.src = im.src; vImg.alt = im.alt;
      const pie = f.querySelector('figcaption');
      vPie.textContent = pie ? pie.textContent.trim() : '';
      vImg.animate([{ opacity: 0, transform: `translateX(${(dir || 0) * 60}px) scale(.96)` }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)' });
    };
    const abrir = (i) => { poner(i, 0); visor.classList.add('abierto'); visor.setAttribute('aria-hidden', 'false'); };
    const cerrar = () => { visor.classList.remove('abierto'); visor.setAttribute('aria-hidden', 'true'); };
    fotos.forEach((f, i) => f.addEventListener('click', () => abrir(i)));
    visor.querySelector('.visor-cerrar').addEventListener('click', cerrar);
    visor.querySelector('.visor-atras').addEventListener('click', () => poner(vi - 1, -1));
    visor.querySelector('.visor-sig').addEventListener('click', () => poner(vi + 1, 1));
    visor.addEventListener('click', e => { if (e.target === visor) cerrar(); });
    addEventListener('keydown', e => {
      if (!visor.classList.contains('abierto')) return;
      if (e.key === 'Escape') cerrar();
      if (e.key === 'ArrowRight') poner(vi + 1, 1);
      if (e.key === 'ArrowLeft') poner(vi - 1, -1);
    });
    let x0 = null;
    visor.addEventListener('pointerdown', e => { x0 = e.clientX; });
    visor.addEventListener('pointerup', e => {
      if (x0 === null) return;
      const d = e.clientX - x0; x0 = null;
      if (Math.abs(d) > 50) poner(vi + (d < 0 ? 1 : -1), d < 0 ? 1 : -1);
    });
  }

  // Musica de fondo, arranca suave con el primer toque o tecla y se repite
  const musica = new Audio('audio/dojo-training.mp3');
  musica.loop = true; musica.volume = 0; musica.preload = 'auto';
  const btnMusica = document.getElementById('btn-musica');
  let musicaSi = true;
  try { musicaSi = localStorage.getItem('kempo-musica') !== 'no'; } catch (e) {}
  let volMeta = 0, fundido = 0;
  const volPagina = () => (document.body.dataset.pagina === 'juego' ? .1 : .32);
  function fundir() {
    cancelAnimationFrame(fundido);
    const paso = () => {
      const v = musica.volume + (volMeta - musica.volume) * .06;
      musica.volume = Math.abs(volMeta - v) < .004 ? volMeta : Math.max(0, Math.min(1, v));
      if (musica.volume === 0 && volMeta === 0) { musica.pause(); return; }
      if (musica.volume !== volMeta) fundido = requestAnimationFrame(paso);
    };
    fundido = requestAnimationFrame(paso);
  }
  function sonar() {
    if (!musicaSi) return;
    volMeta = volPagina();
    musica.play().then(fundir).catch(() => {});
  }
  function pintarBoton() { btnMusica.classList.toggle('apagada', !musicaSi); btnMusica.classList.toggle('suena', musicaSi && !musica.paused); }
  musica.addEventListener('play', pintarBoton);
  musica.addEventListener('pause', pintarBoton);
  const primerToque = (e) => {
    if (e.target && e.target.closest && e.target.closest('#btn-musica')) return;
    sonar();
    removeEventListener('pointerdown', primerToque, true);
    removeEventListener('keydown', primerToque, true);
  };
  addEventListener('pointerdown', primerToque, true);
  addEventListener('keydown', primerToque, true);
  btnMusica.addEventListener('click', e => {
    e.stopPropagation();
    musicaSi = !musicaSi;
    try { localStorage.setItem('kempo-musica', musicaSi ? 'si' : 'no'); } catch (er) {}
    if (musicaSi) sonar(); else { volMeta = 0; fundir(); }
    pintarBoton();
  });
  addEventListener('pagina', () => { if (musicaSi && !musica.paused) { volMeta = volPagina(); fundir(); } });
  pintarBoton();
})();
