// Karateka dibujado por huesos. Cada pose son angulos absolutos en grados
// (0 a la derecha, 90 hacia abajo), mirando a la derecha. Se mezclan entre si.
// El pie de atras queda plantado entre poses (la cadera es la que se mueve),
// las articulaciones son de bola, el golpe trae preparacion y rebote, y las
// puntas del cinturon y de la vincha son cuerdas con peso que siguen al cuerpo.
(function () {
  const R = Math.PI / 180;
  const L = { torso: 57, cuello: 8, cabeza: 11.6, brazo: 31, ante: 28, muslo: 45, pierna: 43, pie: 16 };

  // ap, cuanto manda el pie de atras como ancla (1 plantado, 0 la cadera queda donde esta)
  const POSES = {
    firme:     { t: -90, c: 0, b1: 82, a1: 32, b2: 86, a2: 38, m1: 84, p1: 90, f1: 0, m2: 96, p2: 90, f2: 0 },
    preparado: { t: -90, c: 0, b1: 74, a1: 4, b2: 80, a2: 10, m1: 80, p1: 92, f1: 0, m2: 100, p2: 92, f2: 0 },
    guardia:   { t: -80, c: 0, b1: 34, a1: -56, b2: 76, a2: -78, m1: 50, p1: 96, f1: 6, m2: 130, p2: 112, f2: -4 },
    directo:   { t: -76, c: 4, b1: -3, a1: -3, b2: 86, a2: -84, m1: 42, p1: 88, f1: 6, m2: 142, p2: 136, f2: 0 },
    cruzado:   { t: -70, c: 6, b1: 66, a1: -92, b2: -5, a2: -5, m1: 40, p1: 86, f1: 6, m2: 144, p2: 138, f2: 0 },
    gancho:    { t: -72, c: 6, b1: 8, a1: -64, b2: 80, a2: -82, m1: 44, p1: 92, f1: 6, m2: 138, p2: 128, f2: 0 },
    cuchillo:  { t: -80, c: 0, b1: -22, a1: 8, b2: 74, a2: -72, m1: 46, p1: 94, f1: 6, m2: 136, p2: 122, f2: -4, mano1: 'a' },
    frontal:   { t: -100, c: -4, b1: 34, a1: -62, b2: 70, a2: -84, m1: -4, p1: -6, f1: -62, m2: 96, p2: 92, f2: 0 },
    lateral:   { t: -132, c: -12, b1: 66, a1: -40, b2: 110, a2: -100, m1: -14, p1: -8, f1: -96, m2: 100, p2: 84, f2: -6 },
    circular:  { t: -124, c: -10, b1: 62, a1: -30, b2: 104, a2: -124, m1: -34, p1: -30, f1: -22, m2: 102, p2: 86, f2: -8 },
    barrido:   { t: -66, c: 14, b1: 70, a1: -40, b2: 120, a2: 60, m1: 14, p1: 8, f1: 10, m2: 70, p2: 150, f2: 0, ap: .6 },
    bloqueo:   { t: -84, c: 0, b1: -56, a1: 182, b2: 112, a2: -2, m1: 52, p1: 96, f1: 6, m2: 128, p2: 110, f2: -4 },
    codo:      { t: -72, c: 6, b1: -12, a1: 178, b2: 80, a2: -84, m1: 42, p1: 88, f1: 6, m2: 142, p2: 134, f2: 0 },
    rodilla:   { t: -96, c: -2, b1: 50, a1: -40, b2: 60, a2: -40, m1: -30, p1: 80, f1: 20, m2: 94, p2: 92, f2: 0 },
    saludo:    { t: -58, c: 26, b1: 94, a1: 94, b2: 92, a2: 92, m1: 88, p1: 92, f1: 0, m2: 92, p2: 90, f2: 0, mano1: 'a', mano2: 'a', ap: .5 },
    golpeado:  { t: -116, c: -28, b1: -40, a1: -92, b2: -124, a2: -150, m1: 68, p1: 112, f1: 10, m2: 116, p2: 96, f2: -6, ap: .5 },
    voladora:  { t: -96, c: -4, b1: 40, a1: -70, b2: 120, a2: -60, m1: -12, p1: -6, f1: -60, m2: 64, p2: 168, f2: 150, y: 34, ap: 0 },
    victoria:  { t: -92, c: -10, b1: -78, a1: -96, b2: 84, a2: 36, m1: 78, p1: 92, f1: 0, m2: 102, p2: 92, f2: 0, ap: .5 }
  };
  const CAMPOS = ['t', 'c', 'b1', 'a1', 'b2', 'a2', 'm1', 'p1', 'f1', 'm2', 'p2', 'f2', 'y', 'ap'];
  const DEF = { y: 0, ap: 1 };
  const val = (p, c) => (p[c] == null ? (DEF[c] || 0) : p[c]);

  function mezcla(a, b, k) {
    const o = {};
    for (const c of CAMPOS) { const va = val(a, c); o[c] = va + (val(b, c) - va) * k; }
    o.mano1 = k < .5 ? a.mano1 : b.mano1;
    o.mano2 = k < .5 ? a.mano2 : b.mano2;
    return o;
  }

  // capsula agregada al trazo actual (todas en el mismo sentido, asi se unen)
  function capsula(ctx, ax, ay, bx, by, ra, rb) {
    const ang = Math.atan2(by - ay, bx - ax);
    ctx.moveTo(ax + Math.cos(ang + Math.PI / 2) * ra, ay + Math.sin(ang + Math.PI / 2) * ra);
    ctx.arc(ax, ay, ra, ang + Math.PI / 2, ang + Math.PI * 1.5);
    ctx.arc(bx, by, rb, ang - Math.PI / 2, ang + Math.PI / 2);
    ctx.closePath();
  }
  function bola(ctx, x, y, r) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2); }
  const dir = (g) => [Math.cos(g * R), Math.sin(g * R)];
  const mas = (a, b, k) => [a[0] + b[0] * k, a[1] + b[1] * k];
  const entre = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

  function oscurecer(hex, k) {
    if (typeof hex !== 'string' || hex[0] !== '#' || hex.length !== 7) return hex;
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(v * (1 - k))));
    return '#' + ((1 << 24) | (f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).slice(1);
  }

  // Articulaciones con la cadera en 0,0
  // codos y rodillas solo doblan hacia su lado, y nunca quedan rectos del todo
  const norm = (g) => { g = ((g + 180) % 360 + 360) % 360 - 180; return g; };
  function articular(p) {
    const q = Object.assign({}, p);
    for (const [b, a] of [['b1', 'a1'], ['b2', 'a2']]) {
      const r = norm(q[a] - q[b]);
      if (r > -5) q[a] = q[b] - 5;
      else if (r < -168) q[a] = q[b] - 168;
    }
    for (const [mm, pp] of [['m1', 'p1'], ['m2', 'p2']]) {
      const r = norm(q[pp] - q[mm]);
      if (r < 4) q[pp] = q[mm] + 4;
      else if (r > 165) q[pp] = q[mm] + 165;
    }
    return q;
  }

  function huesos(p0, k) {
    const p = articular(p0);
    const s = k || {};
    const lt = L.torso * (s.torso || 1), lb = L.brazo * (s.brazo || 1), la = L.ante * (s.brazo || 1);
    const lm = L.muslo * (s.pierna || 1), lp = L.pierna * (s.pierna || 1), lf = L.pie * (s.pierna ? (1 + s.pierna) / 2 : 1);
    const H = [0, 0];
    const u = dir(p.t);
    const n = [-u[1], u[0]];                       // hacia adelante del pecho
    const N = mas(H, u, lt);
    // la cabeza tiende a quedarse derecha, mirando al frente
    const gc = (p.t + p.c) * .65 + (-90 + p.c) * .35;
    const dc = dir(gc);
    const rc = L.cabeza * (s.cabeza || 1);
    const C = mas(N, dc, L.cuello * (s.torso || 1) * .8 + rc);
    const S = mas(N, u, -4);
    // hombros en tres cuartos, el que golpea se adelanta
    // la escapula acompaña al golpe, el hombro se estira hacia adelante
    const alc1 = Math.max(0, Math.cos(p.b1 * R)), alc2 = Math.max(0, Math.cos(p.b2 * R));
    const S1 = mas(mas(S, n, 3 + 5 * alc1), u, -1.2 * alc1);
    const S2 = mas(mas(S, n, -6 + 10 * alc2), u, -1.5 - 1.2 * alc2);
    const brazo = (Sx, b, a) => {
      const E = mas(Sx, dir(b), lb);
      return [E, mas(E, dir(a), la)];
    };
    const pierna = (m, pp, f, off) => {
      const Hh = mas(H, n, off);
      const K = mas(Hh, dir(m), lm);
      const A = mas(K, dir(pp), lp);
      const T = mas(A, dir(f), lf);
      return [Hh, K, A, T];
    };
    const [E1, W1] = brazo(S1, p.b1, p.a1), [E2, W2] = brazo(S2, p.b2, p.a2);
    // la cadera gira y sube con la patada
    const giroCad = Math.max(0, Math.min(1, (45 - p.m1) / 80));
    const P1 = pierna(p.m1, p.p1, p.f1, 2.5 + 4 * giroCad), P2 = pierna(p.m2, p.p2, p.f2, -2.5 - 2 * giroCad);
    return { H, N, C, S, S1, S2, E1, W1, E2, W2, P1, P2, u, n, dc, rc, p, giroCad };
  }

  // Punto mas bajo de la planta de un pie
  function planta(P) {
    const A = P[2], T = P[3];
    const dx = T[0] - A[0], dy = T[1] - A[1], l = Math.hypot(dx, dy) || 1;
    const d = [dx / l, dy / l], up = [d[1], -d[0]];
    const pts = [[-5, -4.5], [l * .6, -5], [l + 1.5, -3.2]].map(([a, b]) => A[1] + d[1] * a + up[1] * b);
    return Math.max.apply(null, pts);
  }

  // Ancla del pie de atras, medida en guardia con las mismas proporciones
  const refs = {};
  function refAncla(k) {
    const clave = k ? [k.torso, k.pierna, k.brazo, k.cabeza].join('|') : '';
    if (refs[clave] == null) refs[clave] = huesos(POSES.guardia, k).P2[2][0];
    return refs[clave];
  }

  // Cuerdas con peso, guardadas por lienzo y emparejadas por cercania
  const cuerdasDe = new WeakMap();
  function juegoCuerdas(ctx, clave, x, y, esc) {
    let lista = cuerdasDe.get(ctx);
    if (!lista) { lista = []; cuerdasDe.set(ctx, lista); }
    const ahora = performance.now();
    for (let i = lista.length - 1; i >= 0; i--) if (ahora - lista[i].usado > 500) lista.splice(i, 1);
    let mejor = null, dmin = 90 * esc;
    for (const c of lista) {
      if (c.clave !== clave || ahora - c.usado < 5) continue;
      const d = Math.hypot(c.x - x, c.y - y);
      if (d < dmin) { dmin = d; mejor = c; }
    }
    if (!mejor) {
      if (lista.length > 30) lista.shift();
      mejor = { clave, x, y, usado: ahora - 16, cuerdas: {} };
      lista.push(mejor);
    }
    mejor.dt = Math.min(1 / 30, Math.max(0, (ahora - mejor.usado) / 1000));
    mejor.usado = ahora; mejor.x = x; mejor.y = y;
    return mejor;
  }
  // Una cuerda en coordenadas del dispositivo: n puntos, el primero pegado al ancla
  function cuerda(juego, nombre, ax, ay, n, seg, s, empuje, t) {
    let c = juego.cuerdas[nombre];
    if (!c) {
      c = [];
      for (let i = 0; i < n; i++) c.push({ x: ax, y: ay + i * seg, px: ax, py: ay + i * seg });
      juego.cuerdas[nombre] = c;
    }
    const dt = juego.dt;
    c[0].x = ax; c[0].y = ay; c[0].px = ax; c[0].py = ay;
    const g = 1100 * s * dt * dt;
    for (let i = 1; i < n; i++) {
      const q = c[i];
      const vx = (q.x - q.px) * .94, vy = (q.y - q.py) * .94;
      q.px = q.x; q.py = q.y;
      const aleteo = Math.sin(t * 13 + i * 1.3 + nombre.length) * empuje * .35;
      q.x += vx + empuje * s * dt * dt * 900 * .6;
      q.y += vy + g + aleteo * s * dt * 60;
    }
    for (let it = 0; it < 3; it++) {
      for (let i = 1; i < n; i++) {
        const a = c[i - 1], b = c[i];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
        const f = (d - seg) / d;
        if (i === 1) { b.x -= dx * f; b.y -= dy * f; }
        else { a.x += dx * f * .5; a.y += dy * f * .5; b.x -= dx * f * .5; b.y -= dy * f * .5; }
      }
    }
    return c;
  }
  function trazarCuerda(ctx, c, ancho, color) {
    ctx.beginPath();
    ctx.moveTo(c[0].x, c[0].y);
    for (let i = 1; i < c.length - 1; i++) {
      const mx = (c[i].x + c[i + 1].x) / 2, my = (c[i].y + c[i + 1].y) / 2;
      ctx.quadraticCurveTo(c[i].x, c[i].y, mx, my);
    }
    ctx.lineTo(c[c.length - 1].x, c[c.length - 1].y);
    ctx.lineWidth = ancho; ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
  }

  // Dibuja la figura. o.x, o.suelo, o.escala, o.mira (1 o -1), o.estilo ('gi' o 'silueta')
  function dibujar(ctx, p, o) {
    const k = o.proporcion || {};
    if (o.tiempo != null) {
      // micro movimiento, el peso y la mirada nunca quedan del todo quietos
      const tt = o.tiempo;
      p = Object.assign({}, p);
      p.t += Math.sin(tt * 1.7) * .5;
      p.c = (p.c || 0) + Math.sin(tt * .9 + 1) * 1.2;
    }
    const h = huesos(p, k);
    const esc = o.escala || 1;
    const t = o.tiempo || 0;
    const m = o.mira || 1;
    const sil = o.estilo === 'silueta';
    // el pie de atras no resbala, se mueve la cadera
    const ap = val(p, 'ap');
    const dx = ap * (refAncla(o.proporcion) - h.P2[2][0]);
    const suelo = Math.max(planta(h.P1), planta(h.P2));

    const base = ctx.getTransform();
    ctx.save();
    ctx.translate(o.x, o.suelo);
    ctx.scale(esc * m, esc);
    ctx.translate(dx, -suelo - val(p, 'y'));
    if (o.giro) ctx.rotate(o.giro);
    const M = ctx.getTransform();
    const sDisp = Math.hypot(M.a, M.b);           // pixeles de pantalla por unidad

    const gi = o.gi || '#f4efe6', giSombra = o.giSombra || '#cfc6b8', borde = o.borde || '#1a1214';
    const piel = o.piel || '#c98a5e', pielSombra = o.pielSombra || '#9c6440';
    const cinta = o.cinta || '#141012';
    const cintaVista = sil ? (o.cintaSilueta || o.cinta || o.color || '#0c0a0b') : cinta;
    const lw = o.grosor || 2.2;
    const colS = o.color || '#0c0a0b', colSA = o.colorAtras || o.color || '#0c0a0b';
    const giAtras = giSombra, giAtrasSombra = oscurecer(giSombra, .16);
    const pielAtras = pielSombra;
    // luz de arriba y de la espalda, en coordenadas locales
    const luz = [-.42, -.9];
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // pieza con borde de tinta solo por fuera: trazo grueso y relleno encima
    function pieza(construir, relleno, grosor) {
      ctx.beginPath(); construir();
      if (!sil) { ctx.lineWidth = (grosor || lw) * 2; ctx.strokeStyle = borde; ctx.stroke(); }
      ctx.fillStyle = relleno; ctx.fill();
    }
    function sombreado(a, b, r, claro, oscuro) {
      if (sil) return claro;
      const dxl = b[0] - a[0], dyl = b[1] - a[1], l = Math.hypot(dxl, dyl) || 1;
      let nx = -dyl / l, ny = dxl / l;
      if (nx * luz[0] + ny * luz[1] < 0) { nx = -nx; ny = -ny; }
      const c = entre(a, b, .5);
      const g = ctx.createLinearGradient(c[0] + nx * r, c[1] + ny * r, c[0] - nx * r, c[1] - ny * r);
      g.addColorStop(0, claro); g.addColorStop(.45, claro); g.addColorStop(1, oscuro);
      return g;
    }
    function linea(a, b, c, ancho, color) {
      ctx.beginPath(); ctx.moveTo(a[0], a[1]);
      if (c) ctx.quadraticCurveTo(b[0], b[1], c[0], c[1]); else ctx.lineTo(b[0], b[1]);
      ctx.lineWidth = ancho; ctx.strokeStyle = color; ctx.stroke();
    }

    // Pie descalzo con talon, planta, empeine y dedos
    function pie(P, atras) {
      const A = P[2], T = P[3];
      const ddx = T[0] - A[0], ddy = T[1] - A[1], l = Math.hypot(ddx, ddy) || 1;
      const d = [ddx / l, ddy / l], up = [d[1], -d[0]];
      const q = (a, b) => [A[0] + d[0] * a + up[0] * b, A[1] + d[1] * a + up[1] * b];
      const color = sil ? (atras ? colSA : colS) : (atras ? pielAtras : piel);
      pieza(() => {
        // pantorrilla con su bulto atras y tobillo fino
        const dk = [A[0] - P[1][0], A[1] - P[1][1]], lk = Math.hypot(dk[0], dk[1]) || 1;
        const atrasK = [-dk[1] / lk, dk[0] / lk];
        const g1 = mas(entre(P[1], A, .38), atrasK, 2.6), g2 = mas(entre(P[1], A, .62), atrasK, 1.6);
        capsula(ctx, g1[0], g1[1], g2[0], g2[1], 7, 5.6);
        capsula(ctx, g2[0], g2[1], A[0], A[1], 5.6, 4);
      }, color, atras ? lw * .8 : lw);
      pieza(() => {
        const p0 = q(-2.5, 5), p1 = q(-6, .5), p2 = q(-4.5, -4.5), p3 = q(l * .6, -5), p4 = q(l + 1.5, -3.4), p5 = q(l + 2.2, -.8), p6 = q(l * .8, 1.6), p7 = q(l * .3, 4), p8 = q(2.5, 5.6);
        ctx.moveTo(p0[0], p0[1]);
        ctx.quadraticCurveTo(p1[0], p1[1], ...q(-5.6, -2));
        ctx.quadraticCurveTo(p2[0], p2[1], ...q(0, -5));
        ctx.lineTo(p3[0], p3[1]);
        ctx.quadraticCurveTo(p4[0], p4[1], p5[0], p5[1]);
        ctx.quadraticCurveTo(...q(l + 1.6, 1.4), p6[0], p6[1]);
        ctx.quadraticCurveTo(p7[0], p7[1], p8[0], p8[1]);
        ctx.closePath();
      }, color, atras ? lw * .8 : lw);
      if (!sil && sDisp > 1.1) {
        linea(q(l * .78, 1.2), q(l + .6, -1.2), null, .9, pielSombra);
        linea(q(l * .62, 1.8), q(l * .7, -1.6), null, .8, pielSombra);
      }
    }

    // Pierna con pantalon ancho, rodilla de bola y ruedo
    function pierna(P, atras) {
      pie(P, atras);
      const [Hh, K, A] = P;
      const ruedo = entre(K, A, .84 - (atras ? 0 : .26 * h.giroCad));
      const claro = sil ? (atras ? colSA : colS) : (atras ? giAtras : gi);
      const oscuro = atras ? giAtrasSombra : giSombra;
      pieza(() => {
        capsula(ctx, Hh[0], Hh[1], K[0], K[1], 11.4, 8.6);
        const mq = entre(Hh, K, .4);
        bola(ctx, mq[0], mq[1], 11.2);
        bola(ctx, K[0], K[1], 8.6);
        capsula(ctx, K[0], K[1], ruedo[0], ruedo[1], 8.8, 8.6);
      }, sombreado(Hh, ruedo, 11, claro, oscuro), atras ? lw * .8 : lw);
      if (!sil) {
        // pliegues y ruedo
        const dk = [A[0] - K[0], A[1] - K[1]], lk = Math.hypot(dk[0], dk[1]) || 1;
        const nk = [-dk[1] / lk, dk[0] / lk];
        linea(mas(ruedo, nk, 8), mas(ruedo, nk, -8), null, 1.3, oscuro);
        linea(mas(entre(Hh, K, .55), nk, -3), mas(K, nk, -5), mas(entre(K, A, .25), nk, -2), 1.1, oscuro);
        linea(mas(entre(K, A, .35), nk, 4), mas(entre(K, A, .5), nk, 1), null, 1, oscuro);
      }
    }

    // Mano, puño cerrado o mano de cuchillo
    function mano(E, W, abierta, color) {
      const ddx = W[0] - E[0], ddy = W[1] - E[1], l = Math.hypot(ddx, ddy) || 1;
      const d = [ddx / l, ddy / l], up = [d[1], -d[0]];
      const q = (a, b) => [W[0] + d[0] * a + up[0] * b, W[1] + d[1] * a + up[1] * b];
      if (abierta) {
        ctx.moveTo(...q(-1, 3.8));
        ctx.lineTo(...q(9, 3.2));
        ctx.quadraticCurveTo(...q(17.5, 2.6), ...q(17, -.4));
        ctx.quadraticCurveTo(...q(16.5, -2.6), ...q(9, -2.6));
        ctx.lineTo(...q(4, -3));
        ctx.quadraticCurveTo(...q(3, -6.6), ...q(.5, -5.2));
        ctx.lineTo(...q(-1, -3.8));
        ctx.closePath();
      } else {
        const c = q(4.6, 0);
        const a = Math.atan2(d[1], d[0]);
        ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(a);
        ctx.moveTo(-5.5, -5.4);
        ctx.lineTo(3, -5.6);
        ctx.quadraticCurveTo(7.2, -5.4, 7.2, -1.5);
        ctx.lineTo(7.2, 2);
        ctx.quadraticCurveTo(7, 5.6, 3, 5.6);
        ctx.lineTo(-5.5, 5.2);
        ctx.quadraticCurveTo(-7, 0, -5.5, -5.4);
        ctx.closePath();
        ctx.restore();
      }
      return { q, d, up };
    }
    function detalleMano(E, W, abierta, oscuro) {
      if (sil || sDisp < 1.1) return;
      const ddx = W[0] - E[0], ddy = W[1] - E[1], l = Math.hypot(ddx, ddy) || 1;
      const d = [ddx / l, ddy / l], up = [d[1], -d[0]];
      const q = (a, b) => [W[0] + d[0] * a + up[0] * b, W[1] + d[1] * a + up[1] * b];
      if (abierta) {
        linea(q(8, .4), q(16, .2), null, .9, oscuro);
      } else {
        // nudillos y pulgar
        linea(q(9.6, 2.4), q(9.6, -2.6), null, .9, oscuro);
        linea(q(6, 3.4), q(9.6, 3.4), null, .8, oscuro);
        linea(q(6, -.2), q(9.6, -.2), null, .8, oscuro);
        linea(q(1, -3.4), q(4.5, -1.6), q(8.2, -2.8), 1.4, oscuro);
      }
    }

    // Brazo con manga ancha, puño de la manga, codo de bola
    function brazo(S, E, W, abierta, atras) {
      const claro = sil ? (atras ? colSA : colS) : (atras ? giAtras : gi);
      const oscuro = atras ? giAtrasSombra : giSombra;
      const pc = sil ? (atras ? colSA : colS) : (atras ? pielAtras : piel);
      const M = entre(E, W, .5);
      pieza(() => {
        const M2 = entre(E, W, .3);
        capsula(ctx, M2[0], M2[1], W[0], W[1], 6.2, 3.9);
        mano(E, W, abierta, pc);
      }, pc, atras ? lw * .8 : lw);
      detalleMano(E, W, abierta, pielSombra);
      const Mc = entre(E, W, .48);
      pieza(() => {
        bola(ctx, S[0], S[1], 11.6);
        const bi = entre(S, E, .45);
        capsula(ctx, S[0], S[1], E[0], E[1], 10, 7.4);
        bola(ctx, bi[0], bi[1], 9.4);
        bola(ctx, E[0], E[1], 7.4);
        capsula(ctx, E[0], E[1], Mc[0], Mc[1], 7.4, 8.4);
      }, sombreado(S, Mc, 10, claro, oscuro), atras ? lw * .8 : lw);
      if (!sil) {
        const da = [W[0] - E[0], W[1] - E[1]], la = Math.hypot(da[0], da[1]) || 1;
        const na = [-da[1] / la, da[0] / la];
        linea(mas(Mc, na, 8.2), mas(Mc, na, -8.2), null, 1.4, oscuro);
        linea(mas(entre(S, E, .7), na, 3), mas(E, na, 1), mas(entre(E, Mc, .5), na, 4), 1, oscuro);
      }
    }

    const u = h.u, n = h.n;
    const T = (a, b) => [h.H[0] + u[0] * a + n[0] * b, h.H[1] + u[1] * a + n[1] * b];
    const lt = L.torso * (k.torso || 1);
    const ft = lt / L.torso;

    // ---- atras ----
    pierna(h.P2, true);
    brazo(h.S2, h.E2, h.W2, p.mano2 === 'a', true);

    // ---- pierna de adelante, la chaqueta le tapa el muslo ----
    pierna(h.P1, false);

    // cuello
    const rc = h.rc;
    const base1 = mas(h.C, h.dc, -rc * .7);
    pieza(() => capsula(ctx, h.N[0], h.N[1], base1[0], base1[1], 6.6, 5), sil ? colS : pielSombra, lw);

    // ---- chaqueta del gi ----
    const claroT = sil ? colS : gi;
    pieza(() => {
      // espalda y pecho anchos arriba, cintura que se afina
      const f = (a, b) => T(a * ft, b * (a > 24 ? 1.13 : a > 12 ? 1.04 : 1));
      ctx.moveTo(...f(-15, -17));
      ctx.quadraticCurveTo(...f(-9, -19.8), ...f(0, -17.6));
      ctx.quadraticCurveTo(...f(8, -12), ...f(16, -12.2));
      ctx.quadraticCurveTo(...f(26, -17.8), ...f(40, -17.2));
      ctx.quadraticCurveTo(...f(50, -16.8), ...f(54, -12.6));
      ctx.quadraticCurveTo(...f(57, -9), ...f(59, -5));
      ctx.lineTo(...f(59.5, 4));
      ctx.quadraticCurveTo(...f(58, 10), ...f(53, 14.6));
      ctx.quadraticCurveTo(...f(48, 18.2), ...f(40, 16.6));
      ctx.quadraticCurveTo(...f(36, 13), ...f(32, 12.4));
      ctx.quadraticCurveTo(...f(20, 11.4), ...f(9, 11));
      ctx.quadraticCurveTo(...f(2, 12.4), ...f(-4, 13.8));
      ctx.quadraticCurveTo(...f(-10, 15.5), ...f(-15, 16.5));
      ctx.quadraticCurveTo(...f(-17.5, 0), ...f(-15, -17));
      ctx.closePath();
    }, sil ? claroT : (() => {
      const a = T(30 * ft, -16), b = T(30 * ft, 16);
      const g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
      g.addColorStop(0, giSombra); g.addColorStop(.35, gi); g.addColorStop(1, gi);
      return g;
    })(), lw * 1.05);
    if (!sil) {
      // piel del pecho, solapas cruzadas y pliegues
      ctx.beginPath();
      ctx.moveTo(...T(lt - 2, 3)); ctx.lineTo(...T(lt - 16 * ft, 9)); ctx.lineTo(...T(lt - 3, 10)); ctx.closePath();
      ctx.fillStyle = piel; ctx.fill();
      linea(T(lt - 1, 2), T(lt - 18 * ft, 7), T(9 * ft, 13), 2.6, giSombra);
      linea(T(lt - 1, 11), T(lt - 22 * ft, 4), T(9 * ft, -2), 2.2, giSombra);
      linea(T(lt - 1, 11), T(lt - 22 * ft, 4), T(9 * ft, -2), .9, borde);
      linea(T(34 * ft, -10), T(22 * ft, -6), T(12 * ft, -9), 1.1, giSombra);
      linea(T(-4, 4), T(-12, 6), null, 1.1, giSombra);
      linea(T(42 * ft, 15), T(36 * ft, 11), T(29 * ft, 12), 1.2, giSombra);
      linea(T(47 * ft, -13.5), T(39 * ft, -11.5), T(30 * ft, -14.5), 1.2, giSombra);
      linea(T(2 * ft, -15), T(-5, -12), T(-12, -15), 1, giSombra);
    }

    // ---- cinturon ----
    const cy0 = 7 * ft;
    pieza(() => {
      ctx.moveTo(...T(cy0 - 4, -13.2));
      ctx.quadraticCurveTo(...T(cy0 - 5, 0), ...T(cy0 - 4, 12.6));
      ctx.lineTo(...T(cy0 + 4, 12.2));
      ctx.quadraticCurveTo(...T(cy0 + 3, 0), ...T(cy0 + 4, -12.8));
      ctx.closePath();
    }, cintaVista, lw * .8);
    const nudo = T(cy0, 11.5);
    pieza(() => { ctx.moveTo(nudo[0] + 4, nudo[1]); ctx.arc(nudo[0], nudo[1], 4.4, 0, Math.PI * 2); }, cintaVista, lw * .7);
    if (!sil && cinta === '#141012') {
      // la franja roja del cinturon negro
      ctx.beginPath(); ctx.moveTo(...T(cy0 - 4, -6)); ctx.lineTo(...T(cy0 + 4, -6)); ctx.lineTo(...T(cy0 + 4, -2)); ctx.lineTo(...T(cy0 - 4, -2)); ctx.closePath();
      ctx.fillStyle = '#d7261e'; ctx.fill();
    }

    // cuerdas con peso, en pixeles del dispositivo
    const viento = o.viento || 0;
    const nudoD = M.transformPoint({ x: nudo[0], y: nudo[1] });
    const juego = juegoCuerdas(ctx, (sil ? 's' : 'g') + cintaVista + (o.color || ''), nudoD.x, nudoD.y, sDisp);
    const empuje = -m * viento;
    const segC = 5.6 * sDisp * ft;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const n2 = M.transformPoint({ x: nudo[0] + n[0] * 2.6, y: nudo[1] + n[1] * 2.6 });
    const c1 = cuerda(juego, 'c1', nudoD.x, nudoD.y, 5, segC, sDisp, empuje - m * .12, t);
    const c2 = cuerda(juego, 'c2', n2.x, n2.y, 5, segC * 1.15, sDisp, empuje * 1.2 + m * .1, t + 1);
    if (!sil) { trazarCuerda(ctx, c1, 6.2 * sDisp, borde); trazarCuerda(ctx, c2, 6.2 * sDisp, borde); }
    trazarCuerda(ctx, c1, 4.2 * sDisp, cintaVista);
    trazarCuerda(ctx, c2, 4.2 * sDisp, cintaVista);
    ctx.restore();


    // ---- cabeza de perfil ----
    const dc = h.dc, fc = [-dc[1], dc[0]];             // arriba y adelante de la cara
    const C = h.C, r = rc;
    const Q = (a, b) => [C[0] + fc[0] * a * r / 12.5 + dc[0] * b * r / 12.5, C[1] + fc[1] * a * r / 12.5 + dc[1] * b * r / 12.5];
    // vincha, sus puntas van detras de la cabeza
    let vinchaNudo = null;
    if (o.vincha) {
      vinchaNudo = Q(-11.5, 5.5);
      const vd = M.transformPoint({ x: vinchaNudo[0], y: vinchaNudo[1] });
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const v1 = cuerda(juego, 'v1', vd.x, vd.y, 5, 5.6 * sDisp * (r / 12.5), sDisp, empuje * 1.3 - m * .25, t + 2);
      const v2 = cuerda(juego, 'v2', vd.x, vd.y, 5, 4.8 * sDisp * (r / 12.5), sDisp, empuje * 1.1 - m * .2, t + 3);
      if (!sil) { trazarCuerda(ctx, v1, 5.2 * sDisp, borde); trazarCuerda(ctx, v2, 5.2 * sDisp, borde); }
      trazarCuerda(ctx, v1, 3.4 * sDisp, o.vincha); trazarCuerda(ctx, v2, 3.4 * sDisp, o.vincha);
      ctx.restore();
    }
    pieza(() => {
      // craneo
      ctx.moveTo(...Q(9.5, 8));
      ctx.ellipse(C[0], C[1], r, r * 1.04, Math.atan2(fc[1], fc[0]), -.75, -Math.PI * 1.25, true);
      // nuca, mandibula, menton y perfil
      ctx.quadraticCurveTo(...Q(-8, -11), ...Q(-1, -11.5));
      ctx.quadraticCurveTo(...Q(6, -14.5), ...Q(10.5, -11.2));
      ctx.quadraticCurveTo(...Q(12.4, -9.5), ...Q(11.6, -7.2));
      ctx.lineTo(...Q(12.6, -5.6));
      ctx.lineTo(...Q(12.2, -4.4));
      ctx.quadraticCurveTo(...Q(14.8, -2.6), ...Q(14.4, -1));
      ctx.quadraticCurveTo(...Q(13.4, 1.5), ...Q(12.4, 3.4));
      ctx.quadraticCurveTo(...Q(12.6, 6), ...Q(9.5, 8));
      ctx.closePath();
    }, sil ? colS : piel, lw);
    if (!sil) {
      // pelo
      ctx.beginPath();
      ctx.moveTo(...Q(9.2, 8.6));
      ctx.quadraticCurveTo(...Q(4, 15.5), ...Q(-5, 13));
      ctx.quadraticCurveTo(...Q(-13.5, 9), ...Q(-12.6, -1));
      ctx.quadraticCurveTo(...Q(-11, -6.5), ...Q(-8.4, -8));
      ctx.quadraticCurveTo(...Q(-7, -2), ...Q(-3.5, 1.5));
      ctx.quadraticCurveTo(...Q(2, 6.5), ...Q(9.2, 8.6));
      ctx.closePath();
      ctx.fillStyle = o.pelo || '#1b1214'; ctx.fill();
      // oreja
      ctx.beginPath(); ctx.ellipse(...Q(-1.2, -.6), 2.5 * r / 12.5, 3.6 * r / 12.5, Math.atan2(fc[1], fc[0]), 0, Math.PI * 2);
      ctx.fillStyle = pielSombra; ctx.fill();
      linea(Q(-1.4, 1.6), Q(-.2, -.6), Q(-1.6, -2.6), .9, oscurecer(pielSombra, .25));
      // ceja, ojo, boca
      linea(Q(5.8, 4.6), Q(8.5, 5.6), Q(11.2, 4.2), 1.9, o.pelo || '#1b1214');
      ctx.beginPath(); ctx.ellipse(...Q(8.6, 1.9), 1.1 * r / 12.5, 1.7 * r / 12.5, Math.atan2(fc[1], fc[0]), 0, Math.PI * 2);
      ctx.fillStyle = borde; ctx.fill();
      linea(Q(10, -6.4), Q(12.1, -6.2), null, 1, oscurecer(pielSombra, .2));
      linea(Q(6, -2), Q(9, -4.5), null, .8, pielSombra);
    }
    if (o.vincha) {
      pieza(() => {
        const a1 = Q(-12.4, 6.6), a2 = Q(10.8, 8.4), b1 = Q(10.2, 4.4), b2 = Q(-12.8, 2.4);
        ctx.moveTo(a1[0], a1[1]);
        ctx.quadraticCurveTo(...Q(0, 9.6), a2[0], a2[1]);
        ctx.lineTo(b1[0], b1[1]);
        ctx.quadraticCurveTo(...Q(0, 5.4), b2[0], b2[1]);
        ctx.closePath();
        bola(ctx, vinchaNudo[0], vinchaNudo[1], 2.8);
      }, o.vincha, lw * .7);
    }

    // ---- brazo de adelante ----
    brazo(h.S1, h.E1, h.W1, p.mano1 === 'a', false);
    ctx.restore();

    // posiciones en las coordenadas de quien llama, para chispas y golpes
    const inv = base.inverse();
    const aPant = (q) => { const d = M.transformPoint({ x: q[0], y: q[1] }); const c = inv.transformPoint(d); return [c.x, c.y]; };
    return { mano: aPant(mas(h.W1, dir(h.p.a1), 5)), mano2: aPant(mas(h.W2, dir(h.p.a2), 5)), pie: aPant(h.P1[3]), cabeza: aPant(h.C), cadera: aPant(h.H) };
  }

  // Secuencia de poses en el tiempo
  function Animador(inicial) {
    this.actual = Object.assign({}, POSES[inicial || 'guardia']);
    this.desde = this.actual; this.hacia = this.actual;
    this.t = 1; this.dur = 1; this.cola = []; this.reposo = inicial || 'guardia'; this.espera = 0;
    this.aterriza = 0;
  }
  const suave = (x) => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const salida = (x) => { const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  // golpe, primero se carga un poco hacia atras, despues sale rapido y se pasa un poco
  const golpe = (x) => x < .2 ? -.12 * Math.sin(x / .2 * Math.PI / 2) : -.12 + 1.12 * salida((x - .2) / .8);
  Animador.prototype.a = function (pose, dur, quieto, curva) {
    this.cola.push({ p: typeof pose === 'string' ? POSES[pose] : pose, d: dur, q: quieto || 0, c: curva });
    return this;
  };
  Animador.prototype.ya = function (pose, dur, quieto, curva) { this.cola = []; this.espera = 0; this.t = 1; return this.a(pose, dur, quieto, curva); };
  Animador.prototype.paso = function (dt) {
    let out;
    if (this.t < 1) {
      this.t = Math.min(1, this.t + dt / this.dur);
      const k = this.curva === 'golpe' ? golpe(this.t) : suave(this.t);
      this.actual = mezcla(this.desde, this.hacia, k);
      if (this.t >= 1 && val(this.desde, 'y') > 10 && val(this.hacia, 'y') < 1) this.aterriza = .22;
      out = this.actual;
    } else if (this.espera > 0) {
      this.espera -= dt; out = this.actual;
    } else {
      const sig = this.cola.shift();
      if (sig) {
        this.desde = this.actual; this.hacia = sig.p; this.dur = sig.d; this.t = 0; this.espera = sig.q; this.curva = sig.c;
      } else if (this.hacia !== POSES[this.reposo] && this.reposo) {
        this.desde = this.actual; this.hacia = POSES[this.reposo]; this.dur = .35; this.t = 0; this.curva = null;
      }
      out = this.actual;
    }
    // al caer de un salto, las rodillas absorben el peso
    if (this.aterriza > 0) {
      this.aterriza = Math.max(0, this.aterriza - dt);
      const s = Math.sin(this.aterriza / .22 * Math.PI);
      out = Object.assign({}, out);
      out.m1 -= 10 * s; out.p1 += 12 * s; out.m2 += 10 * s; out.p2 -= 8 * s; out.t += 6 * s;
    }
    return out;
  };
  Animador.prototype.libre = function () { return this.t >= 1 && this.espera <= 0 && this.cola.length === 0; };

  // Respiracion en reposo
  function respira(p, t, fuerza) {
    const f = fuerza == null ? 1 : fuerza;
    const o = Object.assign({}, p);
    o.t += Math.sin(t * 2.2) * 1.4 * f;
    o.b1 += Math.sin(t * 2.2 + .5) * 2 * f;
    o.b2 += Math.sin(t * 2.2 + .9) * 2 * f;
    o.m1 += Math.sin(t * 2.2) * 1.2 * f;
    o.m2 -= Math.sin(t * 2.2) * 1.2 * f;
    return o;
  }

  // Lienzo nitido en pantallas de alta densidad
  // El tamano se guarda y lo actualiza un ResizeObserver, asi el bucle de
  // dibujo nunca obliga al navegador a recalcular la pagina en cada cuadro.
  const medidas = new WeakMap();
  // Calidad adaptable, si los cuadros tardan se baja la densidad del dibujo
  // y se sube otra vez cuando sobra tiempo. Asi la animacion nunca se traba.
  const Calidad = {
    nivel: 1, ver: 0, prom: 16, lento: 0, sobra: 0,
    cuadro(dtMs) {
      if (dtMs > 200) return;
      this.prom += (dtMs - this.prom) * .08;
      if (this.prom > 21) { this.lento += dtMs; this.sobra = 0; } else if (this.prom < 15) { this.sobra += dtMs; this.lento = 0; } else { this.lento = 0; this.sobra = 0; }
      if (this.lento > 1200 && this.nivel > .6) { this.nivel = Math.max(.6, this.nivel - .15); this.ver++; this.lento = 0; this.prom = 16; }
      if (this.sobra > 5000 && this.nivel < 1) { this.nivel = Math.min(1, this.nivel + .1); this.ver++; this.sobra = 0; }
    }
  };
  window.Calidad = Calidad;
  const vigia = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(es => {
    es.forEach(e => {
      const m = medidas.get(e.target);
      if (m) { m.w = e.contentRect.width; m.h = e.contentRect.height; m.sucio = true; }
    });
  }) : null;
  function ajustar(cv) {
    let m = medidas.get(cv);
    if (!m || !vigia) {
      const r = cv.getBoundingClientRect();
      m = { w: r.width, h: r.height, sucio: true };
      medidas.set(cv, m);
      if (vigia) vigia.observe(cv);
    }
    if (m.sucio || m.ver !== Calidad.ver) {
      m.ver = Calidad.ver;
      const d = Math.max(.75, Math.min(devicePixelRatio || 1, 2) * Calidad.nivel);
      const w = Math.max(1, Math.round(m.w * d)), h = Math.max(1, Math.round(m.h * d));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      m.d = d; m.sucio = false;
    }
    return { w: m.w, h: m.h, d: m.d };
  }

  window.Figura = { POSES, mezcla, dibujar, huesos, Animador, respira, ajustar };
})();
