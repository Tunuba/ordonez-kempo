// Preinscripcion paso a paso. Quien entrena, dias, meta, datos y el pase final.
(function () {
  const raiz = document.getElementById('ins');
  if (!raiz) return;
  const $ = (s, r) => (r || raiz).querySelector(s);
  const $$ = (s, r) => [...(r || raiz).querySelectorAll(s)];

  const GRUPOS = {
    ninos:   { nombre: 'Niño o niña', corto: 'Niños', edad: '5 a 11 años', cinta: '#f2c230', mov: ['frontal', 'guardia', 'directo', 'guardia'] },
    jovenes: { nombre: 'Joven', corto: 'Jóvenes', edad: '12 a 17 años', cinta: '#f07b22', mov: ['directo', 'cruzado', 'guardia', 'bloqueo', 'guardia'] },
    adultos: { nombre: 'Adulto', corto: 'Adultos', edad: '18 en adelante', cinta: '#141012', mov: ['cuchillo', 'guardia', 'circular', 'guardia'] }
  };
  const PROP_NINO = { cabeza: 1.3, torso: .8, pierna: .8, brazo: .85 };
  const CINTA_PASO = [
    ['#f3ece0', 8], ['#f2c230', 30], ['#f07b22', 54], ['#2f9e4a', 78], ['#141012', 100]
  ];

  const est = { paso: 0, max: 0, quien: null, dias: new Set(), meta: null, nombre: '', edad: '', tel: '' };
  const pasos = $$('.ins-paso');
  const lis = $$('#ins-pasos li');
  const relleno = document.getElementById('ins-cinta-relleno');
  const atras = document.getElementById('ins-atras');
  const elegido = document.getElementById('ins-elegido');

  // Sonidos cortos hechos con ondas
  let audio = null;
  function oido() {
    if (!audio) { try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (audio.state === 'suspended') audio.resume();
    return audio;
  }
  function nota(f, t0, dur, vol, tipo) {
    const a = oido(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = tipo || 'sine'; o.frequency.value = f;
    const t = a.currentTime + (t0 || 0);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol || .12, t + .01);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t); o.stop(t + dur + .05);
  }
  const toque = () => { nota(880, 0, .09, .06, 'triangle'); nota(1320, .03, .08, .04, 'sine'); };
  const subir = () => { nota(660, 0, .18, .08, 'triangle'); nota(990, .08, .22, .07, 'triangle'); };
  function campana() {
    [1046.5, 1318.5, 1568, 2093].forEach((f, i) => nota(f, i * .09, 1.1, .08, 'sine'));
    nota(130.8, 0, 2.2, .14, 'sine');
    nota(196, .02, 1.8, .06, 'triangle');
  }

  // Confeti de oro y flores de plumeria
  let capa = null, cx = null, piezas = [], confetiVivo = false;
  function confeti(x, y, cuantos, fuerza) {
    if (!capa) {
      capa = document.createElement('canvas');
      capa.className = 'ins-confeti';
      document.body.appendChild(capa);
      cx = capa.getContext('2d');
    }
    const d = Math.min(devicePixelRatio || 1, 2);
    capa.width = innerWidth * d; capa.height = innerHeight * d;
    cx.setTransform(d, 0, 0, d, 0, 0);
    const f = fuerza || 1;
    for (let i = 0; i < cuantos; i++) {
      const a = -Math.PI / 2 + (Math.random() - .5) * Math.PI * 1.3;
      const v = (5 + Math.random() * 9) * f;
      piezas.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        r: Math.random() * Math.PI * 2, vr: (Math.random() - .5) * .3,
        tam: 5 + Math.random() * 8, flor: Math.random() < .35,
        col: ['#ffd27a', '#e8b04a', '#ff4a2e', '#f3ece0', '#d7261e'][Math.floor(Math.random() * 5)],
        vida: 1, fase: Math.random() * 6
      });
    }
    if (!confetiVivo) { confetiVivo = true; requestAnimationFrame(pasoConfeti); }
  }
  function flor(c, s) {
    for (let i = 0; i < 5; i++) {
      c.save(); c.rotate(i * Math.PI * 2 / 5);
      c.beginPath(); c.ellipse(0, -s * .55, s * .32, s * .58, 0, 0, Math.PI * 2);
      c.fillStyle = '#fffaf0'; c.fill();
      c.restore();
    }
    c.beginPath(); c.arc(0, 0, s * .22, 0, Math.PI * 2); c.fillStyle = '#f2c230'; c.fill();
  }
  function pasoConfeti() {
    cx.clearRect(0, 0, innerWidth, innerHeight);
    piezas = piezas.filter(p => p.vida > 0 && p.y < innerHeight + 40);
    for (const p of piezas) {
      p.vy += .22; p.vx *= .985; p.vy *= .985;
      p.x += p.vx + Math.sin(p.fase += .08) * .8; p.y += p.vy; p.r += p.vr;
      p.vida -= .006;
      cx.save(); cx.globalAlpha = Math.min(1, p.vida * 2);
      cx.translate(p.x, p.y); cx.rotate(p.r);
      if (p.flor) flor(cx, p.tam * 1.2);
      else { cx.scale(1, Math.abs(Math.cos(p.fase * 1.3)) + .15); cx.fillStyle = p.col; cx.fillRect(-p.tam / 2, -p.tam / 4, p.tam, p.tam / 2); }
      cx.restore();
    }
    if (piezas.length) requestAnimationFrame(pasoConfeti);
    else { confetiVivo = false; cx.clearRect(0, 0, innerWidth, innerHeight); }
  }
  function confetiDe(el, n, f) {
    const r = el.getBoundingClientRect();
    confeti(r.left + r.width / 2, r.top + r.height / 2, n, f);
  }

  // Navegar entre pasos
  function ir(n) {
    est.paso = n;
    est.max = Math.max(est.max, n);
    pasos.forEach(p => p.classList.toggle('activo', +p.dataset.paso === n));
    lis.forEach((li, i) => {
      li.classList.toggle('activo', i === n);
      li.classList.toggle('hecho', i < n);
      li.classList.toggle('se-puede', i <= est.max && i !== n && est.max < 4);
    });
    const [col, ancho] = CINTA_PASO[n];
    relleno.style.width = ancho + '%';
    relleno.style.background = col;
    relleno.classList.toggle('negra', n === 4);
    atras.style.visibility = n > 0 && n < 4 ? 'visible' : 'hidden';
    if (n === 1) armarDias();
    if (n === 3) setTimeout(() => { const i = document.getElementById('ins-nombre'); if (i && matchMedia('(pointer: fine)').matches) i.focus({ preventScroll: true }); }, 300);
    resumen();
  }
  function resumen() {
    const partes = [];
    if (est.quien) partes.push(GRUPOS[est.quien].nombre);
    if (est.dias.size) partes.push([...est.dias].map(d => d.slice(0, 3)).join(', '));
    if (est.meta) partes.push(est.meta);
    elegido.textContent = est.paso < 4 ? partes.join(', ') : '';
  }
  lis.forEach((li, i) => li.addEventListener('click', () => { if (i <= est.max && est.max < 4 && i !== est.paso) { toque(); ir(i); } }));
  atras.addEventListener('click', () => { if (est.paso > 0) { toque(); ir(est.paso - 1); } });

  // Paso 0, quien
  function elegirQuien(v, sinAvanzar) {
    est.quien = v;
    $$('.ins-quien .opcion').forEach(o => o.classList.toggle('elegida', o.dataset.v === v));
    est.dias.clear();
    minis.forEach(m => { if (m.grupo === v) { m.anim.ya('victoria', .35, .9); } });
    if (!sinAvanzar) {
      subir();
      const b = $('.ins-quien .opcion[data-v="' + v + '"]');
      if (b) { b.classList.remove('salta'); void b.offsetWidth; b.classList.add('salta'); confetiDe(b, 26, .6); }
      setTimeout(() => ir(1), 700);
    }
  }
  $$('.ins-quien .opcion').forEach(o => o.addEventListener('click', () => elegirQuien(o.dataset.v)));
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-elige]');
    if (!a || !GRUPOS[a.dataset.elige]) return;
    elegirQuien(a.dataset.elige, true);
    est.max = Math.max(est.max, 1);
    ir(1);
  });

  // Paso 1, dias
  const cajaDias = document.getElementById('ins-dias');
  const seguir = document.createElement('button');
  seguir.className = 'btn btn-rojo ins-seguir';
  seguir.textContent = 'Continuar';
  cajaDias.after(seguir);
  function horaDe(turnos) {
    const g = est.quien || 'adultos';
    const t = turnos.find(x => x[0] === g) || turnos.find(x => x[0] === 'todos');
    return t ? t[2] : '';
  }
  function armarDias() {
    const DIAS = window.DIAS || [['Lunes', 1, []], ['Miércoles', 3, []], ['Viernes', 5, []], ['Sábado', 6, []], ['Domingo', 0, []]];
    cajaDias.innerHTML = DIAS.map(([n, , ts]) => {
      const h = horaDe(ts);
      return `<button class="ins-dia${est.dias.has(n) ? ' elegida' : ''}" data-d="${n}"><b>${n.slice(0, 3)}</b><small>${h || 'Libre'}</small><i class="ins-marca"></i></button>`;
    }).join('');
    seguir.disabled = !est.dias.size;
  }
  cajaDias.addEventListener('click', e => {
    const b = e.target.closest('.ins-dia');
    if (!b) return;
    const d = b.dataset.d;
    if (est.dias.has(d)) { est.dias.delete(d); b.classList.remove('elegida'); nota(520, 0, .1, .05, 'triangle'); }
    else { est.dias.add(d); b.classList.add('elegida'); toque(); confetiDe(b, 8, .35); }
    seguir.disabled = !est.dias.size;
    seguir.classList.toggle('listo', est.dias.size > 0);
    resumen();
  });
  seguir.addEventListener('click', () => { if (!est.dias.size) return; subir(); ir(2); });

  // Paso 2, meta
  $$('.ins-meta .opcion').forEach(o => o.addEventListener('click', () => {
    est.meta = o.dataset.v;
    $$('.ins-meta .opcion').forEach(x => x.classList.toggle('elegida', x === o));
    subir(); confetiDe(o, 14, .45);
    setTimeout(() => ir(3), 450);
  }));

  // Paso 3, datos
  const inNombre = document.getElementById('ins-nombre');
  const inEdad = document.getElementById('ins-edad');
  const inTel = document.getElementById('ins-tel');
  inEdad.addEventListener('input', () => { inEdad.value = inEdad.value.replace(/\D/g, '').slice(0, 2); });
  inTel.addEventListener('input', () => { inTel.value = inTel.value.replace(/[^\d ]/g, '').slice(0, 12); });
  [inNombre, inEdad, inTel].forEach(i => i.addEventListener('input', () => i.classList.remove('mal')));
  [inNombre, inEdad, inTel].forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('ins-listo').click(); }));
  function marcar(i) { i.classList.remove('mal'); void i.offsetWidth; i.classList.add('mal'); }
  document.getElementById('ins-listo').addEventListener('click', () => {
    const nombre = inNombre.value.trim().replace(/\s+/g, ' ');
    const edad = parseInt(inEdad.value, 10);
    const tel = inTel.value.replace(/\D/g, '');
    let ok = true;
    if (nombre.length < 2) { marcar(inNombre); ok = false; }
    if (!(edad >= 3 && edad <= 99)) { marcar(inEdad); ok = false; }
    if (tel.length !== 8) { marcar(inTel); ok = false; }
    if (!ok) { nota(180, 0, .2, .08, 'square'); return; }
    est.nombre = nombre; est.edad = edad; est.tel = tel;
    ir(4);
    pintarPase().then(() => {
      campana();
      const c = document.getElementById('pase-lienzo');
      confetiDe(c, 160, 1.15);
    });
    armarWhatsApp();
  });

  // Paso 4, pase y envio
  function armarWhatsApp() {
    const g = GRUPOS[est.quien] || GRUPOS.adultos;
    const msj = `Hola, quiero preinscribir a ${est.nombre}, de ${est.edad} años, en la clase de ${g.corto} de Kempo. ` +
      `Días ${[...est.dias].join(', ')}. Su meta es ${est.meta ? est.meta.toLowerCase() : 'aprender'}. Mi teléfono es ${est.tel.slice(0, 4)} ${est.tel.slice(4)}. ` +
      `Quiero mi primera clase gratis.`;
    document.getElementById('ins-whatsapp').href = 'https://wa.me/50244879446?text=' + encodeURIComponent(msj);
  }
  document.getElementById('ins-bajar').addEventListener('click', () => {
    const c = document.getElementById('pase-lienzo');
    const nombre = (est.nombre || 'alumno').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-');
    c.toBlob(b => {
      if (!b) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'pase-ordonez-team-' + nombre + '.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }, 'image/png');
    toque();
  });
  document.getElementById('ins-otra').addEventListener('click', () => {
    est.quien = null; est.dias.clear(); est.meta = null; est.max = 0;
    inNombre.value = ''; inEdad.value = ''; inTel.value = '';
    $$('.opcion').forEach(o => o.classList.remove('elegida'));
    toque();
    ir(0);
  });

  // Dibujo del pase
  let imgLogo = null;
  function cargarLogo() {
    if (imgLogo) return Promise.resolve(imgLogo);
    return new Promise(res => {
      if (!window.pintarLogo) return res(null);
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.setAttribute('viewBox', '0 0 200 200');
      svg.setAttribute('width', '400'); svg.setAttribute('height', '400');
      window.pintarLogo(svg, true);
      const txt = new XMLSerializer().serializeToString(svg);
      const im = new Image();
      im.onload = () => { imgLogo = im; res(im); };
      im.onerror = () => res(null);
      im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(txt);
    });
  }
  function redondo(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function olas(c, x0, y0, w, h) {
    c.save();
    c.beginPath(); c.rect(x0, y0, w, h); c.clip();
    c.strokeStyle = 'rgba(232,176,74,.09)'; c.lineWidth = 1.4;
    const r = 26;
    for (let fila = 0, y = y0; y < y0 + h + r; y += r * .5, fila++) {
      for (let x = x0 + (fila % 2 ? r : 0); x < x0 + w + r; x += r * 2) {
        for (let k = 1; k <= 3; k++) { c.beginPath(); c.arc(x, y, r * k / 3, Math.PI, 0); c.stroke(); }
      }
    }
    c.restore();
  }
  function ajustarTexto(c, t, max, tam, peso, familia) {
    let s = tam;
    do { c.font = `${peso} ${s}px ${familia}`; s -= 2; } while (c.measureText(t).width > max && s > 20);
  }
  async function pintarPase() {
    const c = document.getElementById('pase-lienzo');
    const W = 720, H = 420, D = 2;
    c.width = W * D; c.height = H * D;
    const x = c.getContext('2d');
    x.setTransform(D, 0, 0, D, 0, 0);
    try { await Promise.all([document.fonts.load('900 60px "Big Shoulders Display"'), document.fonts.load('600 16px Barlow'), document.fonts.load('40px "Yuji Syuku"', '龍')]); } catch (e) {}
    const logo = await cargarLogo();
    const g = GRUPOS[est.quien] || GRUPOS.adultos;
    const DISP = '"Big Shoulders Display", "Arial Narrow", sans-serif', TXT = 'Barlow, system-ui, sans-serif';

    // fondo
    redondo(x, 0, 0, W, H, 26); x.save(); x.clip();
    const fondo = x.createRadialGradient(W * .78, H * .1, 20, W * .6, H * .5, W * .8);
    fondo.addColorStop(0, '#4a1210'); fondo.addColorStop(.45, '#1d0d0c'); fondo.addColorStop(1, '#0c0a0b');
    x.fillStyle = fondo; x.fillRect(0, 0, W, H);
    olas(x, W * .45, 0, W * .55, H);
    // sol
    const sol = x.createRadialGradient(W * .84, H * .3, 0, W * .84, H * .3, 120);
    sol.addColorStop(0, 'rgba(255,90,54,.55)'); sol.addColorStop(.7, 'rgba(215,38,30,.18)'); sol.addColorStop(1, 'rgba(215,38,30,0)');
    x.fillStyle = sol; x.fillRect(0, 0, W, H);
    // dragon de fondo
    if (window.Dragon) {
      const dr = new window.Dragon({ n: 44, sep: 13, ancho: 24, estilo: 'oro' });
      dr.colocar(W + 80, H * .62, Math.PI);
      for (let i = 0; i <= 260; i++) {
        const u = i / 260;
        dr.mover(W + 60 - u * 640, H * .6 + Math.sin(u * Math.PI * 2.4) * 70 - u * 40, 0, .016);
      }
      dr.t = 1.3;
      x.save(); x.globalAlpha = .2; dr.dibujar(x, { brillo: false }); x.restore();
    }
    x.restore();

    // bordes de oro
    const oro = x.createLinearGradient(0, 0, W, H);
    oro.addColorStop(0, '#ffe29a'); oro.addColorStop(.5, '#e8b04a'); oro.addColorStop(1, '#a86d1c');
    redondo(x, 3, 3, W - 6, H - 6, 24); x.strokeStyle = oro; x.lineWidth = 4; x.stroke();
    redondo(x, 14, 14, W - 28, H - 28, 16); x.strokeStyle = 'rgba(232,176,74,.45)'; x.lineWidth = 1.2; x.stroke();

    // logo
    if (logo) x.drawImage(logo, 36, 36, 118, 118);
    x.fillStyle = '#e8b04a'; x.font = `700 12px ${TXT}`;
    if ('letterSpacing' in x) x.letterSpacing = '4px';
    x.fillText('PASE DE ALUMNO', 176, 62);
    x.fillStyle = 'rgba(243,236,224,.55)'; x.font = `600 12px ${TXT}`;
    const folio = 'N ' + String(1000 + Math.floor(Math.random() * 8999));
    x.fillText(folio, 176, 82);
    if ('letterSpacing' in x) x.letterSpacing = '0px';

    // nombre
    x.fillStyle = '#f3ece0';
    ajustarTexto(x, est.nombre.toUpperCase(), 360, 66, 900, DISP);
    x.fillText(est.nombre.toUpperCase(), 174, 140);
    x.fillStyle = '#ffd27a'; x.font = `800 24px ${DISP}`;
    if ('letterSpacing' in x) x.letterSpacing = '2px';
    x.fillText(`${g.corto.toUpperCase()}   ${est.edad} AÑOS`, 176, 172);
    if ('letterSpacing' in x) x.letterSpacing = '0px';

    // dias
    x.fillStyle = 'rgba(243,236,224,.55)'; x.font = `700 11px ${TXT}`;
    if ('letterSpacing' in x) x.letterSpacing = '3px';
    x.fillText('DÍAS', 40, 214);
    x.fillText('META', 40, 278);
    if ('letterSpacing' in x) x.letterSpacing = '0px';
    let dx = 40;
    const dias = (window.DIAS || []).map(d => d[0]).filter(d => est.dias.has(d));
    (dias.length ? dias : [...est.dias]).forEach(d => {
      const t = d.slice(0, 3).toUpperCase();
      x.font = `800 18px ${DISP}`;
      const w = x.measureText(t).width + 26;
      redondo(x, dx, 224, w, 30, 15); x.fillStyle = '#d7261e'; x.fill();
      x.fillStyle = '#fff'; x.fillText(t, dx + 13, 245);
      dx += w + 8;
    });
    x.fillStyle = '#f3ece0'; x.font = `800 26px ${DISP}`;
    x.fillText((est.meta || 'Aprender Kempo').toUpperCase(), 40, 310);

    // cinturon blanco del primer dia
    const by = 338;
    x.save();
    x.shadowColor = 'rgba(0,0,0,.6)'; x.shadowBlur = 10; x.shadowOffsetY = 4;
    x.fillStyle = '#f3ece0'; x.fillRect(40, by, 390, 16);
    x.restore();
    x.fillStyle = 'rgba(0,0,0,.12)'; x.fillRect(40, by + 11, 390, 2);
    x.fillStyle = '#f3ece0';
    x.beginPath(); x.moveTo(222, by + 14); x.lineTo(204, by + 46); x.lineTo(216, by + 46); x.lineTo(232, by + 20); x.fill();
    x.beginPath(); x.moveTo(248, by + 14); x.lineTo(266, by + 46); x.lineTo(254, by + 46); x.lineTo(238, by + 20); x.fill();
    redondo(x, 220, by - 5, 30, 26, 6); x.fill();
    x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 1.2; x.stroke();
    x.fillStyle = 'rgba(243,236,224,.6)'; x.font = `600 12px ${TXT}`;
    x.fillText('Cinturón blanco, tu primer día', 40, by + 66);

    // sello de primera clase gratis
    x.save();
    x.translate(612, 104); x.rotate(-.24);
    x.strokeStyle = '#ffd27a'; x.lineWidth = 3; x.setLineDash([7, 5]);
    x.beginPath(); x.arc(0, 0, 62, 0, Math.PI * 2); x.stroke();
    x.setLineDash([]); x.lineWidth = 1.4;
    x.beginPath(); x.arc(0, 0, 52, 0, Math.PI * 2); x.stroke();
    x.fillStyle = '#ffd27a'; x.textAlign = 'center';
    x.font = `800 15px ${DISP}`; x.fillText('PRIMERA', 0, -14);
    x.font = `900 34px ${DISP}`; x.fillText('CLASE', 0, 16);
    x.font = `800 15px ${DISP}`; x.fillText('GRATIS', 0, 36);
    x.restore();

    // sello del dragon, estilo hanko
    x.save();
    x.translate(612, 300); x.rotate(.06);
    redondo(x, -54, -54, 108, 108, 12);
    x.fillStyle = '#c21d16'; x.fill();
    x.strokeStyle = 'rgba(255,255,255,.25)'; x.lineWidth = 2; redondo(x, -46, -46, 92, 92, 8); x.stroke();
    x.fillStyle = '#f3ece0'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = `76px "Yuji Syuku", "Yu Mincho", serif`;
    x.fillText('龍', 0, 2);
    // desgaste del sello
    x.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 60; i++) { x.beginPath(); x.arc((Math.random() - .5) * 108, (Math.random() - .5) * 108, Math.random() * 2.2, 0, Math.PI * 2); x.fill(); }
    x.restore();

    // pie
    x.textAlign = 'left'; x.textBaseline = 'alphabetic';
    x.fillStyle = '#e8b04a'; x.font = `800 15px ${DISP}`;
    if ('letterSpacing' in x) x.letterSpacing = '3px';
    x.fillText('ORDÓÑEZ TEAM ELEMENT KARATE', 40, 400);
    x.fillStyle = 'rgba(243,236,224,.55)'; x.font = `600 12px ${TXT}`;
    if ('letterSpacing' in x) x.letterSpacing = '2px';
    x.textAlign = 'right';
    x.fillText('SAN JOSÉ PINULA, GUATEMALA', W - 40, 400);
    if ('letterSpacing' in x) x.letterSpacing = '0px';
    x.textAlign = 'left';
    // brillo que cruza
    const b = x.createLinearGradient(0, 0, W, H);
    b.addColorStop(.3, 'rgba(255,255,255,0)'); b.addColorStop(.5, 'rgba(255,255,255,.06)'); b.addColorStop(.7, 'rgba(255,255,255,0)');
    redondo(x, 0, 0, W, H, 26); x.fillStyle = b; x.fill();
  }

  // Figuras de las opciones
  const minis = $$('canvas[data-mini]').map((cv, i) => {
    const grupo = cv.dataset.mini;
    const G = GRUPOS[grupo];
    const anim = new Figura.Animador('guardia');
    return { cv, grupo, G, anim, ctx: cv.getContext('2d'), i, sig: .4 + i * .5 };
  });
  let visible = false, rafVivo = false, ult = 0;
  function cuadro(ahora) {
    if (!visible) { rafVivo = false; return; }
    const dt = Math.min(.05, ult ? (ahora - ult) / 1000 : .016);
    ult = ahora;
    const t = ahora / 1000;
    if (est.paso === 0) {
      for (const m of minis) {
        const { w, h, d } = Figura.ajustar(m.cv);
        const c = m.ctx;
        c.setTransform(d, 0, 0, d, 0, 0);
        c.clearRect(0, 0, w, h);
        // sombra en el piso
        c.fillStyle = 'rgba(0,0,0,.35)';
        c.beginPath(); c.ellipse(w / 2, h - 10, w * .22, 6, 0, 0, Math.PI * 2); c.fill();
        const elegida = est.quien === m.grupo;
        m.sig -= dt;
        if (m.sig <= 0 && m.anim.libre()) {
          if (elegida) { m.anim.a('victoria', .3, 1.2); m.sig = 2; }
          else {
            const mov = m.G.mov[Math.floor(t * 7 + m.i) % m.G.mov.length];
            m.anim.a(mov, mov === 'guardia' ? .3 : .14, mov === 'guardia' ? .5 : .32, mov === 'guardia' ? null : 'golpe');
            m.sig = .9 + Math.random() * .8;
          }
        }
        let p = m.anim.paso(dt);
        if (m.anim.libre()) p = Figura.respira(p, t + m.i);
        const nino = m.grupo === 'ninos';
        Figura.dibujar(c, p, {
          x: w / 2 - (nino ? 4 : 8), suelo: h - 10, escala: h / (nino ? 175 : 205),
          estilo: 'gi', cinta: m.G.cinta, proporcion: nino ? PROP_NINO : null,
          tiempo: t + m.i, vincha: elegida ? '#d7261e' : null, viento: elegida ? .4 : 0
        });
      }
    }
    requestAnimationFrame(cuadro);
  }
  function encender(v) {
    visible = v;
    if (v && !rafVivo) { rafVivo = true; ult = 0; requestAnimationFrame(cuadro); }
  }
  const seccion = document.getElementById('inscripcion');
  new IntersectionObserver(es => es.forEach(e => encender(e.isIntersecting && seccion.offsetParent !== null)), { threshold: .05 }).observe(seccion);
  addEventListener('pagina', e => {
    const id = e.detail && e.detail.id;
    encender(id === 'inscripcion');
  });

  ir(0);
})();
