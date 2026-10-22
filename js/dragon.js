// Dragon oriental que sigue el camino de su cabeza. Cada punto del cuerpo
// repite por donde ya paso la cabeza, asi se mueve como serpiente.
(function () {
  const ESTILOS = {
    oro:    { base: '#e8b04a', lomo: '#a8681a', panza: '#ffe7a6', borde: '#3a2208', escama: 'rgba(90,50,10,.45)', puas: '#d7261e', ojo: '#ff3b1f', brillo: 'rgba(255,200,90,.35)', bigote: '#ffd77a' },
    blanco: { base: '#fbf6ec', lomo: '#d9cfbf', panza: '#ffffff', borde: 'rgba(255,255,255,0)', escama: 'rgba(160,140,120,.35)', puas: '#ffffff', ojo: '#e8b04a', brillo: 'rgba(255,245,225,.35)', bigote: '#ffffff' },
    tinta:  { base: '#141012', lomo: '#0a0809', panza: '#2a1f22', borde: '#000', escama: 'rgba(232,176,74,.35)', puas: '#d7261e', ojo: '#ffcf4a', brillo: 'rgba(215,38,30,.3)', bigote: '#e8b04a' }
  };

  function Dragon(op) {
    op = op || {};
    this.n = op.n || 46;            // segmentos
    this.sep = op.sep || 9;         // separacion en px
    this.ancho = op.ancho || 22;    // grosor maximo
    this.estilo = op.estilo || 'oro';
    this.hist = [];
    this.puntos = [];
    this.boca = 0;                  // 0 cerrada, 1 abierta
    this.t = 0;
  }

  Dragon.prototype.mover = function (x, y, z, dt) {
    this.t += dt || 0.016;
    const h = this.hist;
    const u = h[0];
    if (!u || Math.hypot(x - u.x, y - u.y) > 0.6) h.unshift({ x, y, z: z || 0 });
    else { u.z = z || 0; }
    // recorta lo que ya no hace falta
    let largo = 0;
    for (let i = 1; i < h.length; i++) {
      largo += Math.hypot(h[i].x - h[i - 1].x, h[i].y - h[i - 1].y);
      if (largo > this.n * this.sep + 60) { h.length = i + 1; break; }
    }
    // remuestrea a distancia fija
    const P = this.puntos; P.length = 0;
    P.push({ x: h[0].x, y: h[0].y, z: h[0].z });
    let j = 1, resto = 0, prev = h[0];
    for (let k = 1; k < this.n && j < h.length; ) {
      const q = h[j];
      const d = Math.hypot(q.x - prev.x, q.y - prev.y);
      if (resto + d >= this.sep) {
        const f = (this.sep - resto) / d;
        const nx = prev.x + (q.x - prev.x) * f, ny = prev.y + (q.y - prev.y) * f, nz = prev.z + (q.z - prev.z) * f;
        P.push({ x: nx, y: ny, z: nz });
        prev = { x: nx, y: ny, z: nz }; resto = 0; k++;
      } else { resto += d; prev = q; j++; }
    }
  };

  // Llena el historial en linea recta para que no nazca enrollado
  Dragon.prototype.colocar = function (x, y, ang) {
    this.hist = [];
    const total = this.n * this.sep + 40;
    for (let d = total; d >= 0; d -= 3) this.hist.unshift({ x: x - Math.cos(ang) * d, y: y - Math.sin(ang) * d, z: 0 });
    this.hist.reverse();
    this.hist.reverse();
    this.mover(x, y, 0, 0);
  };

  function perfil(s) {
    if (s < .05) return .55 + s / .05 * .2;
    if (s < .12) return .75 + (s - .05) / .07 * .25;
    if (s < .45) return 1 - (s - .12) * .25;
    return Math.max(.06, (1 - s) / .55 * .92);
  }

  // filtro(i) decide si se dibuja el segmento i (para pasar por delante o detras)
  Dragon.prototype.dibujar = function (ctx, op) {
    op = op || {};
    const P = this.puntos;
    if (P.length < 4) return;
    const E = ESTILOS[op.estilo || this.estilo];
    const filtro = op.filtro || (() => true);
    const W = this.ancho * (op.escala || 1);
    const t = this.t;
    const N = P.length;
    // normales
    const nor = [];
    for (let i = 0; i < N; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(N - 1, i + 1)];
      let dx = a.x - b.x, dy = a.y - b.y;
      const d = Math.hypot(dx, dy) || 1;
      dx /= d; dy /= d;
      nor.push({ dx, dy, nx: -dy, ny: dx });
    }
    // de que lado queda el lomo, segun si avanza a la derecha o a la izquierda
    const lado = (i) => (nor[i].dx >= 0 ? 1 : -1);
    const w = (i) => W * perfil(i / (N - 1)) * (1 + Math.sin(t * 6 - i * .5) * .03) * (op.prof ? op.prof(P[i].z) : 1);
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    // resplandor
    if (op.brillo !== false) {
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < N - 1; i += 1) {
        if (!filtro(i)) continue;
        ctx.beginPath(); ctx.moveTo(P[i].x, P[i].y); ctx.lineTo(P[i + 1].x, P[i + 1].y);
        ctx.strokeStyle = E.brillo; ctx.lineWidth = w(i) * 2.4; ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    // patas, antes que el cuerpo para que salgan de abajo
    const patas = [Math.round(N * .16), Math.round(N * .44)];
    patas.forEach((pi, k) => {
      if (pi >= N - 1 || !filtro(pi)) return;
      const p = P[pi], n = nor[pi], s = lado(pi);
      for (const lr of [1, -1]) {
        const fase = Math.sin(t * 5 + k * 2 + (lr > 0 ? 0 : Math.PI)) * .5;
        const bx = p.x - n.nx * s * w(pi) * .35 * lr, by = p.y - n.ny * s * w(pi) * .35 * lr;
        const ang = Math.atan2(-n.ny * s, -n.nx * s) + (lr > 0 ? -.7 : .7) * .6 + fase - n.dx * .2;
        const l1 = W * .9, l2 = W * .75;
        const kx = bx + Math.cos(ang) * l1, ky = by + Math.sin(ang) * l1;
        const ang2 = ang + (lr > 0 ? .9 : -.9) * .8 - fase * .6;
        const fx = kx + Math.cos(ang2) * l2, fy = ky + Math.sin(ang2) * l2;
        ctx.strokeStyle = lr > 0 ? E.base : E.lomo;
        ctx.lineWidth = W * .32;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
        // garras
        ctx.lineWidth = W * .08; ctx.strokeStyle = E.puas;
        for (let g = -1; g <= 1; g++) {
          const ga = ang2 + g * .5;
          ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + Math.cos(ga) * W * .32, fy + Math.sin(ga) * W * .32); ctx.stroke();
        }
      }
    });

    // puas del lomo
    for (let i = 3; i < N - 3; i += 2) {
      if (!filtro(i)) continue;
      const p = P[i], n = nor[i], s = lado(i), ww = w(i);
      const h = ww * (.55 + .25 * Math.sin(t * 8 - i * .6));
      const bx = p.x + n.nx * s * ww * .45, by = p.y + n.ny * s * ww * .45;
      ctx.beginPath();
      ctx.moveTo(bx + n.dx * ww * .35, by + n.dy * ww * .35);
      ctx.lineTo(bx + n.nx * s * h - n.dx * ww * .4, by + n.ny * s * h - n.dy * ww * .4);
      ctx.lineTo(bx - n.dx * ww * .45, by - n.dy * ww * .45);
      ctx.closePath();
      ctx.fillStyle = E.puas; ctx.fill();
    }

    // cuerpo por segmentos
    for (let i = N - 2; i >= 0; i--) {
      if (!filtro(i)) continue;
      const a = P[i], b = P[i + 1], na = nor[i], nb = nor[i + 1];
      const wa = w(i) / 2, wb = w(i + 1) / 2;
      // extiende un poco para tapar la junta
      const ex = (a.x - b.x) * .12, ey = (a.y - b.y) * .12;
      ctx.beginPath();
      ctx.moveTo(a.x + na.nx * wa + ex, a.y + na.ny * wa + ey);
      ctx.lineTo(b.x + nb.nx * wb, b.y + nb.ny * wb);
      ctx.lineTo(b.x - nb.nx * wb, b.y - nb.ny * wb);
      ctx.lineTo(a.x - na.nx * wa + ex, a.y - na.ny * wa + ey);
      ctx.closePath();
      ctx.fillStyle = E.base; ctx.fill();
      // lomo oscuro y panza clara
      const s = lado(i);
      ctx.beginPath();
      ctx.moveTo(a.x + na.nx * wa * s + ex, a.y + na.ny * wa * s + ey);
      ctx.lineTo(b.x + nb.nx * wb * s, b.y + nb.ny * wb * s);
      ctx.lineTo(b.x + nb.nx * wb * .25 * s, b.y + nb.ny * wb * .25 * s);
      ctx.lineTo(a.x + na.nx * wa * .25 * s + ex, a.y + na.ny * wa * .25 * s + ey);
      ctx.closePath(); ctx.fillStyle = E.lomo; ctx.fill();
      ctx.beginPath();
      ctx.moveTo(a.x - na.nx * wa * s + ex, a.y - na.ny * wa * s + ey);
      ctx.lineTo(b.x - nb.nx * wb * s, b.y - nb.ny * wb * s);
      ctx.lineTo(b.x - nb.nx * wb * .35 * s, b.y - nb.ny * wb * .35 * s);
      ctx.lineTo(a.x - na.nx * wa * .35 * s + ex, a.y - na.ny * wa * .35 * s + ey);
      ctx.closePath(); ctx.fillStyle = E.panza; ctx.fill();
      // escama
      if (i % 2 === 0 && i > 1) {
        ctx.beginPath();
        ctx.arc(a.x, a.y, wa * .8, Math.atan2(na.dy, na.dx) - 1.1, Math.atan2(na.dy, na.dx) + 1.1);
        ctx.strokeStyle = E.escama; ctx.lineWidth = Math.max(1, W * .06); ctx.stroke();
      }
      if (E.borde !== 'rgba(255,255,255,0)') {
        ctx.strokeStyle = E.borde; ctx.lineWidth = Math.max(1, W * .07);
        ctx.beginPath(); ctx.moveTo(a.x + na.nx * wa, a.y + na.ny * wa); ctx.lineTo(b.x + nb.nx * wb, b.y + nb.ny * wb); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(a.x - na.nx * wa, a.y - na.ny * wa); ctx.lineTo(b.x - nb.nx * wb, b.y - nb.ny * wb); ctx.stroke();
      }
    }

    // cola en llama
    if (filtro(N - 1)) {
      const c = P[N - 1], n = nor[N - 1];
      const ang = Math.atan2(-n.dy, -n.dx);
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(ang);
      const L = W * 2.2, onda = Math.sin(t * 7) * W * .25;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(L * .4, -W * .9 + onda, L, -W * .2 + onda);
      ctx.quadraticCurveTo(L * .55, 0, L * .9, W * .5 + onda);
      ctx.quadraticCurveTo(L * .4, W * .6, 0, 0);
      ctx.fillStyle = E.puas; ctx.fill();
      ctx.restore();
    }

    // cabeza
    if (filtro(0)) this.cabeza(ctx, P, nor, W, E, op);
    ctx.restore();
  };

  Dragon.prototype.cabeza = function (ctx, P, nor, W, E, op) {
    const h = P[0], n = nor[0];
    const ang = Math.atan2(n.dy, n.dx);
    const flip = n.dx < 0 ? -1 : 1;
    const t = this.t;
    const s = W / 22 * (op.prof ? op.prof(h.z) : 1);
    const boca = this.boca;
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(ang);
    ctx.scale(s, s * flip);

    // melena de llama detras de la cabeza
    for (let i = 0; i < 6; i++) {
      const f = Math.sin(t * 9 + i) * 3;
      ctx.beginPath();
      ctx.moveTo(-4 - i * 3, -6 + i * 1.5);
      ctx.quadraticCurveTo(-18 - i * 4, -22 - i * 2 + f, -30 - i * 5, -14 - i * 3 + f);
      ctx.quadraticCurveTo(-18 - i * 3, -8, -6 - i * 3, 4);
      ctx.closePath();
      ctx.fillStyle = i % 2 ? E.puas : E.lomo; ctx.fill();
    }
    // cuernos
    ctx.strokeStyle = E.panza; ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.moveTo(6, -10); ctx.quadraticCurveTo(-6, -26, -26, -30); ctx.stroke();
    ctx.lineWidth = 2.6; ctx.strokeStyle = E.lomo;
    ctx.beginPath(); ctx.moveTo(2, -9); ctx.quadraticCurveTo(-10, -20, -22, -21); ctx.stroke();

    // mandibula de abajo, se abre
    ctx.save();
    ctx.translate(4, 4);
    ctx.rotate(boca * .55);
    ctx.beginPath();
    ctx.moveTo(-6, 0); ctx.lineTo(24, 2); ctx.quadraticCurveTo(30, 4, 26, 8); ctx.lineTo(-4, 10); ctx.closePath();
    ctx.fillStyle = E.lomo; ctx.fill();
    if (boca > .1) {
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(6 + i * 5, 2); ctx.lineTo(8 + i * 5, -2); ctx.lineTo(10 + i * 5, 2); ctx.fill(); }
    }
    ctx.restore();
    if (boca > .1) {
      ctx.beginPath(); ctx.moveTo(-2, 4); ctx.lineTo(26, 4); ctx.lineTo(18, 4 + boca * 12); ctx.closePath();
      ctx.fillStyle = '#5a0a08'; ctx.fill();
    }
    // craneo y hocico
    ctx.beginPath();
    ctx.moveTo(-8, -8);
    ctx.quadraticCurveTo(0, -15, 12, -12);
    ctx.quadraticCurveTo(20, -10, 28, -6);
    ctx.quadraticCurveTo(36, -4, 36, 1);
    ctx.quadraticCurveTo(34, 5, 26, 4);
    ctx.lineTo(-2, 5);
    ctx.quadraticCurveTo(-10, 4, -10, -2);
    ctx.closePath();
    ctx.fillStyle = E.base; ctx.fill();
    if (E.borde !== 'rgba(255,255,255,0)') { ctx.strokeStyle = E.borde; ctx.lineWidth = 1.4; ctx.stroke(); }
    // ceja y nariz
    ctx.beginPath(); ctx.moveTo(6, -11); ctx.quadraticCurveTo(14, -16, 20, -9);
    ctx.strokeStyle = E.lomo; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.arc(32, -3, 1.6, 0, Math.PI * 2); ctx.fillStyle = E.lomo; ctx.fill();
    // panza del hocico
    ctx.beginPath(); ctx.moveTo(0, 3); ctx.quadraticCurveTo(14, 1, 28, 3); ctx.strokeStyle = E.panza; ctx.lineWidth = 2; ctx.stroke();
    // ojo
    ctx.beginPath(); ctx.ellipse(13, -6, 3.6, 2.6, -.2, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(14, -6, 1.6, 2.2, 0, 0, Math.PI * 2); ctx.fillStyle = E.ojo; ctx.fill();
    // bigotes largos que flotan
    ctx.strokeStyle = E.bigote; ctx.lineWidth = 1.6;
    for (let k = 0; k < 2; k++) {
      ctx.beginPath(); ctx.moveTo(30, 1 + k * 2);
      for (let i = 1; i <= 10; i++) {
        const x = 30 - i * 6, y = 6 + k * 4 + i * 1.6 + Math.sin(t * 6 - i * .7 + k) * (2 + i * .9);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  };

  // Fuego que sale de la boca
  Dragon.prototype.boquilla = function () {
    const P = this.puntos, a = P[0], b = P[2] || P[1];
    const ang = Math.atan2(a.y - b.y, a.x - b.x);
    const s = this.ancho / 22;
    return { x: a.x + Math.cos(ang) * 34 * s, y: a.y + Math.sin(ang) * 34 * s, ang };
  };

  window.Dragon = Dragon;
})();
