// Reto del Dragon. Las sombras llegan por los dos lados y se golpea a la mas cercana.
(function () {
  const cv = document.getElementById('lienzo-juego');
  if (!cv || !window.Figura) return;
  const ctx = cv.getContext('2d');
  const marco = document.getElementById('juego-marco');
  const seccion = document.getElementById('juego');
  const capa = document.getElementById('juego-capa');
  const titulo = document.getElementById('juego-titulo');
  const texto = document.getElementById('juego-texto');
  const btnEmpezar = document.getElementById('juego-empezar');
  const record = document.getElementById('juego-record');
  const btnDragon = document.getElementById('juego-dragon');
  const btnSonido = document.getElementById('juego-sonido');
  const F = window.Figura;
  const CINTAS = window.CINTAS || [['Blanco', '#f3ece0'], ['Amarillo', '#f2c230'], ['Naranja', '#f07b22'], ['Verde', '#2f9e4a'], ['Azul', '#2f6fd6'], ['Morado', '#7b3fb8'], ['Café', '#7a4a26'], ['Negro', '#141012']];
  const POR_CINTA = 10;
  const GOLPES = ['directo', 'cruzado', 'cuchillo', 'frontal', 'circular', 'codo', 'rodilla', 'voladora'];
  const FUENTE = '"Big Shoulders Display", Impact, "Arial Narrow", sans-serif';

  let W = 0, H = 0, D = 1, esc = 1, suelo = 0, cx = 0, alcance = 0, contacto = 0;
  let fondo = null, montes = null, vineta = null;

  // Estado
  let modo = 'menu';
  let enemigos = [], parts = [], textos = [], anillos = [], petalos = [];
  let puntos = 0, combo = 0, mejorCombo = 0, kos = 0, ki = 0, vidas = 5, cinta = 0;
  let espera = 0, sacudida = 0, pausaGolpe = 0, lento = 0, flash = 0, invul = 0, bloqueo = 0;
  let banner = null, dragon = null, comboPop = 0, reloj = 0;
  const jugador = { anim: new F.Animador('guardia'), mira: 1, desp: 0, despMeta: 0, quieto: 0, fantasmas: [] };

  function leerRecord() { try { return +localStorage.getItem('kempo-record') || 0; } catch (e) { return 0; } }
  function guardarRecord(v) { try { localStorage.setItem('kempo-record', String(v)); } catch (e) {} }
  function pintarRecord() { const r = leerRecord(); record.textContent = r ? 'Tu mejor marca ' + r + ' puntos' : ''; }
  pintarRecord();

  // ---------- Sonido ----------
  let ac = null, maestro = null, ruido = null, mudo = false, taikoT = 0, taikoPaso = 0;
  try { mudo = localStorage.getItem('kempo-mudo') === '1'; } catch (e) {}
  btnSonido.classList.toggle('mudo', mudo);
  function audio() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      maestro = ac.createGain(); maestro.gain.value = mudo ? 0 : .55; maestro.connect(ac.destination);
      const n = ac.sampleRate;
      ruido = ac.createBuffer(1, n, n);
      const d = ruido.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ac = null; }
  }
  function env(g, t, a, v, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
  function tono(tipo, f1, f2, dur, vol, cuando) {
    if (!ac || mudo) return;
    const t = cuando || ac.currentTime;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    env(g, t, .005, vol, dur);
    o.connect(g); g.connect(maestro); o.start(t); o.stop(t + dur + .05);
  }
  function soplo(f1, f2, dur, vol, q, cuando) {
    if (!ac || mudo) return;
    const t = cuando || ac.currentTime;
    const s = ac.createBufferSource(); s.buffer = ruido;
    const b = ac.createBiquadFilter(); b.type = 'bandpass'; b.Q.value = q || 1.2;
    b.frequency.setValueAtTime(f1, t); b.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = ac.createGain(); env(g, t, .01, vol, dur);
    s.connect(b); b.connect(g); g.connect(maestro); s.start(t, Math.random() * .5); s.stop(t + dur + .05);
  }
  const SON = {
    golpe(ko) { tono('sine', ko ? 170 : 150, 45, ko ? .22 : .13, ko ? .9 : .65); soplo(2400, 900, .07, ko ? .5 : .35, .8); },
    aire() { soplo(500, 2600, .16, .22, 1.4); },
    dano() { tono('square', 220, 70, .28, .18); tono('sine', 90, 40, .3, .6); },
    gong() {
      if (!ac || mudo) return;
      [[110, .5], [221, .3], [331, .18], [523, .1], [742, .06]].forEach(([f, v]) => {
        const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sine'; o.frequency.value = f; env(g, t, .01, v, 2.8); o.connect(g); g.connect(maestro); o.start(t); o.stop(t + 3);
      });
    },
    rugido() {
      if (!ac || mudo) return;
      const t = ac.currentTime;
      const o = ac.createOscillator(), lp = ac.createBiquadFilter(), g = ac.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(95, t); o.frequency.linearRampToValueAtTime(140, t + .3); o.frequency.exponentialRampToValueAtTime(48, t + 1.4);
      lp.type = 'lowpass'; lp.frequency.value = 700;
      env(g, t, .08, .5, 1.4);
      o.connect(lp); lp.connect(g); g.connect(maestro); o.start(t); o.stop(t + 1.6);
      soplo(300, 1200, 1.2, .35, .6);
    },
    tambor(fuerte, cuando) { tono('sine', fuerte ? 95 : 120, 38, fuerte ? .32 : .18, fuerte ? .42 : .2, cuando); if (fuerte) soplo(180, 90, .1, .12, .7, cuando); }
  };
  function taiko(dt) {
    if (!ac || mudo || modo !== 'jugando') return;
    const pasoDur = .26 - Math.min(.07, cinta * .009);
    taikoT -= dt;
    if (taikoT <= 0) {
      const patron = [2, 0, 1, 0, 2, 1, 0, 1];
      const v = patron[taikoPaso % 8];
      if (v) SON.tambor(v === 2);
      taikoPaso++;
      taikoT += pasoDur;
    }
  }
  btnSonido.addEventListener('click', () => {
    mudo = !mudo;
    btnSonido.classList.toggle('mudo', mudo);
    try { localStorage.setItem('kempo-mudo', mudo ? '1' : '0'); } catch (e) {}
    audio();
    if (maestro) maestro.gain.value = mudo ? 0 : .55;
  });

  // ---------- Tamano y fondo ----------
  function medir() {
    const m = F.ajustar(cv);
    if (m.w === W && m.h === H && fondo) return;
    W = m.w; H = m.h; D = m.d;
    if (W < 10 || H < 10) return;
    esc = Math.min(H * .30 / 175, W * .55 / 175);
    suelo = H * .80;
    cx = W / 2;
    alcance = 132 * esc;
    contacto = 52 * esc;
    pintarFondo();
    if (!petalos.length) for (let i = 0; i < 26; i++) petalos.push(nuevoPetalo(true));
  }

  function lienzo(w, h) { const c = document.createElement('canvas'); c.width = Math.round(w * D); c.height = Math.round(h * D); const x = c.getContext('2d'); x.setTransform(D, 0, 0, D, 0, 0); return [c, x]; }
  function cordillera(x, base, pico, ancho, sem) {
    // perfil de volcan con un poco de irregularidad
    const pts = [];
    const n = 24;
    for (let i = 0; i <= n; i++) {
      const u = i / n * 2 - 1;
      const k = Math.pow(1 - Math.abs(u), 1.55);
      const crater = Math.abs(u) < .06 ? -pico * .025 : 0;
      const ruido = Math.sin(i * 2.3 + sem) * pico * .015;
      pts.push([x + u * ancho, base - pico * k - crater + ruido]);
    }
    return pts;
  }
  function pintarFondo() {
    let x;
    [fondo, x] = lienzo(W, H);
    const cielo = x.createLinearGradient(0, 0, 0, suelo);
    cielo.addColorStop(0, '#1c0710'); cielo.addColorStop(.45, '#7a1a18'); cielo.addColorStop(.78, '#e0592a'); cielo.addColorStop(1, '#ffb259');
    x.fillStyle = cielo; x.fillRect(0, 0, W, suelo + 2);
    // estrellas arriba
    for (let i = 0; i < 60; i++) {
      x.globalAlpha = Math.random() * .5;
      x.fillStyle = '#fff'; x.fillRect(Math.random() * W, Math.random() * H * .3, 1.2, 1.2);
    }
    x.globalAlpha = 1;
    // sol
    const sy = suelo - H * .2, sr = Math.min(W, H) * .2;
    const halo = x.createRadialGradient(cx, sy, sr * .5, cx, sy, sr * 2.6);
    halo.addColorStop(0, 'rgba(255,190,90,.55)'); halo.addColorStop(1, 'rgba(255,120,40,0)');
    x.fillStyle = halo; x.fillRect(0, 0, W, suelo);
    const sol = x.createLinearGradient(0, sy - sr, 0, sy + sr);
    sol.addColorStop(0, '#fff1b8'); sol.addColorStop(.5, '#ffc05a'); sol.addColorStop(1, '#ff5a2a');
    x.beginPath(); x.arc(cx, sy, sr, 0, Math.PI * 2); x.fillStyle = sol; x.fill();
    // brillo suave del sol, sin franjas
    const brilloSol = x.createRadialGradient(cx - sr * .3, sy - sr * .35, 0, cx, sy, sr);
    brilloSol.addColorStop(0, 'rgba(255,255,235,.55)'); brilloSol.addColorStop(.6, 'rgba(255,240,200,0)');
    x.beginPath(); x.arc(cx, sy, sr, 0, Math.PI * 2); x.fillStyle = brilloSol; x.fill();
    // nubes largas
    x.fillStyle = 'rgba(60,10,20,.35)';
    for (let i = 0; i < 5; i++) {
      const yy = H * (.18 + i * .07), xx = (i * 0.37 % 1) * W;
      x.beginPath(); x.ellipse(xx, yy, W * .28, 4 + i, 0, 0, Math.PI * 2); x.fill();
    }
    // volcanes lejanos
    const capas = [
      ['rgba(120,30,34,.55)', [[W * .18, H * .30, W * .30], [W * .86, H * .26, W * .26]]],
      ['#4a1419', [[W * .02, H * .36, W * .28], [W * .64, H * .2, W * .2], [W * 1.02, H * .22, W * .22]]]
    ];
    capas.forEach(([c, vs]) => {
      x.fillStyle = c;
      vs.forEach(([vx, pico, an], k) => {
        const p = cordillera(vx, suelo + 2, pico, an, k * 3.1);
        x.beginPath(); x.moveTo(p[0][0], suelo + 2); p.forEach(q => x.lineTo(q[0], q[1])); x.lineTo(p[p.length - 1][0], suelo + 2); x.fill();
      });
    });
    // piso del dojo, tablas de madera con perspectiva
    const piso = x.createLinearGradient(0, suelo, 0, H);
    piso.addColorStop(0, '#6b3a1f'); piso.addColorStop(.35, '#4a2614'); piso.addColorStop(1, '#1d0e08');
    x.fillStyle = piso; x.fillRect(0, suelo, W, H - suelo);
    const luz = x.createRadialGradient(cx, suelo, 10, cx, suelo, W * .55);
    luz.addColorStop(0, 'rgba(255,170,80,.45)'); luz.addColorStop(1, 'rgba(255,120,40,0)');
    x.fillStyle = luz; x.fillRect(0, suelo, W, H - suelo);
    x.strokeStyle = 'rgba(20,8,4,.55)'; x.lineWidth = 1.2;
    const fuga = [cx, suelo - H * .5];
    for (let i = -16; i <= 16; i++) {
      const bx = cx + i * W * .075;
      const k = (H - fuga[1]) / (suelo - fuga[1]);
      x.beginPath(); x.moveTo(fuga[0] + (bx - fuga[0]) / k * 1, suelo); x.lineTo(bx, H); x.stroke();
    }
    for (let i = 1; i < 7; i++) {
      const yy = suelo + (H - suelo) * Math.pow(i / 7, 1.7);
      x.globalAlpha = .5; x.beginPath(); x.moveTo(0, yy); x.lineTo(W, yy); x.stroke();
    }
    x.globalAlpha = 1;
    x.fillStyle = 'rgba(255,210,140,.18)'; x.fillRect(0, suelo, W, 1.5);

    // volcan cercano, con parallax
    let m;
    [montes, m] = lienzo(W * 1.2, H);
    m.fillStyle = '#2a0c10';
    const p1 = cordillera(W * .2, suelo + 2, H * .3, W * .26, 1);
    const p2 = cordillera(W * 1.0, suelo + 2, H * .25, W * .24, 2);
    [p1, p2].forEach(p => { m.beginPath(); m.moveTo(p[0][0], suelo + 2); p.forEach(q => m.lineTo(q[0], q[1])); m.lineTo(p[p.length - 1][0], suelo + 2); m.fill(); });
    // borde iluminado
    m.strokeStyle = 'rgba(255,140,60,.35)'; m.lineWidth = 1.5;
    [p1, p2].forEach(p => { m.beginPath(); p.forEach((q, i) => i ? m.lineTo(q[0], q[1]) : m.moveTo(q[0], q[1])); m.stroke(); });
  }
  const crater = () => [W * .2 + parallaxX() * .4 - W * .1, suelo + 2 - H * .3];
  let camX = 0;
  function parallaxX() { return -camX; }

  // ---------- Petalos de plumeria ----------
  function nuevoPetalo(cualquiera) {
    return { x: cualquiera ? Math.random() * W : W + 20, y: Math.random() * H * .85, r: 3 + Math.random() * 4, g: Math.random() * 6, vg: (Math.random() - .5) * 2, v: 18 + Math.random() * 30, f: Math.random() * 6 };
  }
  function petalo(p) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.g);
    for (let i = 0; i < 5; i++) {
      ctx.rotate(Math.PI * 2 / 5);
      ctx.beginPath(); ctx.ellipse(p.r * .9, 0, p.r, p.r * .48, .3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,248,236,.85)'; ctx.fill();
    }
    ctx.beginPath(); ctx.arc(0, 0, p.r * .45, 0, Math.PI * 2); ctx.fillStyle = '#f7c948'; ctx.fill();
    ctx.restore();
  }

  // ---------- Enemigos ----------
  const TIPOS = {
    sombra: { vida: 1, vel: 72, esc: 1, color: '#0d0a0c', cinta: '#d7261e', pts: 100 },
    veloz:  { vida: 1, vel: 150, esc: .9, color: '#160b10', cinta: '#ff8a1e', pts: 150 },
    doble:  { vida: 2, vel: 84, esc: 1, color: '#120b1c', cinta: '#9b5cff', pts: 200 },
    grande: { vida: 3, vel: 52, esc: 1.28, color: '#08070a', cinta: '#e8b04a', pts: 300 }
  };
  function nivel() { return cinta + Math.floor(Math.max(0, kos - POR_CINTA * (CINTAS.length - 1)) / POR_CINTA); }
  function crearEnemigo(tipo, lado) {
    const T = TIPOS[tipo];
    const e = {
      tipo, T, lado, vida: T.vida, x: cx + lado * (W / 2 + 60 * esc), y: 0, vx: 0, vy: 0, giro: 0, vgiro: 0,
      estado: 'camina', fase: Math.random() * 6, t: 0, ataqueT: 0, aturdido: 0, blanco: 0, alfa: 1,
      anim: new F.Animador('guardia'), saltoT: 0, x0: 0, x1: 0
    };
    enemigos.push(e);
    return e;
  }
  function elegirTipo() {
    const n = nivel();
    const r = Math.random();
    if (n >= 3 && r < .14) return 'grande';
    if (n >= 2 && r < .34) return 'doble';
    if (n >= 1 && r < .55) return 'veloz';
    return 'sombra';
  }
  function velocidad(e) { return e.T.vel * esc * (1 + nivel() * .07) * (modo === 'menu' ? .7 : 1); }

  // ---------- Particulas ----------
  function tinta(x, y, dir, n, color) {
    for (let i = 0; i < n; i++) {
      const a = (dir > 0 ? 0 : Math.PI) + (Math.random() - .5) * 1.8;
      const v = (120 + Math.random() * 380) * esc;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120 * esc, r: (2 + Math.random() * 5) * esc, vida: .5 + Math.random() * .5, t: 0, c: color || (Math.random() < .55 ? '#0b0809' : '#b0161a'), tipo: 'gota' });
    }
  }
  function chispas(x, y, n, color) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = (200 + Math.random() * 500) * esc;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 1.5, vida: .25 + Math.random() * .25, t: 0, c: color || '#ffd27a', tipo: 'chispa' });
    }
  }
  function anillo(x, y, color, max) { anillos.push({ x, y, t: 0, c: color || '#fff', max: (max || 70) * esc }); }
  function flotar(x, y, txt, color, tam) { textos.push({ x, y, txt, c: color || '#fff', tam: (tam || 28) * Math.max(.7, esc), t: 0 }); }

  // ---------- Acciones ----------
  function atacar(lado) {
    if (modo === 'fin' || bloqueo > 0) return;
    if (jugador.anim.hacia === F.POSES.golpeado && invul > .6) return;
    jugador.mira = lado;
    // la sombra mas cercana de ese lado dentro del alcance
    let mejor = null, md = 1e9;
    for (const e of enemigos) {
      if (e.estado !== 'camina' && e.estado !== 'ataca') continue;
      if (Math.sign(e.x - cx) !== lado) continue;
      const d = Math.abs(e.x - cx);
      if (d <= alcance && d < md) { md = d; mejor = e; }
    }
    const pose = GOLPES[(Math.random() * GOLPES.length) | 0];
    jugador.anim.ya(pose, .07, .06, 'golpe');
    jugador.quieto = .3;
    if (modo === 'jugando') SON.aire();
    if (!mejor) {
      // al aire
      jugador.despMeta = lado * 22 * esc;
      if (modo === 'jugando') {
        combo = 0;
        bloqueo = .38;
        flotar(cx + lado * 70 * esc, suelo - 150 * esc, 'AL AIRE', '#9a8f86', 26);
      }
      return;
    }
    jugador.fantasmas.push({ x: cx + jugador.desp, pose: jugador.anim.actual, mira: lado, t: 0 });
    jugador.despMeta = (mejor.x - lado * 50 * esc * mejor.T.esc) - cx;
    golpear(mejor, lado, pose);
  }

  const vibrar = (ms) => { try { if (navigator.vibrate && modo === 'jugando') navigator.vibrate(ms); } catch (er) {} };
  function golpear(e, lado, pose) {
    vibrar(e.vida <= 1 ? 22 : 12);
    e.vida--;
    e.blanco = .08;
    combo++;
    mejorCombo = Math.max(mejorCombo, combo);
    comboPop = 1;
    if (modo === 'jugando') ki = Math.min(100, ki + 7);
    const hy = suelo - (pose === 'circular' || pose === 'voladora' ? 150 : pose === 'frontal' || pose === 'rodilla' ? 95 : 125) * esc * e.T.esc;
    tinta(e.x, hy, lado, e.vida <= 0 ? 22 : 10);
    chispas(e.x, hy, e.vida <= 0 ? 14 : 7);
    anillo(e.x, hy, e.vida <= 0 ? '#ffd27a' : '#fff', e.vida <= 0 ? 90 : 60);
    if (modo === 'jugando') SON.golpe(e.vida <= 0);
    pausaGolpe = e.vida <= 0 ? .085 : .045;
    sacudida = Math.max(sacudida, e.vida <= 0 ? 9 : 5);
    if (e.vida <= 0) {
      noquear(e, lado);
      if (modo === 'jugando') {
        const p = Math.round(e.T.pts * (1 + Math.floor(combo / 10) * .5));
        puntos += p;
        flotar(e.x, hy - 30 * esc, '+' + p, '#ffd27a', 30);
        if (combo > 0 && combo % 10 === 0) { flotar(cx, suelo - 230 * esc, combo + ' COMBO', '#ff4a2e', 46); SON.tambor(true); }
      }
    } else {
      if (modo === 'jugando') { puntos += 25; flotar(e.x, hy - 30 * esc, '+25', '#fff', 22); }
      e.anim.ya('golpeado', .05, .12);
      if (e.tipo === 'doble') {
        // salta por encima al otro lado
        e.estado = 'salta'; e.saltoT = 0; e.x0 = e.x; e.lado = -e.lado; e.x1 = cx + e.lado * alcance * .95;
        e.anim.ya('voladora', .15, .3);
      } else {
        e.estado = 'camina';
        e.x += lado * 36 * esc;
        e.aturdido = .32;
        e.ataqueT = 0;
      }
    }
  }

  function noquear(e, lado) {
    e.estado = 'muerto';
    e.vx = lado * (520 + Math.random() * 300) * esc;
    e.vy = -(380 + Math.random() * 260) * esc;
    e.vgiro = lado * (6 + Math.random() * 6);
    e.anim.ya('golpeado', .05, 9);
    if (modo === 'jugando') {
      kos++;
      if (kos % POR_CINTA === 0 && cinta < CINTAS.length - 1) subirCinta();
    }
  }

  function subirCinta() {
    cinta++;
    banner = { t: 0, nombre: CINTAS[cinta][0], color: CINTAS[cinta][1] };
    lento = 1.1;
    SON.gong();
    jugador.anim.ya('victoria', .2, .5);
    for (let i = 0; i < 40; i++) chispas(cx, suelo - 120 * esc, 1, i % 2 ? CINTAS[cinta][1] : '#ffd27a');
  }

  function recibir(e) {
    if (invul > 0 || modo === 'fin') return;
    if (modo === 'menu') return;
    vibrar([60, 40, 60]);
    vidas--;
    combo = 0;
    invul = 1.1;
    flash = .45;
    sacudida = 14;
    SON.dano();
    jugador.anim.ya('golpeado', .05, .25);
    jugador.mira = Math.sign(e.x - cx) || 1;
    tinta(cx, suelo - 120 * esc, -jugador.mira, 14, '#b0161a');
    flotar(cx, suelo - 210 * esc, 'CUIDADO', '#ff4a2e', 34);
    e.x = cx + Math.sign(e.x - cx) * alcance * 1.25;
    e.estado = 'camina'; e.ataqueT = 0; e.aturdido = .4;
    if (vidas <= 0) terminar();
  }

  function soltarDragon() {
    if (modo !== 'jugando' || ki < 100 || dragon) return;
    ki = 0;
    const dir = Math.random() < .5 ? 1 : -1;
    const d = new window.Dragon({ n: 56, sep: 13 * esc, ancho: 44 * esc, estilo: 'oro' });
    const x0 = dir > 0 ? -60 : W + 60;
    d.colocar(x0, H * .48, dir > 0 ? 0 : Math.PI);
    d.boca = 1;
    dragon = { d, dir, t: 0, x: x0 };
    SON.rugido();
    sacudida = 10;
    flotar(cx, H * .36, 'DRAGÓN', '#ffd27a', 60);
  }

  // ---------- Partida ----------
  function reiniciar(demo) {
    enemigos = []; parts = []; textos = []; anillos = [];
    puntos = 0; combo = 0; mejorCombo = 0; kos = 0; ki = 0; vidas = 5; cinta = 0;
    espera = demo ? .4 : 1.2; sacudida = 0; pausaGolpe = 0; lento = 0; flash = 0; invul = 0; bloqueo = 0;
    banner = null; dragon = null;
    jugador.anim = new F.Animador('guardia'); jugador.desp = 0; jugador.despMeta = 0; jugador.mira = 1; jugador.fantasmas = [];
  }
  function empezar() {
    audio();
    reiniciar(false);
    modo = 'jugando';
    capa.classList.add('oculta');
    marco.classList.add('jugando');
    btnDragon.classList.add('visible');
    btnDragon.classList.remove('listo');
    taikoT = 0; taikoPaso = 0;
    try { marco.focus({ preventScroll: true }); } catch (e) {}
  }
  function terminar() {
    modo = 'fin';
    marco.classList.remove('jugando');
    btnDragon.classList.remove('visible', 'listo');
    const r = leerRecord();
    const nuevo = puntos > r;
    if (nuevo) guardarRecord(puntos);
    setTimeout(() => {
      titulo.textContent = nuevo ? 'Nueva marca' : (puntos ? 'Fin del reto' : 'Te ganaron las sombras');
      if (!puntos) texto.textContent = 'Golpea cuando la sombra esté cerca, ni antes ni después. En el dojo te enseñamos de verdad.';
      else texto.textContent = 'Llegaste a cinturón ' + CINTAS[cinta][0].toLowerCase() + ' con ' + puntos + ' puntos' + (mejorCombo > 1 ? ' y un combo de ' + mejorCombo + '.' : '.') + (cinta < CINTAS.length - 1 ? ' El negro te espera en el dojo.' : ' Eres cinturón negro, ahora ven por el de verdad.');
      btnEmpezar.textContent = 'Jugar otra vez';
      capa.classList.add('con-clase');
      pintarRecord();
      capa.classList.remove('oculta');
      modo = 'menu';
      reiniciar(true);
    }, 1300);
  }
  btnEmpezar.addEventListener('click', empezar);
  btnDragon.addEventListener('click', (e) => { e.stopPropagation(); soltarDragon(); });

  // ---------- Controles ----------
  addEventListener('keydown', (e) => {
    if (!activo()) return;
    if (modo !== 'jugando') {
      if ((e.code === 'Enter') && !capa.classList.contains('oculta') && document.activeElement === btnEmpezar) return;
      return;
    }
    const k = e.code;
    if (k === 'ArrowLeft' || k === 'KeyA' || k === 'KeyJ') { e.preventDefault(); if (!e.repeat) atacar(-1); }
    else if (k === 'ArrowRight' || k === 'KeyD' || k === 'KeyL') { e.preventDefault(); if (!e.repeat) atacar(1); }
    else if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW') { e.preventDefault(); soltarDragon(); }
    else if (k === 'ArrowDown') e.preventDefault();
  });
  cv.addEventListener('pointerdown', (e) => {
    if (modo !== 'jugando') return;
    e.preventDefault();
    const r = cv.getBoundingClientRect();
    atacar(e.clientX - r.left < r.width / 2 ? -1 : 1);
  });

  // Solo en la PC de desarrollo, para que las pruebas vean el estado del juego
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
    window.__juego = () => ({ modo, cx, alcance, ki, kos, cinta, vidas, puntos, enemigos: enemigos.map(e => ({ x: e.x, estado: e.estado })) });
  }

  // ---------- Bucle ----------
  let enPantalla = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => { enPantalla = es[0].isIntersecting; arrancar(); }, { threshold: .05 }).observe(marco);
  }
  function activo() { return seccion && document.body.dataset.pagina === 'juego' && enPantalla && !document.hidden; }
  let corriendo = false, ultimo = 0;
  function arrancar() {
    if (corriendo || !activo()) return;
    corriendo = true; ultimo = performance.now();
    requestAnimationFrame(cuadro);
  }
  function cuadro(ahora) {
    if (!activo()) { corriendo = false; if (ac && ac.state === 'running') ac.suspend(); return; }
    if (ac && ac.state === 'suspended' && modo === 'jugando') ac.resume();
    let dtr = Math.min(.05, (ahora - ultimo) / 1000);
    ultimo = ahora;
    medir();
    if (W > 10) { actualizar(dtr); dibujar(); }
    requestAnimationFrame(cuadro);
  }
  addEventListener('resize', () => { fondo = null; medir(); arrancar(); });
  addEventListener('pagina', (e) => {
    fondo = null;
    if (e.detail && e.detail.id !== 'juego' && modo === 'jugando') { /* se queda en pausa sola */ }
    setTimeout(() => { medir(); arrancar(); }, 30);
  });
  document.addEventListener('visibilitychange', arrancar);

  function actualizar(dtr) {
    reloj += dtr;
    // camara lenta del cinturon
    let ts = 1;
    if (lento > 0) { lento -= dtr; ts = .3; }
    if (pausaGolpe > 0) { pausaGolpe -= dtr; ts = 0.04; }
    const dt = dtr * ts;
    taiko(dtr);

    sacudida = Math.max(0, sacudida - dtr * 40);
    flash = Math.max(0, flash - dtr * 1.6);
    invul = Math.max(0, invul - dt);
    bloqueo = Math.max(0, bloqueo - dt);
    comboPop = Math.max(0, comboPop - dtr * 4);

    // jugador
    jugador.anim.paso(dt);
    jugador.quieto -= dt;
    if (jugador.quieto <= 0) jugador.despMeta *= Math.pow(.02, dt);
    jugador.desp += (jugador.despMeta - jugador.desp) * Math.min(1, dt * 26);
    camX += (jugador.desp * .25 - camX) * Math.min(1, dt * 4);
    jugador.fantasmas.forEach(f => { f.t += dtr; });
    jugador.fantasmas = jugador.fantasmas.filter(f => f.t < .18);

    // aparicion
    if (!dragon) {
      espera -= dt;
      const n = nivel();
      const vivos = enemigos.filter(e => e.estado !== 'muerto').length;
      const tope = modo === 'menu' ? 3 : Math.min(12, 4 + n);
      if (espera <= 0 && vivos < tope && !banner) {
        const lado = Math.random() < .5 ? -1 : 1;
        crearEnemigo(modo === 'menu' ? (Math.random() < .3 ? 'veloz' : 'sombra') : elegirTipo(), lado);
        const base = modo === 'menu' ? 1.5 : Math.max(.42, 1.55 - n * .14);
        espera = base * (.6 + Math.random() * .8);
      }
    }

    // enemigos
    for (const lado of [-1, 1]) {
      const fila = enemigos.filter(e => (e.estado === 'camina' || e.estado === 'ataca') && Math.sign(e.x - cx) === lado).sort((a, b) => Math.abs(a.x - cx) - Math.abs(b.x - cx));
      for (let i = 1; i < fila.length; i++) {
        const prev = fila[i - 1], e = fila[i];
        const min = Math.abs(prev.x - cx) + 40 * esc * Math.max(prev.T.esc, e.T.esc);
        if (Math.abs(e.x - cx) < min) e.x = cx + lado * min;
      }
    }
    for (const e of enemigos) {
      e.t += dt; e.blanco = Math.max(0, e.blanco - dtr);
      e.anim.paso(dt);
      const lado = Math.sign(e.x - cx) || e.lado;
      const d = Math.abs(e.x - cx);
      if (e.estado === 'camina') {
        if (e.aturdido > 0) { e.aturdido -= dt; continue; }
        if (d > contacto * e.T.esc) {
          e.x -= lado * velocidad(e) * dt;
          e.fase += dt * velocidad(e) / esc * .09;
        } else {
          e.estado = 'ataca'; e.ataqueT = 0;
          e.anim.ya('codo', .35, .1);
        }
      } else if (e.estado === 'ataca') {
        e.ataqueT += dt;
        const ventana = modo === 'menu' ? 9 : Math.max(.32, .58 - nivel() * .025);
        if (e.ataqueT >= ventana) {
          e.anim.ya('directo', .06, .15, 'golpe');
          recibir(e);
        }
      } else if (e.estado === 'salta') {
        e.saltoT += dt / .5;
        const k = Math.min(1, e.saltoT);
        e.x = e.x0 + (e.x1 - e.x0) * k;
        e.y = -Math.sin(Math.PI * k) * 170 * esc;
        e.giro = (e.x1 > e.x0 ? 1 : -1) * k * Math.PI * 2;
        if (k >= 1) { e.estado = 'camina'; e.y = 0; e.giro = 0; e.aturdido = .25; }
      } else if (e.estado === 'muerto') {
        e.vy += 1500 * esc * dt;
        e.x += e.vx * dt; e.y += e.vy * dt;
        e.giro += e.vgiro * dt;
        if (e.y > 0 && e.vy > 0) { e.y = 0; e.vy *= -.3; e.vx *= .5; e.vgiro *= .4; }
        e.alfa -= dt * .9;
      }
    }
    enemigos = enemigos.filter(e => e.alfa > 0 && e.x > -W * .6 && e.x < W * 1.6);

    // en el menu juega solo
    if (modo === 'menu') {
      for (const e of enemigos) {
        if ((e.estado === 'camina' || e.estado === 'ataca') && Math.abs(e.x - cx) < alcance * .75 && jugador.quieto <= 0) { atacar(Math.sign(e.x - cx)); break; }
      }
    }

    // dragon
    if (dragon) {
      dragon.t += dt;
      dragon.x += dragon.dir * W * .85 * dt;
      const y = H * .46 + Math.sin(dragon.t * 5) * H * .13;
      dragon.d.mover(dragon.x, y, 0, dt);
      dragon.d.boca = .6 + Math.sin(dragon.t * 12) * .4;
      const b = dragon.d.boquilla();
      for (let i = 0; i < 3; i++) {
        const a = b.ang + (Math.random() - .5) * .6, v = (300 + Math.random() * 300) * esc;
        parts.push({ x: b.x, y: b.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: (4 + Math.random() * 7) * esc, vida: .45, t: 0, c: Math.random() < .5 ? '#ffb43a' : '#ff4a2e', tipo: 'fuego' });
      }
      for (const e of enemigos) {
        if (e.estado === 'muerto') continue;
        if (Math.abs(e.x - dragon.x) < 70 * esc) {
          const lado = dragon.dir;
          tinta(e.x, suelo - 120 * esc, lado, 16);
          anillo(e.x, suelo - 120 * esc, '#ffd27a', 90);
          if (modo === 'jugando') { puntos += e.T.pts; kos++; flotar(e.x, suelo - 170 * esc, '+' + e.T.pts, '#ffd27a', 30); }
          e.estado = 'muerto';
          e.vx = lado * 700 * esc; e.vy = -700 * esc; e.vgiro = lado * 10;
          e.anim.ya('golpeado', .05, 9);
          sacudida = 8;
          if (modo === 'jugando' && kos % POR_CINTA === 0 && cinta < CINTAS.length - 1) subirCinta();
        }
      }
      const cola = dragon.d.n * dragon.d.sep;
      if ((dragon.dir > 0 && dragon.x > W + cola) || (dragon.dir < 0 && dragon.x < -cola)) dragon = null;
    }

    // particulas
    for (const p of parts) {
      p.t += dt;
      if (p.tipo === 'gota') { p.vy += 1100 * esc * dt; if (p.y > suelo + 6 * esc && p.vy > 0) { p.vy = 0; p.vx *= .2; p.y = suelo + 6 * esc; } }
      if (p.tipo === 'fuego') { p.vx *= .96; p.vy *= .96; p.vy -= 60 * dt; }
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    parts = parts.filter(p => p.t < p.vida);
    anillos.forEach(a => { a.t += dtr * 2.8; });
    anillos = anillos.filter(a => a.t < 1);
    textos.forEach(t => { t.t += dtr; t.y -= 40 * dtr; });
    textos = textos.filter(t => t.t < 1);
    if (banner) { banner.t += dtr; if (banner.t > 2.2) banner = null; }

    // petalos
    for (const p of petalos) {
      p.f += dtr;
      p.x -= p.v * dtr * (1 + (dragon ? 3 : 0));
      p.y += Math.sin(p.f * 1.3) * 12 * dtr + 8 * dtr;
      p.g += p.vg * dtr;
      if (p.x < -20 || p.y > H + 20) Object.assign(p, nuevoPetalo(false));
    }

    // boton del dragon
    if (modo === 'jugando') btnDragon.classList.toggle('listo', ki >= 100 && !dragon);
  }

  // ---------- Dibujo ----------
  function sombra(x, w) {
    ctx.beginPath(); ctx.ellipse(x, suelo + 3 * esc, w, w * .18, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,.38)'; ctx.fill();
  }
  function poseCaminar(e) {
    const p = Object.assign({}, F.POSES.guardia);
    const s = Math.sin(e.fase);
    p.m1 += s * 16; p.p1 += s * 10;
    p.m2 -= s * 16; p.p2 -= s * 6;
    p.t += Math.cos(e.fase * 2) * 2;
    p.y = Math.abs(Math.cos(e.fase)) * 3;
    return p;
  }
  function dibujarEnemigo(e) {
    const mira = Math.sign(cx - e.x) || 1;
    let p = e.anim.actual;
    if (e.estado === 'camina' && e.anim.libre() && e.aturdido <= 0) p = poseCaminar(e);
    if (e.estado !== 'muerto' && e.estado !== 'salta') sombra(e.x, 30 * esc * e.T.esc);
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, e.alfa));
    const blanco = e.blanco > 0;
    const r = F.dibujar(ctx, p, {
      x: e.x, suelo: suelo + e.y, escala: esc * e.T.esc, mira, estilo: 'silueta',
      color: blanco ? '#ffffff' : e.T.color, colorAtras: blanco ? '#e6e0d6' : '#000', cintaSilueta: e.T.cinta, cinta: e.T.cinta,
      tiempo: reloj + e.fase, viento: e.estado === 'muerto' ? 1 : .3, giro: e.giro * mira
    });
    // ojos que brillan
    if (e.estado !== 'muerto') {
      ctx.globalCompositeOperation = 'lighter';
      const ox = r.cabeza[0] + mira * 4 * esc * e.T.esc, oy = r.cabeza[1] - 1 * esc;
      const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, 10 * esc);
      g.addColorStop(0, e.estado === 'ataca' ? 'rgba(255,230,120,.95)' : 'rgba(255,60,40,.9)'); g.addColorStop(1, 'rgba(255,40,20,0)');
      ctx.fillStyle = g; ctx.fillRect(ox - 12 * esc, oy - 12 * esc, 24 * esc, 24 * esc);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#fff';
      ctx.fillRect(ox - 3 * esc, oy - .8 * esc, 6 * esc, 1.8 * esc);
    }
    ctx.restore();
    // marcas de vida y aviso de ataque
    if (e.estado === 'camina' || e.estado === 'ataca' || e.estado === 'salta') {
      const top = r.cabeza[1] - 26 * esc * e.T.esc;
      if (e.vida > 1 || e.T.vida > 1) {
        for (let i = 0; i < e.T.vida; i++) {
          const x = e.x + (i - (e.T.vida - 1) / 2) * 13 * esc;
          ctx.save(); ctx.translate(x, top); ctx.rotate(Math.PI / 4);
          ctx.fillStyle = i < e.vida ? e.T.cinta : 'rgba(255,255,255,.15)';
          ctx.fillRect(-4 * esc, -4 * esc, 8 * esc, 8 * esc);
          ctx.restore();
        }
        if (e.tipo === 'doble' && e.vida === 2) {
          ctx.fillStyle = 'rgba(255,255,255,.7)';
          ctx.font = `800 ${11 * Math.max(.8, esc)}px ${FUENTE}`; ctx.textAlign = 'center';
          ctx.fillText('SALTA', e.x, top - 10 * esc);
        }
      }
      if (e.estado === 'ataca') {
        const k = e.ataqueT * 14;
        ctx.save();
        ctx.font = `900 ${34 * Math.max(.8, esc)}px ${FUENTE}`; ctx.textAlign = 'center';
        ctx.fillStyle = Math.sin(k) > 0 ? '#ff4a2e' : '#ffd27a';
        ctx.fillText('!', e.x, top - 14 * esc);
        ctx.restore();
      }
    }
  }
  function dibujarJugador() {
    const x = cx + jugador.desp;
    sombra(x, 32 * esc);
    const col = CINTAS[cinta][1];
    for (const f of jugador.fantasmas) {
      ctx.save(); ctx.globalAlpha = (1 - f.t / .18) * .35;
      F.dibujar(ctx, f.pose, { x: f.x, suelo, escala: esc, mira: f.mira, estilo: 'silueta', color: '#ffd27a', colorAtras: '#e8b04a', cintaSilueta: col, tiempo: reloj });
      ctx.restore();
    }
    ctx.save();
    if (invul > 0 && Math.sin(invul * 40) > 0 && modo === 'jugando') ctx.globalAlpha = .45;
    let p = jugador.anim.actual;
    if (jugador.anim.libre()) p = F.respira(p, reloj, 1);
    const r = F.dibujar(ctx, p, {
      x, suelo, escala: esc, mira: jugador.mira, estilo: 'gi', cinta: col === '#f3ece0' ? '#f3ece0' : col,
      vincha: '#d7261e', tiempo: reloj, viento: Math.min(1, Math.abs(jugador.despMeta - jugador.desp) / (40 * esc) + .2)
    });
    ctx.restore();
    return r;
  }
  function dibujarHud() {
    const s = Math.max(.75, Math.min(1.25, W / 900));
    ctx.save();
    ctx.textBaseline = 'top';
    // puntos
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(243,236,224,.6)';
    ctx.font = `700 ${12 * s}px Barlow, sans-serif`;
    ctx.fillText('PUNTOS', 18 * s, 16 * s);
    ctx.fillStyle = '#fff';
    ctx.font = `900 ${40 * s}px ${FUENTE}`;
    ctx.fillText(String(puntos), 18 * s, 30 * s);
    if (combo > 1) {
      const k = 1 + comboPop * .35;
      ctx.save(); ctx.translate(18 * s, 76 * s); ctx.scale(k, k);
      ctx.fillStyle = combo >= 10 ? '#ff4a2e' : '#ffd27a';
      ctx.font = `900 ${26 * s}px ${FUENTE}`;
      ctx.fillText(combo + ' COMBO', 0, 0);
      ctx.restore();
    }
    // cinturon y avance
    ctx.textAlign = 'center';
    const [nom, col] = CINTAS[cinta];
    const bw = Math.min(220 * s, W * .4), bx = W / 2 - bw / 2, by = 18 * s;
    ctx.fillStyle = col; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1.5;
    ctx.fillRect(bx, by, bw, 12 * s); ctx.strokeRect(bx, by, bw, 12 * s);
    ctx.fillRect(W / 2 - 9 * s, by - 3 * s, 18 * s, 18 * s); ctx.strokeRect(W / 2 - 9 * s, by - 3 * s, 18 * s, 18 * s);
    ctx.fillStyle = '#fff'; ctx.font = `800 ${15 * s}px ${FUENTE}`;
    ctx.fillText('CINTURÓN ' + nom.toUpperCase(), W / 2, by + 20 * s);
    const avance = cinta >= CINTAS.length - 1 ? 1 : (kos % POR_CINTA) / POR_CINTA;
    ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(bx, by + 40 * s, bw, 4 * s);
    ctx.fillStyle = '#ffd27a'; ctx.fillRect(bx, by + 40 * s, bw * avance, 4 * s);
    // vidas, sellos rojos
    for (let i = 0; i < 5; i++) {
      const x = W / 2 + (i - 2) * 22 * s, y = by + 56 * s;
      ctx.save(); ctx.translate(x, y + 8 * s); ctx.rotate(Math.PI / 4);
      if (i < vidas) { ctx.fillStyle = '#d7261e'; ctx.fillRect(-7 * s, -7 * s, 14 * s, 14 * s); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.4; ctx.strokeRect(-3.5 * s, -3.5 * s, 7 * s, 7 * s); }
      else { ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1.5; ctx.strokeRect(-7 * s, -7 * s, 14 * s, 14 * s); }
      ctx.restore();
    }
    // ki
    const kw = Math.min(260 * s, W * .5), kx = W / 2 - kw / 2, ky = H - 74;
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(kx - 2, ky - 2, kw + 4, 12, 6) : ctx.rect(kx - 2, ky - 2, kw + 4, 12); ctx.fill();
    const g = ctx.createLinearGradient(kx, 0, kx + kw, 0);
    g.addColorStop(0, '#e8b04a'); g.addColorStop(1, '#ff4a2e');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(kx, ky, Math.max(0.1, kw * ki / 100), 8, 4) : ctx.rect(kx, ky, kw * ki / 100, 8); ctx.fill();
    ctx.fillStyle = ki >= 100 ? '#ffd27a' : 'rgba(255,255,255,.7)';
    ctx.font = `800 ${12 * s}px ${FUENTE}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText('KI', kx - 8, ky + 4);
    ctx.restore();
  }
  function dibujarBanner() {
    if (!banner) return;
    const t = banner.t;
    const a = t < .25 ? t / .25 : t > 1.8 ? Math.max(0, (2.2 - t) / .4) : 1;
    ctx.save();
    ctx.globalAlpha = a;
    const y = H * .36;
    ctx.fillStyle = 'rgba(12,10,11,.72)';
    ctx.fillRect(0, y - 56 * esc, W, 112 * esc);
    ctx.fillStyle = banner.color;
    const ancho = W * Math.min(1, t / .4);
    ctx.fillRect(W / 2 - ancho / 2, y + 38 * esc, ancho, 10 * esc);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffd27a';
    ctx.font = `800 ${16 * Math.max(.8, esc)}px ${FUENTE}`;
    ctx.fillText('SUBISTE A', W / 2, y - 30 * esc);
    const k = 1 + Math.max(0, .25 - t) * 2;
    ctx.translate(W / 2, y + 4 * esc); ctx.scale(k, k);
    ctx.fillStyle = '#fff';
    ctx.font = `900 ${Math.min(64 * esc, W * .1)}px ${FUENTE}`;
    ctx.fillText('CINTURÓN ' + banner.nombre.toUpperCase(), 0, 0);
    ctx.restore();
  }

  function dibujar() {
    ctx.setTransform(D, 0, 0, D, 0, 0);
    ctx.save();
    if (sacudida > 0) ctx.translate((Math.random() - .5) * sacudida, (Math.random() - .5) * sacudida);
    if (fondo) ctx.drawImage(fondo, 0, 0, W, H);
    if (montes) ctx.drawImage(montes, -W * .1 + parallaxX() * .4, 0, W * 1.2, H);
    // humo del volcan de Fuego
    const [hx, hy] = crater();
    for (let i = 0; i < 6; i++) {
      const k = ((reloj * .08 + i / 6) % 1);
      ctx.beginPath();
      ctx.arc(hx + k * 60 * esc + Math.sin(reloj + i) * 6, hy - k * 90 * esc, (6 + k * 26) * esc, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(70,30,30,${.35 * (1 - k)})`; ctx.fill();
    }
    // petalos de atras
    for (let i = 0; i < petalos.length; i += 2) petalo(petalos[i]);

    // rastros de tinta en el piso
    for (const p of parts) if (p.tipo === 'gota' && p.vy === 0) { ctx.globalAlpha = 1 - p.t / p.vida; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * 1.6, p.r * .4, 0, 0, Math.PI * 2); ctx.fillStyle = p.c; ctx.fill(); }
    ctx.globalAlpha = 1;

    // enemigos de lejos a cerca, jugador al centro
    const orden = enemigos.slice().sort((a, b) => Math.abs(b.x - cx) - Math.abs(a.x - cx));
    orden.filter(e => e.estado !== 'muerto').forEach(dibujarEnemigo);
    dibujarJugador();
    orden.filter(e => e.estado === 'muerto').forEach(dibujarEnemigo);

    // alcance, solo una pista suave en el piso
    if (modo === 'jugando') {
      ctx.strokeStyle = 'rgba(255,210,122,.16)'; ctx.lineWidth = 2;
      ctx.setLineDash([6, 8]);
      ctx.beginPath(); ctx.ellipse(cx, suelo + 3 * esc, alcance, alcance * .12, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }

    // dragon
    if (dragon) dragon.d.dibujar(ctx, { estilo: 'oro' });

    // particulas
    for (const p of parts) {
      const k = 1 - p.t / p.vida;
      if (p.tipo === 'gota' && p.vy === 0) continue;
      if (p.tipo === 'chispa') {
        ctx.strokeStyle = p.c; ctx.globalAlpha = k; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * .03, p.y - p.vy * .03); ctx.stroke();
      } else if (p.tipo === 'fuego') {
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k * .8;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1.3 - k * .3), 0, Math.PI * 2); ctx.fillStyle = p.c; ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      } else {
        ctx.globalAlpha = Math.min(1, k * 1.5);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (.4 + k * .6), 0, Math.PI * 2); ctx.fillStyle = p.c; ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    for (const a of anillos) {
      ctx.globalAlpha = 1 - a.t;
      ctx.strokeStyle = a.c; ctx.lineWidth = 4 * (1 - a.t) + 1;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.max * (.2 + a.t * .8), 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // petalos de adelante
    for (let i = 1; i < petalos.length; i += 2) petalo(petalos[i]);
    // textos que flotan
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const t of textos) {
      ctx.globalAlpha = 1 - t.t;
      const k = 1 + Math.max(0, .15 - t.t) * 3;
      ctx.font = `900 ${t.tam * k}px ${FUENTE}`;
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(t.txt, t.x, t.y);
      ctx.fillStyle = t.c; ctx.fillText(t.txt, t.x, t.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // vineta
    if (!vineta || vineta.w !== W || vineta.h !== H) {
      vineta = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .4, W / 2, H / 2, Math.max(W, H) * .75);
      vineta.addColorStop(0, 'rgba(0,0,0,0)'); vineta.addColorStop(1, 'rgba(0,0,0,.55)');
      vineta.w = W; vineta.h = H;
    }
    const v = vineta;
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    if (flash > 0) { ctx.fillStyle = `rgba(215,38,30,${flash * .55})`; ctx.fillRect(0, 0, W, H); }
    if (lento > 0) { ctx.fillStyle = `rgba(255,210,122,${Math.min(.12, lento * .1)})`; ctx.fillRect(0, 0, W, H); }

    if (modo === 'jugando' || modo === 'fin') dibujarHud();
    dibujarBanner();
  }

  reiniciar(true);
  medir();
  arrancar();
})();
