// Portada con el dragon alrededor del karateka, el dragon que vuela por toda
// la pagina, las figuras de las clases y la escena de tecnicas.
(function () {
  const F = window.Figura;
  const enPantalla = (el) => {
    if (!el || el.offsetParent === null) return false;
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight && r.width > 0;
  };
  const azar = (a, b) => a + Math.random() * (b - a);

  // Flor de plumeria, la flor de Hawai
  function plumeria(ctx, x, y, r, giro, alfa) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(giro); ctx.globalAlpha = alfa;
    for (let i = 0; i < 5; i++) {
      ctx.rotate(Math.PI * 2 / 5);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(r * .2, -r * .5, r * 1.1, -r * .7, r * 1.05, -r * .1);
      ctx.bezierCurveTo(r * .9, r * .2, r * .3, r * .15, 0, 0);
      ctx.fillStyle = '#fff6e8'; ctx.fill();
    }
    ctx.beginPath(); ctx.arc(0, 0, r * .28, 0, Math.PI * 2); ctx.fillStyle = '#f4c542'; ctx.fill();
    ctx.restore();
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
    const m = F.ajustar(cv); W = m.w; H = m.h; D = m.d;
    const tel = W < 760;
    esc = Math.min(H / 210 * (tel ? .36 : .5), W / 210 * (tel ? .62 : .5));
    fx = tel ? W * .5 : W * .66;
    fy = tel ? H * .42 : H * .86;
    capas = [
      { v: volcanes(W, fy - 4, 7, H * .30), c: '#2a110e', k: .02 },
      { v: volcanes(W, fy + 2, 21, H * .2), c: '#1c0b0a', k: .05 },
      { v: volcanes(W, fy + 6, 43, H * .11), c: '#110807', k: .09 }
    ];
    dragon.ancho = 19 * esc; dragon.sep = 6.6 * esc;
    if (!dragon.puntos.length) {
      // nace ya enroscado, se simulan unos segundos de vuelo
      const o = orbita(theta - 6);
      dragon.colocar(o[0], o[1], 0);
      for (let k = 0; k <= 360; k++) { const q = orbita(theta - 6 + k / 60); dragon.mover(q[0], q[1], q[2], 1 / 60); }
    }
    while (petalos.length < (tel ? 14 : 26)) petalos.push(nuevoPetalo(true));
  }
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
    dragon.mover(o[0] + (mx - .5) * 30, o[1] + (my - .5) * 20, o[2], dt);
    // fuego al rugir
    if (rugido > .3) {
      const b = dragon.boquilla();
      for (let i = 0; i < 3; i++) fuego.push({ x: b.x, y: b.y, vx: Math.cos(b.ang + azar(-.3, .3)) * azar(200, 420) * esc, vy: Math.sin(b.ang + azar(-.3, .3)) * azar(200, 420) * esc, v: 1, r: azar(5, 12) * esc });
    }
    // chispas que suben
    if (Math.random() < dt * 14) chispas.push({ x: azar(0, W), y: H + 10, vy: -azar(30, 90), vx: azar(-10, 10), v: azar(.6, 1), r: azar(.8, 2.2) });
    return pose;
  }

  function dibujarPortada(pose) {
    ctx.setTransform(D, 0, 0, D, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const px = (mx - .5), py = (my - .5);
    const alto = 210 * esc;
    // sol
    const sx = fx - px * 20, sy = fy - alto * .62 - py * 12, sr = Math.min(W, H) * (W < 760 ? .36 : .34);
    const g = ctx.createRadialGradient(sx, sy, sr * .1, sx, sy, sr);
    g.addColorStop(0, '#ff7a45'); g.addColorStop(.55, '#e2321f'); g.addColorStop(.98, '#a5160f'); g.addColorStop(1, 'rgba(165,22,15,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
    const halo = ctx.createRadialGradient(sx, sy, sr, sx, sy, sr * 1.8);
    halo.addColorStop(0, 'rgba(255,90,40,.28)'); halo.addColorStop(1, 'rgba(255,90,40,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(sx, sy, sr * 1.8, 0, Math.PI * 2); ctx.fill();
    // rayas sobre la parte baja del sol
    ctx.fillStyle = '#1a0b0a';
    for (let i = 0; i < 6; i++) {
      const yy = sy + sr * (.25 + i * .14), hh = 2 + i * 2.2;
      ctx.fillRect(sx - sr, yy, sr * 2, hh);
    }
    // enso de pincel dorado girando
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(tiempo * .12);
    for (let i = 0; i < 60; i++) {
      const a0 = i / 60 * Math.PI * 1.75, a1 = (i + 1.3) / 60 * Math.PI * 1.75;
      ctx.beginPath(); ctx.arc(0, 0, sr * 1.08, a0, a1);
      ctx.strokeStyle = `rgba(232,176,74,${.15 + .5 * Math.sin(i / 60 * Math.PI)})`;
      ctx.lineWidth = 1 + 6 * Math.sin(i / 60 * Math.PI); ctx.stroke();
    }
    ctx.restore();
    // volcanes y humo del de Fuego
    capas.forEach((c, i) => {
      ctx.save(); ctx.translate(-px * W * c.k, -py * 10 * c.k * 10);
      ctx.beginPath(); c.v.pts.forEach((p, j) => j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.lineTo(W + 60, H); ctx.lineTo(-60, H); ctx.closePath();
      ctx.fillStyle = c.c; ctx.fill();
      if (i === 0) {
        const p = c.v.picos.reduce((a, b) => b.h > a.h ? b : a);
        for (let k = 0; k < 7; k++) {
          const f = (tiempo * .08 + k / 7) % 1;
          ctx.beginPath(); ctx.arc(p.x - p.a * .01 + f * 60 + Math.sin(f * 6 + k) * 8, fy - 4 - p.h - f * 90, 6 + f * 22, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(90,40,30,${.35 * (1 - f)})`; ctx.fill();
        }
      }
      ctx.restore();
    });
    // piso con reflejo
    const pg = ctx.createLinearGradient(0, fy, 0, H);
    pg.addColorStop(0, '#120807'); pg.addColorStop(1, '#0c0a0b');
    ctx.fillStyle = pg; ctx.fillRect(0, fy + 6, W, H - fy);
    const rf = ctx.createRadialGradient(fx, fy + 8, 0, fx, fy + 8, W * .35);
    rf.addColorStop(0, 'rgba(255,90,40,.25)'); rf.addColorStop(1, 'rgba(255,90,40,0)');
    ctx.fillStyle = rf; ctx.fillRect(0, fy + 6, W, H - fy);
    // chispas
    chispas.forEach(c => { ctx.globalAlpha = c.v; ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill(); });
    ctx.globalAlpha = 1;
    // sombra en el piso
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.beginPath(); ctx.ellipse(fx, fy + 6, 70 * esc, 9 * esc, 0, 0, Math.PI * 2); ctx.fill();

    const prof = (z) => .82 + .22 * (z + 1) / 2;
    // la perla va un poco adelante de la cabeza
    const pq = orbita(theta + .42);
    const perla = () => Dragon.perla(ctx, pq[0] + (mx - .5) * 30, pq[1] + (my - .5) * 20, 7 * esc * prof(pq[2]), tiempo);
    if (pq[2] < 0) perla();
    // dragon por detras
    dragon.dibujar(ctx, { filtro: (i) => dragon.puntos[i].z < 0, prof });
    // karateka en tinta con borde dorado
    ctx.save();
    ctx.shadowColor = 'rgba(255,150,60,.75)'; ctx.shadowBlur = 22 * D;
    F.dibujar(ctx, pose, { x: fx, suelo: fy + 6, escala: esc, mira: 1, cinta: '#141012', vincha: '#d7261e', tiempo, viento: .6 + rugido });
    ctx.restore();
    // dragon por delante
    dragon.dibujar(ctx, { filtro: (i) => dragon.puntos[i].z >= 0, prof });
    if (pq[2] >= 0) perla();
    // fuego
    ctx.globalCompositeOperation = 'lighter';
    fuego.forEach(f => {
      const gr = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      gr.addColorStop(0, `rgba(255,240,180,${f.v})`); gr.addColorStop(.5, `rgba(255,120,30,${f.v * .7})`); gr.addColorStop(1, 'rgba(200,30,10,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
    });
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
  function medirVuelo() { const m = F.ajustar(vuelo); vW = m.w; vH = m.h; vD = m.d; }
  function pasada(rapida) {
    V.estado = 'pasada';
    V.dir = Math.random() < .5 ? 1 : -1;
    V.x = V.dir > 0 ? -80 : vW + 80;
    V.base = azar(vH * .22, vH * .78);
    V.f = azar(0, 6); V.vel = rapida ? 900 : azar(360, 480);
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
      const g = vctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      g.addColorStop(0, `rgba(255,245,200,${l.v})`); g.addColorStop(.45, `rgba(255,140,40,${l.v * .8})`); g.addColorStop(1, 'rgba(210,30,10,0)');
      vctx.fillStyle = g; vctx.beginPath(); vctx.arc(l.x, l.y, l.r, 0, Math.PI * 2); vctx.fill();
    }
    vctx.globalCompositeOperation = 'source-over';
  }
  function pasoVuelo(dt) {
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
      V.y = V.base + Math.sin(V.f * 4.6) * 80 + Math.sin(V.f * 1.3) * 50;
      volador.mover(V.x, V.y, 0, dt);
      volador.boca += ((Math.sin(V.f * 1.7) > .8 ? 1.1 : 0) - volador.boca) * Math.min(1, dt * 8);
      const cola = volador.n * volador.sep + 120;
      if ((V.dir > 0 && V.x > vW + cola) || (V.dir < 0 && V.x < -cola)) { V.estado = 'fuera'; V.espera = azar(6, 11); }
    } else if (V.estado === 'llamado') {
      // va hacia el toque, da una vuelta y se va
      const m = V.meta;
      V.ang += dt * 4.2;
      const r = 70;
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
  function dibujarVuelo(dt) {
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
    guardia:  { nom: 'Guardia', seq: [['guardia', .4, 1.4]], parte: null },
    directo:  { nom: 'Puño directo', seq: [['directo', .14, .5], ['guardia', .35, .8]], parte: 'mano' },
    cuchillo: { nom: 'Mano de cuchillo', seq: [['cuchillo', .18, .5], ['guardia', .35, .8]], parte: 'mano' },
    frontal:  { nom: 'Patada frontal', seq: [['frontal', .2, .5], ['guardia', .4, .8]], parte: 'pie' },
    circular: { nom: 'Patada circular', seq: [['circular', .24, .5], ['guardia', .45, .8]], parte: 'pie' },
    bloqueo:  { nom: 'Bloqueo alto', seq: [['bloqueo', .18, .7], ['guardia', .35, .8]], parte: 'mano' },
    combo:    { nom: 'Combo Kempo', seq: [['directo', .1, .08], ['cruzado', .1, .08], ['cuchillo', .12, .08], ['codo', .1, .08], ['circular', .2, .4], ['guardia', .4, 1]], parte: 'mano' },
    saludo:   { nom: 'Saludo', seq: [['firme', .5, .4], ['saludo', .6, .9], ['firme', .5, .5], ['guardia', .5, .8]], parte: null }
  };
  let tecActual = 'guardia', tTiempo = 0, tEspera = 0, estela = [], saco = { a: 0, v: 0 };
  const nombreTec = document.getElementById('tec-nombre');
  document.getElementById('tec-botones').addEventListener('click', e => {
    const b = e.target.closest('.tec-btn');
    if (!b) return;
    document.querySelectorAll('.tec-btn').forEach(x => x.classList.toggle('activo', x === b));
    tecActual = b.dataset.tec; tEspera = 0; estela = [];
    tAnim.cola = []; tAnim.t = 1; tAnim.espera = 0;
    nombreTec.textContent = TEC[tecActual].nom;
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
    const kx = s.w * .16, ky = s.h * .1;
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
    // saco de golpeo
    const bx = s.w * .72, by = suelo - 230 * e;
    const golpeEn = TEC[tecActual].parte;
    saco.v += (-saco.a * 40 - saco.v * 4) * dt * 3; saco.a += saco.v * dt * 3;
    x.save(); x.translate(bx, s.h * .02); x.rotate(saco.a);
    x.strokeStyle = '#3a2a20'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, by - s.h * .02); x.stroke();
    const sg = x.createLinearGradient(-30 * e, 0, 30 * e, 0);
    sg.addColorStop(0, '#5a0f0b'); sg.addColorStop(.5, '#b3211a'); sg.addColorStop(1, '#4a0c09');
    x.fillStyle = sg;
    x.beginPath(); x.roundRect(-30 * e, by - s.h * .02, 60 * e, 170 * e, 22 * e); x.fill();
    x.fillStyle = 'rgba(232,176,74,.8)'; x.fillRect(-30 * e, by - s.h * .02 + 30 * e, 60 * e, 6 * e); x.fillRect(-30 * e, by - s.h * .02 + 130 * e, 60 * e, 6 * e);
    x.restore();
    // figura
    const fxT = s.w * .44;
    x.fillStyle = 'rgba(0,0,0,.5)'; x.beginPath(); x.ellipse(fxT, suelo + 4, 70 * e, 9 * e, 0, 0, Math.PI * 2); x.fill();
    const pts = F.dibujar(x, pose, { x: fxT, suelo: suelo + 4, escala: e * 1.25, mira: 1, cinta: '#141012', vincha: '#d7261e', tiempo: tTiempo * 2 });
    // estela del golpe
    if (golpeEn) {
      const p = pts[golpeEn];
      estela.unshift({ x: p[0], y: p[1] });
      if (estela.length > 14) estela.pop();
      for (let i = 1; i < estela.length; i++) {
        x.beginPath(); x.moveTo(estela[i - 1].x, estela[i - 1].y); x.lineTo(estela[i].x, estela[i].y);
        x.strokeStyle = `rgba(255,${120 + i * 6},60,${(1 - i / estela.length) * .8})`;
        x.lineWidth = (1 - i / estela.length) * 14 * e; x.lineCap = 'round'; x.stroke();
      }
      if (p[0] > bx - 40 * e && Math.abs(saco.a) < .05 && tAnim.t > .5 && tAnim.t < .9) saco.v += .9;
    }
  }

  /* ---------------- Bucle ---------------- */
  function bucle(ahora) {
    const dt = Math.min(.05, (ahora - ultimo) / 1000);
    ultimo = ahora;
    if (!document.hidden) {
      if (enPantalla(cv)) {
        if (cv.width !== Math.round(cv.getBoundingClientRect().width * Math.min(devicePixelRatio || 1, 2))) medir();
        const pose = pasoPortada(dt);
        moverParticulas(dt);
        dibujarPortada(pose);
      }
      mini.forEach(m => pasoMini(m, dt));
      pasoTecnica(dt);
      if (vuelo.width !== Math.round(innerWidth * Math.min(devicePixelRatio || 1, 2))) medirVuelo();
      pasoVuelo(dt);
      dibujarVuelo(dt);
    }
    requestAnimationFrame(bucle);
  }
  addEventListener('resize', () => { medir(); medirVuelo(); });
  medir(); medirVuelo();
  requestAnimationFrame(bucle);
  if (document.fonts) document.fonts.ready.then(() => { document.querySelectorAll('[data-logo]').forEach(s => window.pintarLogo && window.pintarLogo(s, !s.classList.contains('logo-mini'))); });
})();
