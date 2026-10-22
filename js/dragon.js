// Dragon oriental que sigue el camino de su cabeza. Cada punto del cuerpo
// repite por donde ya paso la cabeza, asi se mueve como serpiente, y encima
// ondula solo. El lomo queda siempre del mismo lado del cuerpo y, cuando el
// dragon da la vuelta, la cabeza gira y el lomo se pasa de lado poco a poco.
(function () {
  const ESTILOS = {
    oro: {
      base: '#e9b04a', claro: '#ffe6a6', oscuro: '#9a5c18', borde: '#3a2208', escama: 'rgba(110,60,10,.5)',
      placa: '#fff0c8', placaLinea: 'rgba(150,90,20,.55)', aleta: '#c8201a', aleta2: '#ff6a2a', cuerno: '#fff3d6', cuerno2: '#d9b27a',
      melena: ['#c8201a', '#ff5a2a', '#9e1510'], punta: '#ffd27a', ojo: '#ffe14a', brillo: 'rgba(255,190,80,.22)', garra: '#fff3d6'
    },
    blanco: {
      base: '#f4eee2', claro: '#ffffff', oscuro: '#b9ad9b', borde: 'rgba(60,45,35,.55)', escama: 'rgba(120,100,80,.35)',
      placa: '#ffffff', placaLinea: 'rgba(150,130,110,.5)', aleta: '#e8b04a', aleta2: '#ffd27a', cuerno: '#e8b04a', cuerno2: '#b07a2a',
      melena: ['#e8b04a', '#ffd27a', '#c58a2a'], punta: '#fff6e0', ojo: '#d7261e', brillo: 'rgba(255,230,180,.08)', garra: '#e8b04a'
    },
    tinta: {
      base: '#221a1c', claro: '#3e3033', oscuro: '#0b0809', borde: '#000', escama: 'rgba(232,176,74,.3)',
      placa: '#342829', placaLinea: 'rgba(0,0,0,.6)', aleta: '#d7261e', aleta2: '#ff4a2e', cuerno: '#e8b04a', cuerno2: '#9a6a20',
      melena: ['#d7261e', '#ff4a2e', '#8e140f'], punta: '#ffcf4a', ojo: '#ffcf4a', brillo: 'rgba(215,38,30,.25)', garra: '#e8b04a'
    }
  };

  function Dragon(op) {
    op = op || {};
    this.n = op.n || 46;
    this.sep = op.sep || 9;
    this.ancho = op.ancho || 22;
    this.estilo = op.estilo || 'oro';
    this.hist = [];
    this.puntos = [];
    this.boca = 0;
    this.t = 0;
    this.lado = 1;      // lado del lomo, se mueve suave entre -1 y 1
    this.ladoMeta = 1;
    this.recorrido = 0; // distancia que avanzo la cabeza, mueve la onda del cuerpo
    this.rapidez = 0;
    this.angCab = null; // la cabeza gira con algo de retraso, como un cuello de verdad
  }

  Dragon.prototype.mover = function (x, y, z, dt) {
    dt = dt || 0.016;
    if (!(this.sep > .5)) this.sep = .5;
    if (!isFinite(x) || !isFinite(y)) return;
    this.t += dt;
    const h = this.hist;
    const u = h[0];
    if (u) {
      const d = Math.hypot(x - u.x, y - u.y);
      this.recorrido += d;
      if (dt > 0) this.rapidez += (d / dt - this.rapidez) * Math.min(1, dt * 4);
    }
    if (!u || Math.hypot(x - u.x, y - u.y) > 0.6) h.unshift({ x, y, z: z || 0 });
    else u.z = z || 0;
    let largo = 0;
    for (let i = 1; i < h.length; i++) {
      largo += Math.hypot(h[i].x - h[i - 1].x, h[i].y - h[i - 1].y);
      if (largo > this.n * this.sep + 60) { h.length = i + 1; break; }
    }
    const P = this.puntos; P.length = 0;
    P.push({ x: h[0].x, y: h[0].y, z: h[0].z });
    let j = 1, resto = 0, prev = h[0];
    for (let k = 1; k < this.n && j < h.length;) {
      const q = h[j];
      const d = Math.hypot(q.x - prev.x, q.y - prev.y);
      if (resto + d >= this.sep) {
        const f = (this.sep - resto) / d;
        const nx = prev.x + (q.x - prev.x) * f, ny = prev.y + (q.y - prev.y) * f, nz = prev.z + (q.z - prev.z) * f;
        P.push({ x: nx, y: ny, z: nz });
        prev = { x: nx, y: ny, z: nz }; resto = 0; k++;
      } else { resto += d; prev = q; j++; }
    }
    // hacia donde mira la cabeza, con margen para que no tiemble al subir recto
    if (P.length > 3) {
      const dx = P[0].x - P[3].x, dy = P[0].y - P[3].y, d = Math.hypot(dx, dy) || 1;
      if (dx / d > .25) this.ladoMeta = 1;
      else if (dx / d < -.25) this.ladoMeta = -1;
    }
    this.lado += (this.ladoMeta - this.lado) * Math.min(1, dt * 5);
  };

  Dragon.prototype.colocar = function (x, y, ang) {
    this.hist = [];
    const total = this.n * this.sep + 40;
    for (let d = total; d >= 0; d -= 3) this.hist.unshift({ x: x - Math.cos(ang) * d, y: y - Math.sin(ang) * d, z: 0 });
    this.ladoMeta = this.lado = Math.cos(ang) >= 0 ? 1 : -1;
    this.mover(x, y, 0, 0);
  };

  // grosor a lo largo del cuerpo, cuello fino, pecho ancho, cadera y cola larga
  function perfil(s) {
    const k = (a, b, x) => Math.max(0, Math.min(1, (x - a) / (b - a)));
    const suave = (x) => x * x * (3 - 2 * x);
    let w = .58 + .42 * suave(k(.02, .16, s));          // cuello a pecho
    w -= .12 * suave(k(.22, .36, s)) * (1 - suave(k(.36, .5, s)));  // cintura
    w *= 1 - .9 * Math.pow(k(.52, 1, s), 1.35);         // cola
    return Math.max(.06, w);
  }

  // Lengua de fuego, sirve para melena, codos y cola
  function llama(ctx, x, y, ang, largo, ancho, fase, c1, c2) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    const o1 = Math.sin(fase) * ancho * .5, o2 = Math.sin(fase + 1.4) * ancho * .7;
    ctx.beginPath();
    ctx.moveTo(0, -ancho / 2);
    ctx.bezierCurveTo(largo * .35, -ancho * .7 + o1, largo * .65, -ancho * .2 + o2, largo, o2 * .8);
    ctx.bezierCurveTo(largo * .6, ancho * .25 + o1 * .5, largo * .3, ancho * .6, 0, ancho / 2);
    ctx.closePath();
    if (c2) {
      const g = ctx.createLinearGradient(0, 0, largo, 0);
      g.addColorStop(0, c1); g.addColorStop(1, c2);
      ctx.fillStyle = g;
    } else ctx.fillStyle = c1;
    ctx.fill();
    ctx.restore();
  }

  Dragon.prototype.dibujar = function (ctx, op) {
    op = op || {};
    const P0 = this.puntos;
    if (P0.length < 5) return;
    const E = ESTILOS[op.estilo || this.estilo];
    const filtro = op.filtro || (() => true);
    const W = this.ancho * (op.escala || 1);
    const t = this.t;
    const N = P0.length;
    const L = this.lado, sL = L >= 0 ? 1 : -1, aL = Math.abs(L);

    // tangentes y normales del camino
    const tan = [];
    for (let i = 0; i < N; i++) {
      const a = P0[Math.max(0, i - 1)], b = P0[Math.min(N - 1, i + 1)];
      let dx = a.x - b.x, dy = a.y - b.y;
      const d = Math.hypot(dx, dy) || 1;
      tan.push([dx / d, dy / d]);
    }
    // ondulacion propia, nula en la cabeza
    const Q = P0.map((p, i) => {
      const s = i / (N - 1);
      const env = Math.min(1, s / .18) * (1 - s * .3);
      // onda larga y lenta, vuela como dragon, no culebrea
      const fase = this.recorrido / (this.sep * 26) * Math.PI * 2 + t * .9;
      const amp = W * (.07 + Math.min(.1, this.rapidez / 5000));
      const off = Math.sin(fase - i * .16) * amp * env;
      return { x: p.x - tan[i][1] * off, y: p.y + tan[i][0] * off, z: p.z };
    });
    // normales finales, la normal "n" apunta al lomo
    const nx = [], ny = [], ww = [];
    for (let i = 0; i < N; i++) {
      const a = Q[Math.max(0, i - 1)], b = Q[Math.min(N - 1, i + 1)];
      let dx = a.x - b.x, dy = a.y - b.y;
      const d = Math.hypot(dx, dy) || 1;
      dx /= d; dy /= d;
      tan[i] = [dx, dy];
      // lomo hacia arriba de la pantalla cuando avanza a la derecha
      nx.push(dy * sL); ny.push(-dx * sL);
      ww.push(W * perfil(i / (N - 1)) * (op.prof ? op.prof(Q[i].z) : 1) * (1 + Math.sin(t * 5 - i * .4) * .025));
    }
    const lomo = (i, k) => [Q[i].x + nx[i] * ww[i] * .5 * k, Q[i].y + ny[i] * ww[i] * .5 * k];

    // tramos seguidos que pasan el filtro
    const tramos = [];
    let ini = -1;
    for (let i = 0; i < N - 1; i++) {
      if (filtro(i)) { if (ini < 0) ini = i; }
      else if (ini >= 0) { tramos.push([ini, i]); ini = -1; }
    }
    if (ini >= 0) tramos.push([ini, N - 1]);
    if (!tramos.length) return;

    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    const camino = (a, b) => {
      ctx.beginPath();
      const p0 = lomo(a, 1);
      ctx.moveTo(p0[0], p0[1]);
      for (let i = a + 1; i <= b; i++) {
        const p = lomo(i, 1), q = lomo(i - 1, 1);
        ctx.quadraticCurveTo(q[0], q[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
      }
      const pb = lomo(b, 1); ctx.lineTo(pb[0], pb[1]);
      const vb = lomo(b, -1); ctx.lineTo(vb[0], vb[1]);
      for (let i = b - 1; i >= a; i--) {
        const p = lomo(i, -1), q = lomo(i + 1, -1);
        ctx.quadraticCurveTo(q[0], q[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
      }
      const va = lomo(a, -1); ctx.lineTo(va[0], va[1]);
      ctx.closePath();
    };

    // resplandor
    if (op.brillo !== false) {
      ctx.globalCompositeOperation = 'lighter';
      tramos.forEach(([a, b]) => {
        ctx.beginPath(); ctx.moveTo(Q[a].x, Q[a].y);
        for (let i = a + 1; i <= b; i++) ctx.lineTo(Q[i].x, Q[i].y);
        ctx.strokeStyle = E.brillo; ctx.lineWidth = W * 1.9; ctx.stroke();
        ctx.lineWidth = W * 1.25; ctx.stroke();
      });
      ctx.globalCompositeOperation = 'source-over';
    }

    // aleta del lomo, una membrana de llama con varillas
    tramos.forEach(([a, b]) => {
      const desde = Math.max(a, 3), hasta = Math.min(b, N - 4);
      if (hasta <= desde) return;
      ctx.beginPath();
      let p = lomo(desde, .8); ctx.moveTo(p[0], p[1]);
      for (let i = desde; i <= hasta; i++) {
        const s = i / (N - 1);
        const alto = ww[i] * (.55 + .3 * Math.sin(i * 1.1 + t * 7)) * aL * (1 - s * .4);
        const base = lomo(i, .8);
        const tipx = base[0] + nx[i] * alto - tan[i][0] * ww[i] * .6, tipy = base[1] + ny[i] * alto - tan[i][1] * ww[i] * .6;
        const prevB = lomo(Math.max(desde, i - 1), .8);
        ctx.quadraticCurveTo((prevB[0] + base[0]) / 2 + nx[i] * alto * .3, (prevB[1] + base[1]) / 2 + ny[i] * alto * .3, tipx, tipy);
        ctx.lineTo(base[0], base[1]);
      }
      for (let i = hasta; i >= desde; i--) { p = lomo(i, .5); ctx.lineTo(p[0], p[1]); }
      ctx.closePath();
      const g = ctx.createLinearGradient(Q[desde].x, Q[desde].y, Q[hasta].x, Q[hasta].y);
      g.addColorStop(0, E.aleta2); g.addColorStop(.5, E.aleta); g.addColorStop(1, E.aleta2);
      ctx.fillStyle = g; ctx.fill();
    });

    // patas, las del lado de atras van antes del cuerpo
    const patas = [Math.round(N * .17), Math.round(N * .48)];
    const pata = (pi, k, lr) => {
      if (pi >= N - 2 || !filtro(pi)) return;
      const fase = t * 4.2 + k * 1.9 + (lr > 0 ? 0 : Math.PI * .8);
      const nadar = Math.sin(fase);
      const base = lomo(pi, -.35);
      // muslo hacia la panza y la cola, antebrazo hacia adelante, nadando
      const n0x = -nx[pi], n0y = -ny[pi], c0x = -tan[pi][0], c0y = -tan[pi][1];
      let d1x = n0x * .8 + c0x * (.55 + .45 * nadar), d1y = n0y * .8 + c0y * (.55 + .45 * nadar);
      let m = Math.hypot(d1x, d1y); d1x /= m; d1y /= m;
      let d2x = n0x * .35 - c0x * (.8 + .4 * nadar), d2y = n0y * .35 - c0y * (.8 + .4 * nadar);
      m = Math.hypot(d2x, d2y); d2x /= m; d2y /= m;
      const l1 = W * .95, l2 = W * .8;
      const kx = base[0] + d1x * l1, ky = base[1] + d1y * l1;
      const fx = kx + d2x * l2, fy = ky + d2y * l2;
      const a2 = Math.atan2(d2y, d2x);
      const lejos = lr < 0;
      ctx.strokeStyle = lejos ? E.oscuro : E.base;
      ctx.lineWidth = W * .42; ctx.beginPath(); ctx.moveTo(base[0], base[1]); ctx.lineTo(kx, ky); ctx.stroke();
      ctx.lineWidth = W * .3; ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
      ctx.strokeStyle = E.borde; ctx.lineWidth = Math.max(.8, W * .04);
      // mechon de llama en el codo
      llama(ctx, kx, ky, Math.atan2(c0y, c0x), W * .9, W * .32, fase * 1.3, E.melena[lejos ? 2 : 0], E.punta);
      // garra de cuatro unas
      const am = a2;
      ctx.fillStyle = lejos ? E.oscuro : E.base;
      ctx.beginPath(); ctx.arc(fx, fy, W * .2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = E.garra; ctx.lineWidth = Math.max(1.2, W * .09);
      for (let g = 0; g < 4; g++) {
        const ga = am + (g - 1.5) * .45 + Math.sin(fase) * .15;
        const ex = fx + Math.cos(ga) * W * .42, ey = fy + Math.sin(ga) * W * .42;
        ctx.beginPath(); ctx.moveTo(fx + Math.cos(ga) * W * .12, fy + Math.sin(ga) * W * .12);
        ctx.quadraticCurveTo(ex, ey, ex + Math.cos(ga + 1.2 * sL) * W * .14, ey + Math.sin(ga + 1.2 * sL) * W * .14);
        ctx.stroke();
      }
    };
    patas.forEach((pi, k) => pata(pi, k, -1));

    // cuerpo
    tramos.forEach(([a, b]) => {
      camino(a, b);
      ctx.fillStyle = E.base; ctx.fill();
      ctx.save();
      ctx.clip();
      // sombra del lomo y luz arriba para dar volumen
      ctx.beginPath(); ctx.moveTo(lomo(a, 1)[0], lomo(a, 1)[1]);
      for (let i = a + 1; i <= b; i++) ctx.lineTo(lomo(i, 1)[0], lomo(i, 1)[1]);
      ctx.strokeStyle = E.oscuro; ctx.lineWidth = W * .38; ctx.stroke();
      // placas de la panza, una sola franja y un solo trazo para las lineas
      ctx.beginPath();
      let p0 = lomo(a, -1.05); ctx.moveTo(p0[0], p0[1]);
      for (let i = a + 1; i <= b; i++) { const q = lomo(i, -1.05); ctx.lineTo(q[0], q[1]); }
      for (let i = b; i >= a; i--) { const q = lomo(i, -.25); ctx.lineTo(q[0], q[1]); }
      ctx.closePath(); ctx.fillStyle = E.placa; ctx.fill();
      ctx.beginPath();
      for (let i = a; i <= b; i++) {
        const v1 = lomo(i, -1.05), v2 = lomo(i, -.25);
        ctx.moveTo(v1[0], v1[1]);
        ctx.quadraticCurveTo((v1[0] + v2[0]) / 2 + tan[i][0] * ww[i] * .12, (v1[1] + v2[1]) / 2 + tan[i][1] * ww[i] * .12, v2[0], v2[1]);
      }
      ctx.strokeStyle = E.placaLinea; ctx.lineWidth = Math.max(.8, W * .05); ctx.stroke();
      // escamas en media luna, en filas, todas en un trazo
      ctx.beginPath();
      for (let i = a; i <= b; i++) {
        const r = ww[i] * .2;
        if (r < 1.2) continue;
        const ang = Math.atan2(tan[i][1], tan[i][0]);
        for (const k of (i % 2 ? [-.05, .45, .9] : [.2, .68])) {
          const c = lomo(i, k);
          ctx.moveTo(c[0] + Math.cos(ang - 1.25) * r, c[1] + Math.sin(ang - 1.25) * r);
          ctx.arc(c[0], c[1], r, ang - 1.25, ang + 1.25);
        }
      }
      ctx.strokeStyle = E.escama; ctx.lineWidth = Math.max(.7, W * .045); ctx.stroke();
      // brillo a lo largo
      ctx.beginPath(); ctx.moveTo(lomo(a, .45)[0], lomo(a, .45)[1]);
      for (let i = a + 1; i <= b; i++) ctx.lineTo(lomo(i, .45)[0], lomo(i, .45)[1]);
      ctx.strokeStyle = E.claro; ctx.globalAlpha = .55; ctx.lineWidth = W * .1; ctx.stroke(); ctx.globalAlpha = 1;
      ctx.restore();
      camino(a, b);
      ctx.strokeStyle = E.borde; ctx.lineWidth = Math.max(1, W * .06); ctx.stroke();
    });

    patas.forEach((pi, k) => pata(pi, k, 1));

    // cola de llama
    if (filtro(N - 2)) {
      const c = Q[N - 1];
      const ang = Math.atan2(-tan[N - 1][1], -tan[N - 1][0]);
      for (let k = 0; k < 3; k++) {
        llama(ctx, c.x, c.y, ang + (k - 1) * .45 * sL, W * (2.2 - Math.abs(k - 1) * .6), W * .7, t * 6 + k, E.melena[k], E.punta);
      }
    }

    if (filtro(0)) this.cabeza(ctx, Q, tan, W, E, op);
    ctx.restore();
  };

  Dragon.prototype.cabeza = function (ctx, Q, tan, W, E, op) {
    const h = Q[0];
    const meta = Math.atan2(tan[0][1], tan[0][0]);
    if (this.angCab === null) this.angCab = meta;
    let dif = meta - this.angCab;
    while (dif > Math.PI) dif -= Math.PI * 2;
    while (dif < -Math.PI) dif += Math.PI * 2;
    this.angCab += dif * .18;
    const ang = this.angCab + Math.sin(this.t * 2.3) * .05;
    const t = this.t;
    const s = W / 22 * (op.prof ? op.prof(h.z) : 1) * .95;
    const flip = this.lado;
    const boca = Math.max(0, Math.min(1.5, this.boca));
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(ang);
    ctx.scale(s, s * (Math.abs(flip) < .2 ? (flip < 0 ? -.2 : .2) : flip));

    // melena larga hacia atras
    for (let i = 0; i < 8; i++) {
      const y0 = -12 + i * 3.2;
      llama(ctx, -4 - i * .5, y0, Math.PI + (i - 3.5) * .16, 38 + (i % 3) * 12, 9, t * 6 + i * .9, E.melena[i % 3], E.punta);
    }
    // cuerno de atras
    const cuerno = (dx, dy, color, grosor) => {
      ctx.strokeStyle = color; ctx.lineCap = 'round';
      ctx.lineWidth = grosor;
      ctx.beginPath(); ctx.moveTo(4 + dx, -12 + dy); ctx.bezierCurveTo(-4 + dx, -24 + dy, -16 + dx, -30 + dy, -34 + dx, -34 + dy); ctx.stroke();
      ctx.lineWidth = grosor * .75;
      ctx.beginPath(); ctx.moveTo(-8 + dx, -24 + dy); ctx.quadraticCurveTo(-8 + dx, -34 + dy, -2 + dx, -42 + dy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-20 + dx, -30 + dy); ctx.quadraticCurveTo(-22 + dx, -40 + dy, -16 + dx, -48 + dy); ctx.stroke();
      ctx.lineWidth = grosor * .55;
      ctx.beginPath(); ctx.moveTo(-28 + dx, -33 + dy); ctx.quadraticCurveTo(-36 + dx, -40 + dy, -40 + dx, -46 + dy); ctx.stroke();
    };
    cuerno(-4, 2, E.cuerno2, 4.2);

    // mandibula, se abre
    ctx.save();
    ctx.translate(0, 4);
    ctx.rotate(boca * .5);
    // barba que cuelga
    for (let i = 0; i < 4; i++) llama(ctx, 26 - i * 7, 9, Math.PI * .62 + i * .08, 16 + i * 3, 6, t * 7 + i, E.melena[(i + 1) % 3], E.punta);
    ctx.beginPath();
    ctx.moveTo(-6, 0); ctx.lineTo(40, 1); ctx.quadraticCurveTo(46, 3, 42, 8); ctx.quadraticCurveTo(20, 13, -4, 9); ctx.closePath();
    ctx.fillStyle = E.oscuro; ctx.fill();
    ctx.strokeStyle = E.borde; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 6); ctx.quadraticCurveTo(20, 9, 40, 5); ctx.strokeStyle = E.placa; ctx.lineWidth = 2; ctx.stroke();
    if (boca > .08) {
      ctx.fillStyle = '#fffaf0';
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(10 + i * 6, 1); ctx.lineTo(12 + i * 6, -3); ctx.lineTo(14 + i * 6, 1); ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(38, 1); ctx.lineTo(37, -7); ctx.lineTo(34, 1); ctx.fill();
    }
    ctx.restore();
    // boca por dentro y lengua
    if (boca > .08) {
      ctx.beginPath(); ctx.moveTo(-4, 4); ctx.lineTo(44, 3); ctx.lineTo(40, 4 + boca * 18); ctx.lineTo(-2, 8); ctx.closePath();
      ctx.fillStyle = '#4a0806'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(4, 7);
      ctx.quadraticCurveTo(28, 6 + boca * 10 + Math.sin(t * 14) * 2, 50, 4 + boca * 12);
      ctx.strokeStyle = '#e8352a'; ctx.lineWidth = 3; ctx.stroke();
    }
    // aleta de la mejilla
    for (let i = 0; i < 3; i++) llama(ctx, 2, 4 + i * 2, Math.PI * .82 + i * .14, 18 - i * 3, 7, t * 8 + i * 2, E.aleta, E.aleta2);
    // craneo y hocico
    ctx.beginPath();
    ctx.moveTo(-10, -4);
    ctx.bezierCurveTo(-8, -14, 2, -18, 10, -17);
    ctx.quadraticCurveTo(16, -16, 20, -11);
    ctx.quadraticCurveTo(28, -10, 36, -11);
    ctx.quadraticCurveTo(42, -16, 47, -12);
    ctx.quadraticCurveTo(53, -8, 50, -2);
    ctx.quadraticCurveTo(50, 3, 44, 4);
    ctx.lineTo(4, 5);
    ctx.quadraticCurveTo(-8, 6, -10, -4);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, -18, 0, 6);
    g.addColorStop(0, E.claro); g.addColorStop(.45, E.base); g.addColorStop(1, E.oscuro);
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = E.borde; ctx.lineWidth = 1.3; ctx.stroke();
    // dientes de arriba y colmillo
    if (boca > .08) {
      ctx.fillStyle = '#fffaf0';
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(8 + i * 6, 4); ctx.lineTo(10 + i * 6, 8); ctx.lineTo(12 + i * 6, 4); ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(40, 3); ctx.lineTo(41, 12); ctx.lineTo(44, 3); ctx.fill();
    }
    // escamitas del hocico
    ctx.fillStyle = E.escama;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(24 + i * 5, -8 + (i % 2), 1.1, 0, Math.PI * 2); ctx.fill(); }
    // nariz en espiral
    ctx.beginPath(); ctx.arc(46, -6, 2.6, Math.PI * .2, Math.PI * 1.9); ctx.strokeStyle = E.borde; ctx.lineWidth = 1.4; ctx.stroke();
    // ceja pesada con mechones
    ctx.beginPath(); ctx.moveTo(4, -14); ctx.quadraticCurveTo(13, -21, 22, -12);
    ctx.strokeStyle = E.oscuro; ctx.lineWidth = 4; ctx.stroke();
    llama(ctx, 8, -16, -Math.PI * .85, 16, 6, t * 7, E.punta, E.melena[1]);
    llama(ctx, 14, -18, -Math.PI * .78, 13, 5, t * 7 + 1, E.punta, E.melena[0]);
    // ojo que brilla
    ctx.save();
    ctx.shadowColor = E.ojo; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.moveTo(8, -9); ctx.quadraticCurveTo(14, -14, 21, -9); ctx.quadraticCurveTo(14, -5, 8, -9); ctx.closePath();
    ctx.fillStyle = E.ojo; ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(15, -9.3, .9, 3, 0, 0, Math.PI * 2); ctx.fillStyle = '#120806'; ctx.fill();
    ctx.beginPath(); ctx.arc(13.4, -10.6, .8, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
    // cuerno de adelante
    cuerno(0, 0, E.cuerno, 4.6);
    // bigotes largos
    ctx.strokeStyle = E.punta;
    for (let k = 0; k < 2; k++) {
      const pts = [[46, -3 + k * 3]];
      for (let i = 1; i <= 16; i++) {
        const q = pts[i - 1];
        pts.push([q[0] - 5.2, q[1] + (k ? 2.2 : 1) + Math.sin(t * 4 - i * .5 + k * 1.3) * (.6 + i * .22)]);
      }
      // bigote que se afina hacia la punta
      for (let i = 1; i < pts.length - 1; i++) {
        const a = pts[i - 1], b = pts[i], c = pts[i + 1];
        ctx.beginPath();
        ctx.moveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
        ctx.quadraticCurveTo(b[0], b[1], (b[0] + c[0]) / 2, (b[1] + c[1]) / 2);
        ctx.lineWidth = 2.2 * (1 - i / pts.length) + .4; ctx.stroke();
      }
    }
    ctx.restore();
  };

  // Perla de fuego que el dragon persigue
  Dragon.perla = function (ctx, x, y, r, t) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const halo = ctx.createRadialGradient(x, y, r * .3, x, y, r * 3.2);
    halo.addColorStop(0, 'rgba(255,220,140,.55)'); halo.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, r * 3.2, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 6; i++) {
      const a = t * 2 + i * Math.PI / 3;
      llama(ctx, x + Math.cos(a) * r * .6, y + Math.sin(a) * r * .6, a, r * 1.8, r * .7, t * 9 + i, 'rgba(255,120,40,.8)', 'rgba(255,220,120,0)');
    }
    ctx.globalCompositeOperation = 'source-over';
    const g = ctx.createRadialGradient(x - r * .35, y - r * .35, r * .1, x, y, r);
    g.addColorStop(0, '#ffffff'); g.addColorStop(.4, '#ffe9b0'); g.addColorStop(1, '#e8902a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };

  Dragon.prototype.boquilla = function () {
    const P = this.puntos, a = P[0], b = P[2] || P[1];
    const ang = Math.atan2(a.y - b.y, a.x - b.x);
    const s = this.ancho / 22;
    return { x: a.x + Math.cos(ang) * 48 * s, y: a.y + Math.sin(ang) * 48 * s, ang };
  };

  window.Dragon = Dragon;
})();
