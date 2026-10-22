// Portada con el dragon alrededor del karateka, el dragon que vuela por toda
// la pagina, las figuras de las clases y la escena de tecnicas.
(function () {
  const F = window.Figura;
  // Que lienzos se ven, lo avisa un IntersectionObserver sin medir en cada cuadro
  const visibles = new WeakMap();
  const ojo = new IntersectionObserver(es => es.forEach(e => visibles.set(e.target, e.isIntersecting)), { rootMargin: '60px' });
  const enPantalla = (el) => {
    if (!el) return false;
    if (!visibles.has(el)) { visibles.set(el, false); ojo.observe(el); }
    return visibles.get(el);
  };
  // Dibujos hechos una vez en lienzos aparte, luego solo se copian
  function lienzo(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
    return c;
  }
  const SPRITE_FUEGO = (() => {
    const c = lienzo(128, 128), x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,240,180,1)'); g.addColorStop(.5, 'rgba(255,120,30,.7)'); g.addColorStop(1, 'rgba(200,30,10,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    return c;
  })();
  window.SPRITE_FUEGO = SPRITE_FUEGO;
  const SPRITE_FLOR = (() => {
    const c = lienzo(64, 64), x = c.getContext('2d');
    x.translate(32, 32);
    const r = 28;
    for (let i = 0; i < 5; i++) {
      x.rotate(Math.PI * 2 / 5);
      x.beginPath(); x.moveTo(0, 0);
      x.bezierCurveTo(r * .2, -r * .5, r * 1.1, -r * .7, r * 1.05, -r * .1);
      x.bezierCurveTo(r * .9, r * .2, r * .3, r * .15, 0, 0);
      x.fillStyle = '#fff6e8'; x.fill();
    }
    x.beginPath(); x.arc(0, 0, r * .28, 0, Math.PI * 2); x.fillStyle = '#f4c542'; x.fill();
    return c;
  })();
  const azar = (a, b) => a + Math.random() * (b - a);

  // Flor de plumeria, la flor de Hawai
  function plumeria(ctx, x, y, r, giro, alfa) {
    const c = Math.cos(giro), sn = Math.sin(giro), k = r / 28;
    ctx.globalAlpha = alfa;
    ctx.setTransform(D * c * k, D * sn * k, -D * sn * k, D * c * k, D * x, D * y);
    ctx.drawImage(SPRITE_FLOR, -32, -32);
    ctx.setTransform(D, 0, 0, D, 0, 0);
    ctx.globalAlpha = 1;
  }

  // Volcanes de Guatemala al fondo
  function volcanes(w, base, semilla, alto) {
    const pts = [];
    let s = semilla;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const picos = [];
    let x = -60;
    while (x < w + 60) {
      const ancho = 180 + rnd() * 260;
      picos.push({ x: x + ancho / 2, h: alto * (.55 + rnd() * .45), a: ancho });
      x += ancho * (.7 + rnd() * .3);
    }
    pts.push([-60, base]);
    picos.forEach(p => {
      pts.push([p.x - p.a / 2, base]);
      pts.push([p.x - p.a * .12, base - p.h]);
      pts.push([p.x + p.a * .1, base - p.h * .98]);
      pts.push([p.x + p.a / 2, base]);
    });
    pts.push([w + 60, base]);
    return { pts, picos };
  }

  /* ---------------- Portada ---------------- */
  const cv = document.getElementById('lienzo-portada');
  const ctx = cv.getContext('2d');
  const anim = new F.Animador('guardia');
  const dragon = new Dragon({ n: 56, sep: 10, ancho: 26, estilo: 'oro' });
  let W = 0, H = 0, D = 1, esc = 1, fx = 0, fy = 0, capas = [];
  let theta = 0, rugido = 0, mx = 0, my = 0, tiempo = 0, ultimo = performance.now();
  const petalos = [], chispas = [], fuego = [], ondas = [];
  const KATA = [['directo', .12, .35], ['guardia', .3, .5], ['cruzado', .12, .3], ['guardia', .3, .7], ['cuchillo', .16, .4], ['guardia', .35, .6], ['circular', .22, .45], ['guardia', .4, 1.2], ['bloqueo', .18, .5], ['guardia', .3, 1.4]];
  let kataI = 0, kataEspera = 1.5;

  function medir() {
    const m = F.ajustar(cv);
    // al girar el telefono el lienzo puede medir cero un instante
    if (m.w < 20 || m.h < 20) return;
    W = m.w; H = m.h; D = m.d;
    const tel = W < 760;
    esc = Math.min(H / 210 * (tel ? .36 : .5), W / 210 * (tel ? .62 : .5));
    fx = tel ? W * .5 : W * .66;
    fy = tel ? H * .42 : H * .86;
    capas = [
      { v: volcanes(W, fy - 4, 7, H * .30), c: '#2a110e', k: .02 },
      { v: volcanes(W, fy + 2, 21, H * .2), c: '#1c0b0a', k: .05 },
      { v: volcanes(W, fy + 6, 43, H * .11), c: '#110807', k: .09 }
    ];
    hornear();
    dragon.ancho = 19 * esc; dragon.sep = 6.6 * esc;
    if (!dragon.puntos.length) {
      // nace ya enroscado, se simulan unos segundos de vuelo
      const o = orbita(theta - 6);
      dragon.colocar(o[0], o[1], 0);
      for (let k = 0; k <= 360; k++) { const q = orbita(theta - 6 + k / 60); dragon.mover(q[0], q[1], q[2], 1 / 60); }
    }
    while (petalos.length < (tel ? 14 : 26)) petalos.push(nuevoPetalo(true));
  }
  // Sol, enso, volcanes, piso y brillo del karateka se dibujan una sola vez
  let capaSol = null, capaEnso = null, capaPiso = null, capaBrillo = null, sr = 0;
  function hornear() {
    claveFondo = '';
    const alto = 210 * esc;
    sr = Math.min(W, H) * (W < 760 ? .36 : .34);
    const R2 = sr * 1.8;
    capaSol = lienzo(R2 * 2 * D, R2 * 2 * D);
    let x = capaSol.getContext('2d');
    x.scale(D, D); x.translate(R2, R2);
    const halo = x.createRadialGradient(0, 0, sr, 0, 0, R2);
    halo.addColorStop(0, 'rgba(255,90,40,.28)'); halo.addColorStop(1, 'rgba(255,90,40,0)');
    x.fillStyle = halo; x.beginPath(); x.arc(0, 0, R2, 0, Math.PI * 2); x.fill();
    const g = x.createRadialGradient(0, 0, sr * .1, 0, 0, sr);
    g.addColorStop(0, '#ff7a45'); g.addColorStop(.55, '#e2321f'); g.addColorStop(.98, '#a5160f'); g.addColorStop(1, 'rgba(165,22,15,0)');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, sr, 0, Math.PI * 2); x.fill();
    const bs = x.createRadialGradient(-sr * .3, -sr * .35, 0, 0, 0, sr);
    bs.addColorStop(0, 'rgba(255,220,170,.35)'); bs.addColorStop(.6, 'rgba(255,200,150,0)');
    x.fillStyle = bs; x.beginPath(); x.arc(0, 0, sr, 0, Math.PI * 2); x.fill();
    const RE = sr * 1.08 + 6;
    capaEnso = lienzo(RE * 2 * D, RE * 2 * D);
    x = capaEnso.getContext('2d');
    x.scale(D, D); x.translate(RE, RE);
    for (let i = 0; i < 60; i++) {
      const a0 = i / 60 * Math.PI * 1.75, a1 = (i + 1.3) / 60 * Math.PI * 1.75;
      x.beginPath(); x.arc(0, 0, sr * 1.08, a0, a1);
      x.strokeStyle = `rgba(232,176,74,${.15 + .5 * Math.sin(i / 60 * Math.PI)})`;
      x.lineWidth = 1 + 6 * Math.sin(i / 60 * Math.PI); x.stroke();
    }
    capas.forEach(c => {
      const m = W * c.k * .5 + 70;
      c.lienzo = lienzo((W + m * 2) * D, H * D);
      c.margen = m;
      const y = c.lienzo.getContext('2d');
      y.scale(D, D); y.translate(m, 0);
      y.beginPath(); c.v.pts.forEach((p, j) => j ? y.lineTo(p[0], p[1]) : y.moveTo(p[0], p[1]));
      y.lineTo(W + 60, H); y.lineTo(-60, H); y.closePath();
      y.fillStyle = c.c; y.fill();
    });
    capaPiso = lienzo(W * D, Math.max(1, (H - fy)) * D);
    x = capaPiso.getContext('2d');
    x.scale(D, D);
    const pg = x.createLinearGradient(0, 0, 0, H - fy);
    pg.addColorStop(0, '#120807'); pg.addColorStop(1, '#0c0a0b');
    x.fillStyle = pg; x.fillRect(0, 6, W, H - fy);
    const rf = x.createRadialGradient(fx, 8, 0, fx, 8, W * .35);
    rf.addColorStop(0, 'rgba(255,90,40,.25)'); rf.addColorStop(1, 'rgba(255,90,40,0)');
    x.fillStyle = rf; x.fillRect(0, 6, W, H - fy);
    x.fillStyle = 'rgba(0,0,0,.55)';
    x.beginPath(); x.ellipse(fx, 6, 70 * esc, 9 * esc, 0, 0, Math.PI * 2); x.fill();
    const RB = alto * .75;
    capaBrillo = lienzo(RB * 2 * D, RB * 2 * D);
    x = capaBrillo.getContext('2d');
    const gb = x.createRadialGradient(RB * D, RB * D, 0, RB * D, RB * D, RB * D);
    gb.addColorStop(0, 'rgba(255,170,80,.35)'); gb.addColorStop(.55, 'rgba(255,120,40,.12)'); gb.addColorStop(1, 'rgba(255,120,40,0)');
    x.fillStyle = gb; x.fillRect(0, 0, RB * 2 * D, RB * 2 * D);
    capaBrillo.radio = RB;
  }
  const copiar = (c, l, x, y, w, h) => c.drawImage(l, x, y, w, h);

  // camino en espiral alrededor del karateka, z positivo pasa por delante
  function orbita(th) {
    const alto = 210 * esc;
    const Rx = (W < 760 ? 130 : 178) * esc + Math.sin(th * .7) * 10 * esc;
    return [fx + Math.cos(th) * Rx, fy - alto * .52 + Math.sin(th * .5) * alto * .34 + Math.sin(th) * 22 * esc, Math.sin(th)];
  }
  function nuevoPetalo(cualquiera) {
    return { x: azar(-40, W + 40), y: cualquiera ? azar(0, H) : -20, r: azar(4, 9), g: azar(0, 6), vg: azar(-1, 1), vx: azar(-20, 10), vy: azar(14, 34), f: azar(0, 6), a: azar(.35, .9) };
  }

  function pasoPortada(dt) {
    tiempo += dt;
    // kata
    kataEspera -= dt;
    if (kataEspera <= 0 && anim.libre()) {
      const [p, d, q] = KATA[kataI % KATA.length];
      anim.a(p, d, q, p === 'guardia' ? null : 'golpe');
      kataEspera = d + q; kataI++;
    }
    let pose = anim.paso(dt);
    if (anim.hacia === F.POSES.guardia && anim.libre()) pose = F.respira(pose, tiempo);
    // dragon en espiral alrededor
    const vel = .85 + rugido * 2.2;
    theta += dt * vel;
    rugido = Math.max(0, rugido - dt * .8);
    dragon.boca += ((rugido > .2 ? 1 : (Math.sin(tiempo * .9) > .93 ? .5 : 0)) - dragon.boca) * Math.min(1, dt * 10);
    const o = orbita(theta);
    dragon.mover(o[0] + (mxS - .5) * 30, o[1] + (myS - .5) * 20, o[2], dt);
    // fuego al rugir
    if (rugido > .3) {
      const b = dragon.boquilla();
      for (let i = 0; i < 3; i++) fuego.push({ x: b.x, y: b.y, vx: Math.cos(b.ang + azar(-.3, .3)) * azar(200, 420) * esc, vy: Math.sin(b.ang + azar(-.3, .3)) * azar(200, 420) * esc, v: 1, r: azar(5, 12) * esc });
    }
    // chispas que suben
    if (Math.random() < dt * 14) chispas.push({ x: azar(0, W), y: H + 10, vy: -azar(30, 90), vx: azar(-10, 10), v: azar(.6, 1), r: azar(.8, 2.2) });
    return pose;
  }

  // El fondo se arma en dos imagenes, atras (cielo y sol) y frente (volcanes y
  // piso). Solo se rehacen cuando el raton mueve la vista; en cada cuadro se
  // copian dos imagenes en vez de seis.
  let atras = null, frente = null, claveFondo = '';
  function componerFondo(px, py, sx, sy) {
    const clave = Math.round(px * W * .18) + ',' + Math.round(py * 40) + ',' + W + ',' + H + ',' + D;
    if (clave === claveFondo && atras) return;
    claveFondo = clave;
    if (!atras || atras.width !== Math.round(W * D) || atras.height !== Math.round(H * D)) { atras = lienzo(W * D, H * D); frente = lienzo(W * D, H * D); }
    let x = atras.getContext('2d');
    x.setTransform(D, 0, 0, D, 0, 0);
    const g = x.createRadialGradient(W * .7, H * .4, 0, W * .7, H * .4, Math.max(W, H) * 1.05);
    g.addColorStop(0, '#3a0f0c'); g.addColorStop(.43, '#1a0b0a'); g.addColorStop(.76, '#0c0a0b');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    const R2 = sr * 1.8;
    copiar(x, capaSol, sx - R2, sy - R2, R2 * 2, R2 * 2);
    x = frente.getContext('2d');
    x.setTransform(D, 0, 0, D, 0, 0);
    x.clearRect(0, 0, W, H);
    capas.forEach(c => copiar(x, c.lienzo, -px * W * c.k - c.margen, -py * 10 * c.k * 10, W + c.margen * 2, H));
    copiar(x, capaPiso, 0, fy, W, H - fy);
  }
  let mxS = .5, myS = .5;
  function dibujarPortada(pose) {
    ctx.setTransform(D, 0, 0, D, 0, 0);
    // la vista sigue al raton con suavidad
    mxS += (mx - mxS) * .08; myS += (my - myS) * .08;
    const px = (mxS - .5), py = (myS - .5);
    const alto = 210 * esc;
    const sx = fx - px * 20, sy = fy - alto * .62 - py * 12;
    componerFondo(px, py, sx, sy);
    ctx.drawImage(atras, 0, 0, W, H);
    const RE = sr * 1.08 + 6;
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(tiempo * .12);
    copiar(ctx, capaEnso, -RE, -RE, RE * 2, RE * 2);
    ctx.restore();
    ctx.drawImage(frente, 0, 0, W, H);
    // humo del volcan de Fuego
    const c0 = capas[0], ox = -px * W * c0.k, oy = -py * 10 * c0.k * 10;
    const pico = c0.pico || (c0.pico = c0.v.picos.reduce((a, b) => b.h > a.h ? b : a));
    for (let k = 0; k < 7; k++) {
      const f = (tiempo * .08 + k / 7) % 1;
      ctx.beginPath(); ctx.arc(ox + pico.x - pico.a * .01 + f * 60 + Math.sin(f * 6 + k) * 8, oy + fy - 4 - pico.h - f * 90, 6 + f * 22, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(90,40,30,${.35 * (1 - f)})`; ctx.fill();
    }
    // chispas
    chispas.forEach(c => { ctx.globalAlpha = c.v; ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill(); });
    ctx.globalAlpha = 1;

    const prof = (z) => .82 + .22 * (z + 1) / 2;
    // la perla va un poco adelante de la cabeza
    const pq = orbita(theta + .42);
    const perla = () => Dragon.perla(ctx, pq[0] + (mxS - .5) * 30, pq[1] + (myS - .5) * 20, 7 * esc * prof(pq[2]), tiempo);
    if (pq[2] < 0) perla();
    // dragon por detras
    dragon.dibujar(ctx, { filtro: (i) => dragon.puntos[i].z < 0, prof });
    // karateka en tinta con borde dorado
    const RB = capaBrillo.radio;
    copiar(ctx, capaBrillo, fx - RB, fy - alto * .5 - RB, RB * 2, RB * 2);
    F.dibujar(ctx, pose, { x: fx, suelo: fy + 6, escala: esc, mira: 1, cinta: '#141012', vincha: '#d7261e', tiempo, viento: .6 + rugido });
    // dragon por delante
    dragon.dibujar(ctx, { filtro: (i) => dragon.puntos[i].z >= 0, prof });
    if (pq[2] >= 0) perla();
    // fuego
    ctx.globalCompositeOperation = 'lighter';
    fuego.forEach(f => {
      ctx.globalAlpha = Math.max(0, f.v);
      ctx.drawImage(SPRITE_FUEGO, f.x - f.r, f.y - f.r, f.r * 2, f.r * 2);
    });
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    // ondas del toque
    ondas.forEach(o => {
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(232,176,74,${o.v})`; ctx.lineWidth = 3 * o.v; ctx.stroke();
    });
    // petalos
    petalos.forEach(p => plumeria(ctx, p.x, p.y, p.r, p.g, p.a));
  }

  function moverParticulas(dt) {
    petalos.forEach((p, i) => {
      p.f += dt; p.x += (p.vx + Math.sin(p.f * 1.3) * 18) * dt; p.y += p.vy * dt; p.g += p.vg * dt;
      if (p.y > H + 20 || p.x < -60 || p.x > W + 60) petalos[i] = nuevoPetalo(false);
    });
    for (let i = chispas.length - 1; i >= 0; i--) { const c = chispas[i]; c.y += c.vy * dt; c.x += c.vx * dt; c.v -= dt * .35; if (c.v <= 0) chispas.splice(i, 1); }
    for (let i = fuego.length - 1; i >= 0; i--) { const f = fuego[i]; f.x += f.vx * dt; f.y += f.vy * dt; f.r *= 1 + dt * 2.2; f.v -= dt * 1.8; if (f.v <= 0) fuego.splice(i, 1); }
    for (let i = ondas.length - 1; i >= 0; i--) { const o = ondas[i]; o.r += dt * 380; o.v -= dt * 1.4; if (o.v <= 0) ondas.splice(i, 1); }
  }

  cv.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width; my = (e.clientY - r.top) / r.height; });
  cv.addEventListener('pointerdown', e => {
    const r = cv.getBoundingClientRect();
    ondas.push({ x: e.clientX - r.left, y: e.clientY - r.top, r: 10, v: 1 });
    rugido = 1.4;
    anim.ya('directo', .1, .12, 'golpe').a('cruzado', .1, .12, 'golpe').a('circular', .18, .3, 'golpe').a('guardia', .3, .3);
    kataEspera = 1.6;
    document.getElementById('pista-dragon').classList.add('fuera');
    if (window.Sonido) window.Sonido.rugido();
  });

  /* ---------------- Dragon que vuela por toda la pagina ---------------- */
  const vuelo = document.createElement('canvas');
  vuelo.id = 'vuelo';
  vuelo.setAttribute('aria-hidden', 'true');
  document.body.appendChild(vuelo);
  const vctx = vuelo.getContext('2d');
  const volador = new Dragon({ n: 64, sep: 8, ancho: 24, estilo: 'oro' });
  const V = { estado: 'fuera', espera: 2.5, x: 0, y: 0, dir: 1, base: 0, f: 0, vel: 420, meta: null, vueltas: 0, ang: 0 };
  let vW = 0, vH = 0, vD = 1;
  function medirVuelo() { const m = F.ajustar(vuelo); vW = m.w; vH = m.h; vD = m.d; vueloSucio = true; }
  function pasada(rapida) {
    V.estado = 'pasada';
    V.dir = Math.random() < .5 ? 1 : -1;
    V.x = V.dir > 0 ? -80 : vW + 80;
    V.base = azar(vH * .22, vH * .78);
    V.f = azar(0, 6); V.vel = rapida ? 760 : azar(300, 380);
    volador.estilo = Math.random() < .5 ? 'oro' : 'blanco';
    const t = Math.min(1.25, Math.max(.75, vW / 1200));
    volador.ancho = (rapida ? 30 : 24) * t; volador.sep = (rapida ? 10 : 8) * t;
    V.y = V.base;
    volador.colocar(V.x, V.y, V.dir > 0 ? 0 : Math.PI);
  }
  window.dragonPasa = () => { medirVuelo(); pasada(true); };
  window.dragonVen = (x, y) => {
    if (V.estado === 'fuera') { medirVuelo(); pasada(false); }
    V.estado = 'llamado'; V.meta = { x, y }; V.vueltas = 0;
  };
  // Cabeza gigante que entra, abre la boca, escupe fuego y suelta la pagina
  const llamas = [];
  let alAbrir = null;
  window.dragonBoca = (cb) => {
    medirVuelo();
    alAbrir = cb;
    const m = Math.min(vW, vH);
    volador.n = 34; volador.estilo = 'oro';
    volador.ancho = m * (vW < 760 ? .2 : .17); volador.sep = volador.ancho * .45;
    V.estado = 'boca'; V.f = 0;
    V.x0 = -volador.ancho * 2; V.y0 = vH * .78;
    V.tx = vW * (vW < 760 ? .18 : .3); V.ty = vH * .5;
    volador.angCab = null;
    volador.colocar(V.x0, V.y0, -.5);
    volador.boca = 0;
  };
  function pasoBoca(dt) {
    V.f += dt;
    const f = V.f;
    let x, y;
    if (f < .5) {
      const k = 1 - Math.pow(1 - f / .5, 3);
      x = V.x0 + (V.tx - V.x0) * k; y = V.y0 + (V.ty - V.y0) * k - Math.sin(k * Math.PI) * vH * .12;
      volador.boca = 0;
    } else if (f < 1.05) {
      const k = (f - .5) / .55;
      x = V.tx + Math.sin(k * Math.PI) * 14; y = V.ty + Math.sin(f * 9) * 3;
      volador.boca += (1.5 - volador.boca) * Math.min(1, dt * 14);
      if (alAbrir && f > .62) {
        const b = volador.boquilla();
        alAbrir(b.x, b.y); alAbrir = null;
        if (window.Sonido) window.Sonido.rugido();
      }
      if (f > .6) {
        const b = volador.boquilla();
        for (let i = 0; i < 5; i++) {
          const a = b.ang + azar(-.35, .35), v = azar(500, 1100);
          llamas.push({ x: b.x, y: b.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: azar(10, 26) * volador.ancho / 60, v: 1 });
        }
      }
    } else {
      const k = f - 1.05;
      x = V.tx + k * k * vW * 1.4 + k * 300; y = V.ty - k * vH * 1.3;
      volador.boca += (0 - volador.boca) * Math.min(1, dt * 5);
      if (f > 2.4) { V.estado = 'fuera'; V.espera = azar(5, 9); volador.n = 64; }
    }
    if (V.estado === 'boca') volador.mover(x, y, 0, dt);
  }
  function dibujarLlamas(dt) {
    if (!llamas.length) return;
    vctx.globalCompositeOperation = 'lighter';
    for (let i = llamas.length - 1; i >= 0; i--) {
      const l = llamas[i];
      l.x += l.vx * dt; l.y += l.vy * dt; l.vx *= 1 - dt * 1.2; l.vy *= 1 - dt * 1.2; l.r *= 1 + dt * 2.6; l.v -= dt * 1.5;
      if (l.v <= 0) { llamas.splice(i, 1); continue; }
      vctx.globalAlpha = Math.max(0, l.v);
      vctx.drawImage(SPRITE_FUEGO, l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
      vctx.globalAlpha = 1;
    }
    vctx.globalCompositeOperation = 'source-over';
  }
  const quieto = matchMedia('(prefers-reduced-motion: reduce)');
  function pasoVuelo(dt) {
    if (quieto.matches && V.estado !== 'boca') { V.estado = 'fuera'; V.espera = 5; return false; }
    if (V.estado === 'boca') { pasoBoca(dt); return true; }
    const pagina = document.body.dataset.pagina;
    const callado = pagina === 'inicio' || pagina === 'juego';
    if (V.estado === 'fuera') {
      V.espera -= dt;
      if (V.espera <= 0 && !callado) { medirVuelo(); pasada(false); }
      return V.estado !== 'fuera';
    }
    if (V.estado === 'pasada') {
      V.f += dt;
      V.x += V.dir * V.vel * dt;
      V.y = V.base + Math.sin(V.f * 1.25) * 70 + Math.sin(V.f * .55) * 40;
      volador.mover(V.x, V.y, 0, dt);
      volador.boca += ((Math.sin(V.f * 1.7) > .8 ? 1.1 : 0) - volador.boca) * Math.min(1, dt * 8);
      const cola = volador.n * volador.sep + 120;
      if ((V.dir > 0 && V.x > vW + cola) || (V.dir < 0 && V.x < -cola)) { V.estado = 'fuera'; V.espera = vW < 760 ? azar(14, 24) : azar(6, 11); }
    } else if (V.estado === 'llamado') {
      // va hacia el toque, da una vuelta y se va
      const m = V.meta;
      V.ang += dt * 2.6;
      const r = 120;
      const tx = m.x + Math.cos(V.ang) * r, ty = m.y + Math.sin(V.ang) * r * .7;
      const dx = tx - V.x, dy = ty - V.y, d = Math.hypot(dx, dy) || 1;
      const sp = Math.min(d, 760 * dt);
      V.x += dx / d * sp; V.y += dy / d * sp;
      volador.mover(V.x, V.y, 0, dt);
      if (d < 30) V.vueltas += dt;
      volador.boca += ((V.vueltas > .3 && V.vueltas < .9 ? 1 : 0) - volador.boca) * Math.min(1, dt * 8);
      if (V.vueltas > 1.6) {
        V.estado = 'pasada'; V.dir = V.x < vW / 2 ? -1 : 1; V.base = V.y; V.f = 0; V.vel = 620;
      }
    }
    return true;
  }
  let vueloSucio = true;
  function dibujarVuelo(dt) {
    const hay = V.estado !== 'fuera' || llamas.length || golpes.length;
    if (!hay && !vueloSucio) return;
    vueloSucio = hay;
    vctx.setTransform(vD, 0, 0, vD, 0, 0);
    vctx.clearRect(0, 0, vW, vH);
    if (V.estado !== 'fuera') volador.dibujar(vctx, {});
    dibujarLlamas(dt || .016);
    dibujarGolpes(dt || .016);
  }
  // cada toque suelta un golpe de chispas
  const golpes = [];
  document.addEventListener('pointerdown', e => {
    golpes.push({ x: e.clientX, y: e.clientY, v: 1, r: 4, a: Math.random() * 6 });
  }, true);
  function dibujarGolpes(dt) {
    for (let i = golpes.length - 1; i >= 0; i--) {
      const g = golpes[i];
      g.v -= dt * 2.6; g.r += dt * 260;
      if (g.v <= 0) { golpes.splice(i, 1); continue; }
      vctx.beginPath(); vctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
      vctx.strokeStyle = `rgba(232,176,74,${g.v})`; vctx.lineWidth = 3 * g.v; vctx.stroke();
      for (let k = 0; k < 8; k++) {
        const a = g.a + k / 8 * Math.PI * 2;
        vctx.beginPath();
        vctx.moveTo(g.x + Math.cos(a) * g.r * .5, g.y + Math.sin(a) * g.r * .5);
        vctx.lineTo(g.x + Math.cos(a) * g.r * .85, g.y + Math.sin(a) * g.r * .85);
        vctx.strokeStyle = k % 2 ? `rgba(255,74,46,${g.v})` : `rgba(255,230,160,${g.v})`;
        vctx.lineWidth = 2.5; vctx.stroke();
      }
    }
  }
  // tocar un espacio vacio llama al dragon
  document.addEventListener('pointerdown', e => {
    if (e.target.closest('a, button, input, label, canvas, iframe, .opcion, .ins-dia, .tec-btn, .juego-marco')) return;
    const pagina = document.body.dataset.pagina;
    if (pagina === 'inicio' || pagina === 'juego') return;
    window.dragonVen(e.clientX, e.clientY);
  });

  /* ---------------- Figuras de las clases ---------------- */
  const GRUPOS = {
    ninos:   { prop: { cabeza: 1.3, torso: .8, pierna: .8, brazo: .85 }, cinta: '#f2c230', seq: ['frontal', 'guardia', 'directo', 'guardia', 'victoria', 'guardia'] },
    jovenes: { prop: {}, cinta: '#2f9e4a', seq: ['directo', 'cruzado', 'guardia', 'circular', 'guardia'] },
    adultos: { prop: {}, cinta: '#141012', seq: ['cuchillo', 'codo', 'guardia', 'rodilla', 'bloqueo', 'guardia'] },
    promo:   { prop: {}, cinta: '#141012', seq: ['saludo', 'guardia', 'directo', 'cruzado', 'circular', 'guardia', 'victoria', 'guardia'] }
  };
  const mini = [...document.querySelectorAll('.clase-fig')].map((c, i) => {
    const g = GRUPOS[c.dataset.pose];
    return { c, x: c.getContext('2d'), g, a: new F.Animador('guardia'), i: 0, espera: .8 + i * .4, chispa: 0, t: i };
  });
  function pasoMini(m, dt) {
    if (!enPantalla(m.c)) return;
    const s = F.ajustar(m.c);
    m.t += dt;
    m.espera -= dt;
    if (m.espera <= 0 && m.a.libre()) {
      const p = m.g.seq[m.i++ % m.g.seq.length];
      const golpe = p !== 'guardia';
      m.a.a(p, golpe ? .14 : .3, golpe ? .35 : .5, golpe ? 'golpe' : null);
      m.espera = golpe ? .5 : .9;
      if (golpe && p !== 'victoria' && p !== 'bloqueo') m.chispa = .35;
    }
    let pose = m.a.paso(dt);
    if (m.a.libre()) pose = F.respira(pose, m.t);
    const x = m.x;
    x.setTransform(s.d, 0, 0, s.d, 0, 0);
    x.clearRect(0, 0, s.w, s.h);
    const e = s.h / 230;
    x.fillStyle = 'rgba(0,0,0,.45)';
    x.beginPath(); x.ellipse(s.w * .42, s.h - 20, 60 * e, 7 * e, 0, 0, Math.PI * 2); x.fill();
    const pts = F.dibujar(x, pose, { x: s.w * .42, suelo: s.h - 20, escala: e * .9, mira: 1, proporcion: m.g.prop, cinta: m.g.cinta, tiempo: m.t, vincha: m.g.cinta === '#141012' ? '#d7261e' : null });
    if (m.chispa > 0) {
      m.chispa -= dt;
      const p = ['frontal', 'circular', 'rodilla'].includes(m.g.seq[(m.i - 1) % m.g.seq.length]) ? pts.pie : pts.mano;
      const k = 1 - m.chispa / .35;
      x.beginPath(); x.arc(p[0] + 8, p[1], 6 + k * 26, 0, Math.PI * 2);
      x.strokeStyle = `rgba(255,200,90,${1 - k})`; x.lineWidth = 3; x.stroke();
      for (let j = 0; j < 6; j++) {
        const a = j / 6 * Math.PI * 2;
        x.beginPath(); x.moveTo(p[0] + 8 + Math.cos(a) * (8 + k * 14), p[1] + Math.sin(a) * (8 + k * 14));
        x.lineTo(p[0] + 8 + Math.cos(a) * (14 + k * 26), p[1] + Math.sin(a) * (14 + k * 26));
        x.strokeStyle = `rgba(255,74,46,${1 - k})`; x.lineWidth = 2; x.stroke();
      }
    }
  }

  mini.forEach(m => {
    const tarjeta = m.c.closest('.clase, .promo');
    if (!tarjeta) return;
    tarjeta.addEventListener('pointerenter', () => {
      if (!m.a.libre()) return;
      m.a.ya('directo', .09, .06, 'golpe').a('cruzado', .09, .06, 'golpe').a('circular', .16, .3, 'golpe').a('guardia', .3, .2);
      m.espera = 1.2; m.chispa = .35;
    });
  });

  /* ---------------- Escena de tecnicas ---------------- */
  const tc = document.getElementById('lienzo-tecnica');
  const tctx = tc.getContext('2d');
  const tAnim = new F.Animador('guardia');
  const TEC = {
    guardia:  { nom: 'Guardia', desc: 'Manos arriba, mentón abajo y peso repartido en las dos piernas.', seq: [['guardia', .4, 1.4]], parte: null },
    directo:  { nom: 'Puño directo', desc: 'Sale recto desde la guardia y regresa igual de rápido.', seq: [['directo', .14, .5], ['guardia', .35, .8]], parte: 'mano' },
    cuchillo: { nom: 'Mano de cuchillo', desc: 'Se golpea con el canto de la mano abierta, muy del Kempo.', seq: [['cuchillo', .18, .5], ['guardia', .35, .8]], parte: 'mano' },
    frontal:  { nom: 'Patada frontal', desc: 'Sube la rodilla, extiende la pierna y empuja con la planta.', seq: [['frontal', .2, .5], ['guardia', .4, .8]], parte: 'pie' },
    circular: { nom: 'Patada circular', desc: 'La cadera gira y la pierna entra de lado, alta y con fuerza.', seq: [['circular', .24, .5], ['guardia', .45, .8]], parte: 'pie' },
    bloqueo:  { nom: 'Bloqueo alto', desc: 'El antebrazo sube y protege la cabeza de un golpe de arriba.', seq: [['bloqueo', .18, .7], ['guardia', .35, .8]], parte: 'mano' },
    combo:    { nom: 'Combo Kempo', desc: 'Directo, cruzado, cuchillo, codo y patada sin parar.', seq: [['directo', .1, .08], ['cruzado', .1, .08], ['cuchillo', .12, .08], ['codo', .1, .08], ['circular', .2, .4], ['guardia', .4, 1]], parte: 'mano' },
    saludo:   { nom: 'Saludo', desc: 'Así empieza y termina cada clase, con respeto.', seq: [['firme', .5, .4], ['saludo', .6, .9], ['firme', .5, .5], ['guardia', .5, .8]], parte: null }
  };
  let tecActual = 'guardia', tTiempo = 0, tEspera = 0, estela = [], saco = { a: 0, v: 0 };
  let fxT = null, yaPego = false, maxLlega = 0;
  const choque = {};
  const alcance = {}, golpesSaco = [];
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) window.__tec = () => ({ fxT, alcance: Object.assign({}, alcance), a: saco.a, v: saco.v, marcas: (saco.marcas || []).length });
  // golpe seco al saco, sintetizado, solo despues de que la persona toco la pagina
  let ac = null;
  addEventListener('pointerdown', () => { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (er) {} } }, { once: true, capture: true });
  function sonarGolpe(f) {
    if (!ac || ac.state !== 'running') return;
    const t = ac.currentTime;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(48, t + .18);
    g.gain.setValueAtTime(.28 * f, t); g.gain.exponentialRampToValueAtTime(.001, t + .22);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + .25);
    const n = ac.createBuffer(1, ac.sampleRate * .08, ac.sampleRate), d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    const fuente = ac.createBufferSource(), gn = ac.createGain(), fl = ac.createBiquadFilter();
    fl.type = 'lowpass'; fl.frequency.value = 900;
    fuente.buffer = n; gn.gain.value = .22 * f;
    fuente.connect(fl).connect(gn).connect(ac.destination); fuente.start(t);
  }
  const nombreTec = document.getElementById('tec-nombre');
  document.getElementById('tec-botones').addEventListener('click', e => {
    const b = e.target.closest('.tec-btn');
    if (!b) return;
    document.querySelectorAll('.tec-btn').forEach(x => x.classList.toggle('activo', x === b));
    tecActual = b.dataset.tec; tEspera = 0; estela = []; maxLlega = 0; yaPego = false;
    tAnim.cola = []; tAnim.t = 1; tAnim.espera = 0;
    nombreTec.textContent = TEC[tecActual].nom;
    const desc = document.getElementById('tec-desc');
    if (desc) { desc.textContent = TEC[tecActual].desc; desc.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500 }); }
    nombreTec.animate([{ transform: 'translateY(12px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 400, easing: 'cubic-bezier(.2,.8,.2,1)' });
  });
  function pasoTecnica(dtReal) {
    if (!enPantalla(tc)) return;
    const s = F.ajustar(tc);
    const lento = tecActual === 'combo' ? .55 : .42;
    const dt = dtReal * lento;
    tTiempo += dt;
    tEspera -= dt;
    if (tAnim.libre() && tEspera <= 0) {
      if (maxLlega > 0 && TEC[tecActual].parte) alcance[tecActual] = maxLlega;
      maxLlega = 0;
      TEC[tecActual].seq.forEach(([p, d, q]) => tAnim.a(p, d, q, p === 'guardia' || p === 'firme' || p === 'saludo' ? null : 'golpe'));
      tEspera = TEC[tecActual].seq.reduce((a, x) => a + x[1] + x[2], 0) + .2;
    }
    let pose = tAnim.paso(dt);
    if (tecActual === 'guardia') pose = F.respira(pose, tTiempo * 2.4);
    const x = tctx;
    x.setTransform(s.d, 0, 0, s.d, 0, 0);
    x.clearRect(0, 0, s.w, s.h);
    const suelo = s.h * .86, e = s.h / 360;
    // pared del dojo
    x.fillStyle = '#1a1112'; x.fillRect(0, 0, s.w, suelo);
    for (let i = 0; i < s.w; i += 46 * e) { x.fillStyle = i / (46 * e) % 2 ? 'rgba(255,255,255,.015)' : 'rgba(0,0,0,.12)'; x.fillRect(i, 0, 46 * e, suelo); }
    // pergamino con kanji
    const kx = s.w * .06, ky = s.h * .34;
    x.fillStyle = '#e9dfcc'; x.fillRect(kx, ky, 54 * e, 150 * e);
    x.fillStyle = '#5a3b22'; x.fillRect(kx - 6 * e, ky - 6 * e, 66 * e, 8 * e); x.fillRect(kx - 6 * e, ky + 148 * e, 66 * e, 8 * e);
    x.fillStyle = '#1a1214'; x.font = `${38 * e}px "Yuji Syuku", serif`; x.textAlign = 'center';
    x.fillText('拳', kx + 27 * e, ky + 60 * e); x.fillText('法', kx + 27 * e, ky + 110 * e);
    x.fillStyle = '#d7261e'; x.fillRect(kx + 20 * e, ky + 126 * e, 14 * e, 14 * e);
    // piso de madera
    const pg = x.createLinearGradient(0, suelo, 0, s.h);
    pg.addColorStop(0, '#5a3a24'); pg.addColorStop(1, '#2a1a12');
    x.fillStyle = pg; x.fillRect(0, suelo, s.w, s.h - suelo);
    for (let i = -10; i < 30; i++) {
      x.beginPath(); x.moveTo(s.w / 2 + i * 60 * e, suelo); x.lineTo(s.w / 2 + i * 140 * e, s.h);
      x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 1; x.stroke();
    }
    // ---------- saco de golpeo con fisica de cuerpo rigido ----------
    // Cuelga de una cadena, es un cilindro de 32 kg. Cada golpe le da un
    // impulso horizontal en el punto de contacto, se mece como pendulo fisico,
    // gira un poco sobre su eje si el golpe va descentrado y guarda la marca.
    const bx = s.w * .7, cuelga = s.h * .02, by = suelo - 232 * e, alto = 172 * e, medio = 31 * e;
    const golpeEn = TEC[tecActual].parte;
    const ppm = alto / 1.2;                       // el saco mide 1.2 m
    const Lc = (by + alto * .5 - cuelga) / ppm;   // del gancho al centro, en metros
    const hm = alto / ppm, wm = 2 * medio / ppm, M = 32;
    const I = M * (Lc * Lc + hm * hm / 12 + wm * wm / 12);
    // pendulo fisico, momento de la gravedad sobre el gancho
    if (!isFinite(saco.tw)) saco.tw = 0;
    if (!isFinite(saco.tv)) saco.tv = 0;
    const sub = 4;
    for (let k = 0; k < sub; k++) {
      const h = dt / sub;
      saco.v += (-(M * 9.8 * Lc / I) * Math.sin(saco.a) - .32 * saco.v) * h;
      saco.a += saco.v * h;
      // giro sobre su eje, como resorte con poco freno
      saco.tv += (-6 * saco.tw - .55 * saco.tv) * h;
      saco.tw += saco.tv * h;
    }
    // al regresar no atraviesa al karateka, choca con su cuerpo en toda la
    // altura de la cara de enfrente y rebota suave
    if (fxT !== null) {
      const frente = fxT + 38 * e;
      let peor = 0, brazoPeor = 1;
      for (const yl of [0, alto * .5, alto]) {
        const Y = yl + (by - cuelga);
        const X = bx - medio * Math.cos(saco.a) - Y * Math.sin(saco.a);
        if (frente - X > peor) { peor = frente - X; brazoPeor = Y; }
      }
      if (peor > 0) {
        saco.a -= peor / brazoPeor;
        if (saco.v > 0) saco.v = -saco.v * .3;
      }
    }
    // marcas, se hunden con el golpe y regresan despacio como espuma
    saco.marcas = saco.marcas || [];
    for (let i = saco.marcas.length - 1; i >= 0; i--) {
      const m = saco.marcas[i];
      m.t += dtReal;
      if (!m.apretando) m.prof *= Math.exp(-dtReal / 1.6);
      m.apretando = false;
      if (m.t > 4.5) saco.marcas.splice(i, 1);
    }
    // borde de la cara de enfrente a una altura de pantalla, con la marca hundida
    // angulo de cada marca alrededor del cilindro, 0 es el borde de enfrente
    // que da al karateka; con el giro del saco la marca se va hacia el frente
    // de la vista o hacia atras, y solo hunde el contorno cuando esta en el borde
    const anguloDe = (m) => saco.tw - m.tw0;
    const hundidoEn = (yl) => {
      let d = 0;
      for (const m of saco.marcas) {
        const r = (yl - m.y) / m.r;
        if (Math.abs(r) >= 1) continue;
        const enBorde = Math.max(0, Math.cos(anguloDe(m)));
        d = Math.max(d, m.prof * Math.cos(r * Math.PI / 2) * enBorde * enBorde);
      }
      return d;
    };
    // punto de pantalla a coordenadas del saco, x desde su eje, y desde su tapa
    const aSaco = (X, Y) => {
      const dx = X - bx, dy = Y - cuelga, c = Math.cos(saco.a), sn = Math.sin(saco.a);
      return [dx * c + dy * sn, -dx * sn + dy * c - (by - cuelga)];
    };
    const aPantalla = (lx, ly) => {
      const c = Math.cos(saco.a), sn = Math.sin(saco.a), Y = ly + (by - cuelga);
      return [bx + lx * c - Y * sn, cuelga + lx * sn + Y * c];
    };
    x.save(); x.translate(bx, cuelga); x.rotate(saco.a);
    // cadena
    x.strokeStyle = '#6a5848'; x.lineWidth = 2.2 * e;
    for (let yy = 0; yy < by - cuelga - 4 * e; yy += 9 * e) { x.beginPath(); x.ellipse(0, yy + 4.5 * e, 2.4 * e, 4.5 * e, 0, 0, Math.PI * 2); x.stroke(); }
    const y0 = by - cuelga, y1 = y0 + alto, r = 22 * e;
    // contorno, la cara de enfrente sigue las marcas hundidas
    x.beginPath();
    x.moveTo(-medio + r, y0);
    x.lineTo(medio - r, y0); x.quadraticCurveTo(medio, y0, medio, y0 + r);
    x.lineTo(medio, y1 - r); x.quadraticCurveTo(medio, y1, medio - r, y1);
    x.lineTo(-medio + r, y1); x.quadraticCurveTo(-medio, y1, -medio, y1 - r);
    for (let yl = alto - r; yl >= r; yl -= 3 * e) x.lineTo(-medio + hundidoEn(yl), y0 + yl);
    x.lineTo(-medio, y0 + r);
    x.quadraticCurveTo(-medio, y0, -medio + r, y0);
    x.closePath();
    // la luz se corre con el giro sobre su eje
    const gir = Math.sin(saco.tw) * medio * .7;
    const sg = x.createLinearGradient(-medio, 0, medio, 0);
    const luz = Math.max(.15, Math.min(.85, .5 + gir / (medio * 2)));
    sg.addColorStop(0, '#4a0c09'); sg.addColorStop(luz, '#c42a20'); sg.addColorStop(1, '#3e0a07');
    x.fillStyle = sg; x.fill();
    x.save(); x.clip();
    // costuras y franjas que tambien giran
    x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 1.2 * e;
    x.beginPath(); x.moveTo(gir * .9, y0); x.lineTo(gir * .9, y1); x.stroke();
    x.fillStyle = 'rgba(232,176,74,.85)';
    for (const fy of [30, 132]) {
      x.beginPath(); x.ellipse(0, y0 + fy * e + 3 * e, medio, 3 * e, 0, 0, Math.PI); x.lineTo(-medio, y0 + fy * e); x.ellipse(0, y0 + fy * e, medio, 3 * e, 0, Math.PI, 0, true); x.fill();
    }
    // la huella que deja cada golpe, nudillos o planta, se va borrando
    for (const m of saco.marcas) {
      const th = anguloDe(m);
      // del lado de atras del cilindro no se ve
      const cara = Math.sin(th);
      if (cara < -.05) continue;
      const vis = Math.min(1, (4.5 - m.t) / 1.5) * Math.min(1, m.prof / (4 * e) + .4);
      if (vis <= 0) continue;
      // posicion sobre la superficie, se achica de lado cerca del borde
      const cx0 = -medio * Math.cos(th) + hundidoEn(m.y) * Math.cos(th);
      const ancho = Math.max(.32, cara);
      const cy0 = y0 + m.y;
      x.save();
      x.translate(cx0, cy0);
      x.scale(ancho, 1);
      x.globalAlpha = vis * .6;
      x.fillStyle = '#2a0503';
      if (m.tipo === 'mano') {
        // cuatro nudillos en fila
        for (let k = -1.5; k <= 1.5; k++) { x.beginPath(); x.ellipse(5 * e, k * 4.6 * e, 4.4 * e, 2.6 * e, 0, 0, Math.PI * 2); x.fill(); }
      } else {
        x.beginPath(); x.ellipse(6 * e, 0, 7 * e, 13 * e, 0, 0, Math.PI * 2); x.fill();
      }
      // brillo del borde de la marca, se nota hundida
      x.globalAlpha = vis * .4; x.strokeStyle = '#ff8a6a'; x.lineWidth = 1.2 * e;
      x.beginPath(); x.ellipse(5 * e, 0, (m.tipo === 'mano' ? 7 : 9) * e, (m.tipo === 'mano' ? 11 : 15) * e, 0, -2.2, 2.2); x.stroke();
      x.restore();
    }
    x.restore();
    x.restore();
    // figura, se acerca a la distancia justa para que su golpe llegue al saco
    const meta = golpeEn ? bx - medio + 14 * e - (alcance[tecActual] || (golpeEn === 'pie' ? 108 : 92) * e) : s.w * .4;
    if (fxT === null) fxT = meta;
    fxT += (meta - fxT) * Math.min(1, dtReal * 3);
    x.fillStyle = 'rgba(0,0,0,.5)'; x.beginPath(); x.ellipse(fxT, suelo + 4, 70 * e, 9 * e, 0, 0, Math.PI * 2); x.fill();
    const pts = F.dibujar(x, pose, { x: fxT, suelo: suelo + 4, escala: e * 1.25, mira: 1, cinta: '#141012', vincha: '#d7261e', tiempo: tTiempo * 2 });
    // estela del golpe
    if (golpeEn) {
      const p = tecActual === 'combo' ? (pts.pie[0] > pts.mano[0] ? pts.pie : pts.mano) : pts[golpeEn];
      const llega = (tecActual === 'combo' ? pts.mano[0] : p[0]) - fxT;
      if (tAnim.hacia !== F.POSES.guardia && !tecActual.startsWith('bloq')) maxLlega = Math.max(maxLlega, llega);
      // la estela solo acompana al golpe que va, al regresar se apaga
      if (tAnim.hacia !== F.POSES.guardia && (!estela.length || p[0] >= estela[0].x - 2 * e)) estela.unshift({ x: p[0], y: p[1] });
      else estela.pop();
      if (estela.length > 14) estela.pop();
      for (let i = 1; i < estela.length; i++) {
        if (Math.hypot(estela[i - 1].x - estela[i].x, estela[i - 1].y - estela[i].y) < 1.5 * e) continue;
        x.beginPath(); x.moveTo(estela[i - 1].x, estela[i - 1].y); x.lineTo(estela[i].x, estela[i].y);
        x.strokeStyle = `rgba(255,${120 + i * 6},60,${(1 - i / estela.length) * .8})`;
        x.lineWidth = (1 - i / estela.length) * 14 * e; x.lineCap = 'round'; x.stroke();
      }
    }
    // contacto, puno y pie siempre, en cualquier tecnica y en cualquier momento
    const contactos = [['mano', pts.mano], ['pie', pts.pie]];
    for (const [tipo, q] of contactos) {
      const st = choque[tipo] || (choque[tipo] = { px: q[0], py: q[1], toca: false, marca: null });
      const vx = (q[0] - st.px) / Math.max(1e-3, dt), vy = (q[1] - st.py) / Math.max(1e-3, dt);
      st.px = q[0]; st.py = q[1];
      const [lx, yLocal] = aSaco(q[0], q[1]);
      const dentro = yLocal > -4 * e && yLocal < alto + 4 * e;
      // cuanto entra el puno o el pie pasando la cara de enfrente
      const entra = lx + medio;
      const bordeSin = aPantalla(-medio, yLocal)[0];
      if (dentro && entra > -1.5 * e) {
        // velocidad del borde del saco en ese punto, para el golpe relativo
        // con rotate de canvas, angulo positivo lleva la parte baja hacia el karateka
        const vSaco = -saco.v * (q[1] - cuelga);
        const vRel = vx - vSaco;
        if (!st.toca && vRel > 60 * e) {
          // impulso, masa efectiva del brazo o la pierna por su velocidad
          const mEf = tipo === 'pie' ? 6 : 2.6;
          const J = Math.min(36, mEf * (vRel / ppm) * 1.4 * (tecActual === 'combo' ? .8 : 1));
          const rr = (q[1] - cuelga) / ppm;
          saco.v -= J * rr / I;
          // la patada circular entra de lado y lo hace girar sobre su eje,
          // el puno recto casi no lo gira
          const lateral = tecActual === 'circular' || (tecActual === 'combo' && tipo === 'pie') ? 1 : tecActual === 'cuchillo' ? .45 : .12;
          saco.tv += J * lateral * .09;
          // la marca nace en el borde, apenas hacia el frente para que se vea
          st.marca = { y: Math.max(8 * e, Math.min(alto - 8 * e, yLocal)), r: (tipo === 'pie' ? 26 : 18) * e, prof: 0, t: 0, tipo, apretando: true, tw0: saco.tw - .18 };
          saco.marcas.push(st.marca);
          if (saco.marcas.length > 8) saco.marcas.shift();
          golpesSaco.push({ x: bordeSin, y: aPantalla(-medio, yLocal)[1], t: 0 });
          sonarGolpe(Math.min(1.6, J / 18));
          st.toca = true;
        }
        // mientras empuja, la marca se hunde lo que entra el puno o el pie
        if (st.toca && st.marca) { st.marca.prof = Math.max(st.marca.prof, Math.min(16 * e, Math.max(0, entra))); st.marca.apretando = entra > 0; }
      } else if (entra < -8 * e || !dentro) {
        st.toca = false; st.marca = null;
      }
    }
    // destellos donde pego
    for (let i = golpesSaco.length - 1; i >= 0; i--) {
      const g = golpesSaco[i];
      g.t += dtReal * 2.4;
      if (g.t >= 1) { golpesSaco.splice(i, 1); continue; }
      x.beginPath(); x.arc(g.x, g.y, (8 + g.t * 40) * e, 0, Math.PI * 2);
      x.strokeStyle = `rgba(255,220,140,${1 - g.t})`; x.lineWidth = 4 * e * (1 - g.t); x.stroke();
      for (let k = 0; k < 7; k++) {
        const an = Math.PI * (.55 + k / 6 * .9);
        x.beginPath();
        x.moveTo(g.x + Math.cos(an) * (10 + g.t * 26) * e, g.y + Math.sin(an) * (10 + g.t * 26) * e);
        x.lineTo(g.x + Math.cos(an) * (18 + g.t * 44) * e, g.y + Math.sin(an) * (18 + g.t * 44) * e);
        x.strokeStyle = k % 2 ? `rgba(255,74,46,${1 - g.t})` : `rgba(255,235,180,${1 - g.t})`;
        x.lineWidth = 2.5 * e; x.stroke();
      }
    }
  }

  /* ---------------- Bucle ---------------- */
  function bucle(ahora) {
    const dt = Math.min(.05, (ahora - ultimo) / 1000);
    if (!document.hidden) window.Calidad.cuadro(ahora - ultimo);
    ultimo = ahora;
    if (!document.hidden) {
      if (enPantalla(cv)) {
        const m = F.ajustar(cv);
        if (m.w !== W || m.h !== H || m.d !== D) medir();
        const pose = pasoPortada(dt);
        moverParticulas(dt);
        dibujarPortada(pose);
      }
      mini.forEach(m => pasoMini(m, dt));
      pasoTecnica(dt);
      if (F.ajustar(vuelo).d !== vD) medirVuelo();
      pasoVuelo(dt);
      dibujarVuelo(dt);
    }
    requestAnimationFrame(bucle);
  }
  addEventListener('resize', () => { medir(); medirVuelo(); });
  medir(); medirVuelo();
  requestAnimationFrame(bucle);
  if (document.fonts) document.fonts.ready.then(() => { 0; });
})();
