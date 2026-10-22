// Karateka dibujado por huesos. Cada pose son angulos absolutos en grados
// (0 a la derecha, 90 hacia abajo), mirando a la derecha. Se mezclan entre si.
(function () {
  const R = Math.PI / 180;
  const L = { torso: 56, cuello: 7, cabeza: 12.5, brazo: 31, ante: 29, muslo: 44, pierna: 42, pie: 16 };

  const POSES = {
    firme:    { t: -90, c: 0, b1: 82, a1: 32, b2: 86, a2: 38, m1: 84, p1: 90, f1: 0, m2: 96, p2: 90, f2: 0 },
    guardia:  { t: -80, c: 0, b1: 34, a1: -56, b2: 76, a2: -78, m1: 50, p1: 96, f1: 6, m2: 130, p2: 112, f2: -4 },
    directo:  { t: -76, c: 4, b1: -3, a1: -3, b2: 86, a2: -84, m1: 42, p1: 88, f1: 6, m2: 142, p2: 136, f2: 0 },
    cruzado:  { t: -70, c: 6, b1: 66, a1: -92, b2: -5, a2: -5, m1: 40, p1: 86, f1: 6, m2: 144, p2: 138, f2: 0 },
    cuchillo: { t: -80, c: 0, b1: -22, a1: 8, b2: 74, a2: -72, m1: 46, p1: 94, f1: 6, m2: 136, p2: 122, f2: -4, mano1: 'a' },
    frontal:  { t: -100, c: -4, b1: 34, a1: -62, b2: 70, a2: -84, m1: -4, p1: -6, f1: -62, m2: 96, p2: 92, f2: 0 },
    circular: { t: -124, c: -10, b1: 62, a1: -30, b2: 104, a2: -124, m1: -34, p1: -30, f1: -22, m2: 102, p2: 86, f2: -8 },
    bloqueo:  { t: -84, c: 0, b1: -56, a1: 182, b2: 112, a2: -2, m1: 52, p1: 96, f1: 6, m2: 128, p2: 110, f2: -4 },
    codo:     { t: -72, c: 6, b1: -12, a1: 178, b2: 80, a2: -84, m1: 42, p1: 88, f1: 6, m2: 142, p2: 134, f2: 0 },
    rodilla:  { t: -96, c: -2, b1: 50, a1: -40, b2: 60, a2: -40, m1: -30, p1: 80, f1: 20, m2: 94, p2: 92, f2: 0 },
    saludo:   { t: -58, c: 26, b1: 94, a1: 94, b2: 92, a2: 92, m1: 88, p1: 92, f1: 0, m2: 92, p2: 90, f2: 0, mano1: 'a', mano2: 'a' },
    golpeado: { t: -116, c: -28, b1: -40, a1: -92, b2: -124, a2: -150, m1: 68, p1: 112, f1: 10, m2: 116, p2: 96, f2: -6 },
    voladora: { t: -96, c: -4, b1: 40, a1: -70, b2: 120, a2: -60, m1: -12, p1: -10, f1: -60, m2: 126, p2: 36, f2: 60, y: 34 },
    victoria: { t: -92, c: -10, b1: -78, a1: -96, b2: 84, a2: 36, m1: 78, p1: 92, f1: 0, m2: 102, p2: 92, f2: 0 }
  };
  const CAMPOS = ['t', 'c', 'b1', 'a1', 'b2', 'a2', 'm1', 'p1', 'f1', 'm2', 'p2', 'f2', 'y'];

  function mezcla(a, b, k) {
    const o = {};
    for (const c of CAMPOS) o[c] = (a[c] || 0) + ((b[c] || 0) - (a[c] || 0)) * k;
    o.mano1 = k < .5 ? a.mano1 : b.mano1;
    o.mano2 = k < .5 ? a.mano2 : b.mano2;
    return o;
  }

  function cap(ctx, ax, ay, bx, by, ra, rb) {
    const ang = Math.atan2(by - ay, bx - ax);
    ctx.beginPath();
    ctx.arc(ax, ay, ra, ang + Math.PI / 2, ang + Math.PI * 1.5);
    ctx.arc(bx, by, rb, ang - Math.PI / 2, ang + Math.PI / 2);
    ctx.closePath();
  }
  const dir = (g) => [Math.cos(g * R), Math.sin(g * R)];

  // Calcula las articulaciones de una pose con la cadera en 0,0
  function huesos(p, k) {
    const s = k || {};
    const lt = L.torso * (s.torso || 1), lb = L.brazo * (s.brazo || 1), la = L.ante * (s.brazo || 1);
    const lm = L.muslo * (s.pierna || 1), lp = L.pierna * (s.pierna || 1), lf = L.pie;
    const H = [0, 0];
    const dt = dir(p.t);
    const N = [H[0] + dt[0] * lt, H[1] + dt[1] * lt];
    const dc = dir(p.t + p.c);
    const C = [N[0] + dc[0] * (L.cuello + L.cabeza * (s.cabeza || 1)), N[1] + dc[1] * (L.cuello + L.cabeza * (s.cabeza || 1))];
    const S = [N[0] - dt[0] * 4, N[1] - dt[1] * 4];
    const brazo = (b, a) => {
      const E = [S[0] + dir(b)[0] * lb, S[1] + dir(b)[1] * lb];
      const W = [E[0] + dir(a)[0] * la, E[1] + dir(a)[1] * la];
      return [E, W];
    };
    const pierna = (m, pp, f, off) => {
      const Hh = [H[0] + off, H[1]];
      const K = [Hh[0] + dir(m)[0] * lm, Hh[1] + dir(m)[1] * lm];
      const A = [K[0] + dir(pp)[0] * lp, K[1] + dir(pp)[1] * lp];
      const T = [A[0] + dir(f)[0] * lf, A[1] + dir(f)[1] * lf];
      return [Hh, K, A, T];
    };
    const [E1, W1] = brazo(p.b1, p.a1), [E2, W2] = brazo(p.b2, p.a2);
    const P1 = pierna(p.m1, p.p1, p.f1, 2), P2 = pierna(p.m2, p.p2, p.f2, -2);
    return { H, N, C, S, E1, W1, E2, W2, P1, P2 };
  }

  // Dibuja la figura. o.x, o.suelo, o.escala, o.mira (1 o -1), o.estilo ('gi' o 'silueta')
  function dibujar(ctx, p, o) {
    const k = o.proporcion || {};
    const h = huesos(p, k);
    const suelo = Math.max(h.P1[2][1], h.P2[2][1], h.P1[3][1] - 2, h.P2[3][1] - 2) + 4;
    const esc = o.escala || 1;
    const t = o.tiempo || 0;
    ctx.save();
    ctx.translate(o.x, o.suelo);
    ctx.scale(esc * (o.mira || 1), esc);
    ctx.translate(0, -suelo - (p.y || 0));
    if (o.giro) ctx.rotate(o.giro);

    const sil = o.estilo === 'silueta';
    const gi = o.gi || '#f4efe6', giSombra = o.giSombra || '#cfc6b8', borde = o.borde || '#1a1214';
    const piel = o.piel || '#c98a5e', pielSombra = o.pielSombra || '#9c6440';
    const cinta = o.cinta || '#141012';
    const lw = (o.grosor || 2.4);
    const relleno = (c) => { ctx.fillStyle = c; ctx.fill(); if (!sil) { ctx.lineWidth = lw; ctx.strokeStyle = borde; ctx.stroke(); } };
    const col = (a, b) => sil ? (o.color || '#0c0a0b') : a;
    const colAtras = (a) => sil ? (o.colorAtras || o.color || '#0c0a0b') : a;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    const cab = k.cabeza || 1;

    const pie = (P, atras) => {
      cap(ctx, P[2][0], P[2][1], P[3][0], P[3][1], 4.6, 3.6); relleno(atras ? colAtras(pielSombra) : col(piel));
    };
    const pierna = (P, atras) => {
      const c1 = atras ? colAtras(giSombra) : col(gi);
      pie(P, atras);
      cap(ctx, P[1][0], P[1][1], P[2][0], P[2][1], 8, 7.4); relleno(c1);
      cap(ctx, P[0][0], P[0][1], P[1][0], P[1][1], 10.5, 8.6); relleno(c1);
      if (!sil) {
        ctx.beginPath(); ctx.arc(P[1][0], P[1][1], 8.4, 0, Math.PI * 2); ctx.fillStyle = c1; ctx.fill();
      }
    };
    const brazo = (E, W, S, abierta, atras) => {
      const c1 = atras ? colAtras(giSombra) : col(gi);
      const cp = atras ? colAtras(pielSombra) : col(piel);
      const ax = W[0] - E[0], ay = W[1] - E[1];
      cap(ctx, E[0], E[1], W[0], W[1], 5.2, 4.2); relleno(cp);
      // mano
      if (abierta) {
        const g = Math.atan2(ay, ax);
        ctx.save(); ctx.translate(W[0] + Math.cos(g) * 5, W[1] + Math.sin(g) * 5); ctx.rotate(g);
        ctx.beginPath(); ctx.ellipse(0, 0, 8.5, 4.2, 0, 0, Math.PI * 2); ctx.restore(); relleno(cp);
      } else {
        ctx.beginPath(); ctx.arc(W[0] + ax / 29 * 3, W[1] + ay / 29 * 3, 6.4, 0, Math.PI * 2); relleno(cp);
      }
      // manga hasta media pierna del antebrazo
      const M = [E[0] + ax * .5, E[1] + ay * .5];
      cap(ctx, E[0], E[1], M[0], M[1], 7, 7.6); relleno(c1);
      cap(ctx, S[0], S[1], E[0], E[1], 8.6, 7.2); relleno(c1);
    };

    // atras
    pierna(h.P2, true);
    brazo(h.E2, h.W2, h.S, p.mano2 === 'a', true);
    // torso
    const dt = dir(p.t), nt = [-dt[1], dt[0]];
    const B = [h.H[0] + dt[0] * 8, h.H[1] + dt[1] * 8];
    // falda del gi
    ctx.beginPath();
    ctx.moveTo(B[0] + nt[0] * 13, B[1] + nt[1] * 13);
    ctx.lineTo(h.H[0] - dt[0] * 12 + nt[0] * 15, h.H[1] - dt[1] * 12 + nt[1] * 15);
    ctx.lineTo(h.H[0] - dt[0] * 12 - nt[0] * 15, h.H[1] - dt[1] * 12 - nt[1] * 15);
    ctx.lineTo(B[0] - nt[0] * 13, B[1] - nt[1] * 13);
    ctx.closePath(); relleno(col(gi));
    cap(ctx, h.H[0] + dt[0] * 4, h.H[1] + dt[1] * 4, h.S[0], h.S[1], 13, 15); relleno(col(gi));
    if (!sil) {
      // solapa
      ctx.beginPath();
      ctx.moveTo(h.N[0] + nt[0] * 6, h.N[1] + nt[1] * 6);
      ctx.quadraticCurveTo(B[0] + nt[0] * 2 + dt[0] * 20, B[1] + nt[1] * 2 + dt[1] * 20, B[0] - nt[0] * 8, B[1] - nt[1] * 8);
      ctx.lineWidth = 2; ctx.strokeStyle = giSombra; ctx.stroke();
    }
    // cinturon y sus puntas
    ctx.save();
    ctx.translate(B[0], B[1]);
    ctx.rotate(Math.atan2(dt[1], dt[0]) + Math.PI / 2);
    ctx.fillStyle = sil ? (o.cintaSilueta || cinta) : cinta;
    ctx.fillRect(-14.5, -4, 29, 8);
    if (!sil) { ctx.lineWidth = 1.6; ctx.strokeStyle = borde; ctx.strokeRect(-14.5, -4, 29, 8); }
    const viento = (o.viento || 0);
    for (let i = 0; i < 2; i++) {
      const fl = Math.sin(t * 9 + i * 1.7) * (4 + viento * 6);
      ctx.beginPath();
      ctx.moveTo(4 + i * 3, 2);
      ctx.quadraticCurveTo(-4 - viento * 10 + fl * .4, 12, -6 - viento * 16 + fl, 22 - viento * 6 + i * 3);
      ctx.lineWidth = 4.2; ctx.strokeStyle = sil ? (o.cintaSilueta || cinta) : cinta; ctx.stroke();
    }
    ctx.restore();
    // cabeza
    const r = L.cabeza * cab;
    ctx.beginPath(); ctx.arc(h.C[0], h.C[1], r, 0, Math.PI * 2); relleno(col(piel));
    if (!sil) {
      const dc = dir(p.t + p.c);
      // pelo
      ctx.beginPath();
      ctx.arc(h.C[0], h.C[1], r, Math.atan2(dc[1], dc[0]) - 1.9, Math.atan2(dc[1], dc[0]) + .8);
      ctx.closePath();
      ctx.fillStyle = o.pelo || '#1b1214'; ctx.fill();
      // ojo
      const ojo = [h.C[0] + dc[1] * -r * .55 + dc[0] * -r * .05, h.C[1] - dc[0] * -r * .55 + dc[1] * -r * .05];
      ctx.beginPath(); ctx.arc(h.C[0] + r * .55 * Math.cos((p.t + p.c + 90) * R), h.C[1] + r * .55 * Math.sin((p.t + p.c + 90) * R), 1.7, 0, Math.PI * 2);
      ctx.fillStyle = borde; ctx.fill();
    }
    if (o.vincha) {
      const dc = dir(p.t + p.c), nc = [-dc[1], dc[0]];
      const vx = h.C[0] + dc[0] * r * .35, vy = h.C[1] + dc[1] * r * .35;
      ctx.beginPath();
      ctx.moveTo(vx + nc[0] * r * 1.02, vy + nc[1] * r * 1.02);
      ctx.lineTo(vx - nc[0] * r * 1.02, vy - nc[1] * r * 1.02);
      ctx.lineWidth = 4; ctx.strokeStyle = o.vincha; ctx.stroke();
      const bx = vx - nc[0] * r, by = vy - nc[1] * r;
      for (let i = 0; i < 2; i++) {
        const fl = Math.sin(t * 10 + i * 2) * (5 + viento * 6);
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx - 12 - viento * 8, by + 2 + fl * .4, bx - 22 - viento * 14, by + 4 + i * 5 + fl);
        ctx.lineWidth = 3.2; ctx.stroke();
      }
    }
    // adelante
    pierna(h.P1, false);
    brazo(h.E1, h.W1, h.S, p.mano1 === 'a', false);
    ctx.restore();
    // posicion del puño y del pie de adelante en pantalla, para chispas
    const m = o.mira || 1;
    const aPant = (q) => [o.x + q[0] * esc * m, o.suelo + (q[1] - suelo - (p.y || 0)) * esc];
    return { mano: aPant(h.W1), mano2: aPant(h.W2), pie: aPant(h.P1[3]), cabeza: aPant(h.C), cadera: aPant(h.H) };
  }

  // Secuencia de poses en el tiempo
  function Animador(inicial) {
    this.actual = Object.assign({}, POSES[inicial || 'guardia']);
    this.desde = this.actual; this.hacia = this.actual;
    this.t = 1; this.dur = 1; this.cola = []; this.reposo = inicial || 'guardia'; this.espera = 0;
  }
  const suave = (x) => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const salida = (x) => { const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  Animador.prototype.a = function (pose, dur, quieto, curva) {
    this.cola.push({ p: typeof pose === 'string' ? POSES[pose] : pose, d: dur, q: quieto || 0, c: curva });
    return this;
  };
  Animador.prototype.ya = function (pose, dur, quieto, curva) { this.cola = []; this.espera = 0; this.t = 1; return this.a(pose, dur, quieto, curva); };
  Animador.prototype.paso = function (dt) {
    if (this.t < 1) {
      this.t = Math.min(1, this.t + dt / this.dur);
      const k = this.curva === 'golpe' ? salida(this.t) : suave(this.t);
      this.actual = mezcla(this.desde, this.hacia, k);
      return this.actual;
    }
    if (this.espera > 0) { this.espera -= dt; return this.actual; }
    const sig = this.cola.shift();
    if (sig) {
      this.desde = this.actual; this.hacia = sig.p; this.dur = sig.d; this.t = 0; this.espera = sig.q; this.curva = sig.c;
    } else if (this.hacia !== POSES[this.reposo] && this.reposo) {
      this.desde = this.actual; this.hacia = POSES[this.reposo]; this.dur = .35; this.t = 0; this.curva = null;
    }
    return this.actual;
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
  function ajustar(cv) {
    const r = cv.getBoundingClientRect();
    const d = Math.min(devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(r.width * d)), h = Math.max(1, Math.round(r.height * d));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    return { w: r.width, h: r.height, d };
  }

  window.Figura = { POSES, mezcla, dibujar, huesos, Animador, respira, ajustar };
})();
