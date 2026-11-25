// Sizzle & Serve — every pixel of the kitchen. Canvas 2D, all art drawn in code
// (no image files), in the game's fixed 1280x720 logical coordinates.
import { FIELD, FONT, ING_BY_ID, LAYOUT, PALETTE, SHIFT_LENGTH, STRIKES_MAX } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function inRect(rect, pos) {
  return pos.x >= rect.x && pos.x <= rect.x + rect.w && pos.y >= rect.y && pos.y <= rect.y + rect.h;
}

function formatTime(seconds) {
  const left = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(left / 60);
  const s = left % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Draw one ingredient as a small recognisable shape, centred at (x, y). */
export function drawIngredient(ctx, id, x, y, r) {
  const ing = ING_BY_ID[id];
  ctx.save();
  ctx.translate(x, y);
  if (id === 'bun') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, r * 0.15, r, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.fillRect(-r, r * 0.1, r * 2, r * 0.28);
    ctx.fillStyle = '#fff3d6';
    for (const [dx, dy] of [[-0.4, -0.45], [0.05, -0.62], [0.45, -0.4]]) {
      ctx.beginPath();
      ctx.ellipse(dx * r, dy * r, r * 0.09, r * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'patty') {
    ctx.fillStyle = ing.color;
    roundRect(ctx, -r, -r * 0.42, r * 2, r * 0.84, r * 0.4);
    ctx.fill();
    ctx.fillStyle = ing.dark;
    for (const [dx, dy] of [[-0.5, -0.1], [0.1, 0.15], [0.55, -0.15]]) {
      ctx.beginPath();
      ctx.arc(dx * r, dy * r, r * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'lettuce') {
    ctx.fillStyle = ing.color;
    for (const [dx, dy, rr] of [[-0.45, 0, 0.55], [0.45, 0, 0.55], [0, -0.25, 0.6], [0, 0.25, 0.5]]) {
      ctx.beginPath();
      ctx.arc(dx * r, dy * r, rr * r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = ing.dark;
    ctx.lineWidth = r * 0.08;
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, 0);
    ctx.quadraticCurveTo(0, -r * 0.5, r * 0.6, 0);
    ctx.stroke();
  } else if (id === 'tomato') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f28b85';
    ctx.beginPath();
    ctx.arc(-r * 0.25, -r * 0.25, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.beginPath();
    ctx.arc(0, -r * 0.55, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'cheese') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.6);
    ctx.lineTo(r, r * 0.6);
    ctx.lineTo(0, -r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.dark;
    for (const [dx, dy] of [[-0.35, 0.25], [0.3, 0.1]]) {
      ctx.beginPath();
      ctx.arc(dx * r, dy * r, r * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'fries') {
    ctx.fillStyle = '#e5534b';
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, -r * 0.1);
    ctx.lineTo(r * 0.7, -r * 0.1);
    ctx.lineTo(r * 0.5, r * 0.85);
    ctx.lineTo(-r * 0.5, r * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = ing.color;
    ctx.lineWidth = r * 0.22;
    ctx.lineCap = 'round';
    for (const dx of [-0.45, -0.15, 0.15, 0.45]) {
      ctx.beginPath();
      ctx.moveTo(dx * r, -r * 0.1);
      ctx.lineTo(dx * r + r * 0.08, -r * 0.95);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = FIELD.width * dpr;
    canvas.height = FIELD.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  fit();
  window.addEventListener('resize', fit);

  function text(str, x, y, size, color, weight = 700, align = 'left') {
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px ${FONT}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(str, x, y);
  }

  function drawBackground() {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.wallTile;
    for (let x = 0; x < FIELD.width; x += 64) {
      for (let y = 56; y < 196; y += 64) {
        if (((x + y) / 64) % 2 === 0) ctx.fillRect(x, y, 62, 62);
      }
    }
    ctx.fillStyle = PALETTE.floor;
    ctx.fillRect(0, 588, FIELD.width, 132);
    ctx.strokeStyle = PALETTE.floorLine;
    ctx.lineWidth = 2;
    for (let x = 0; x < FIELD.width; x += 96) {
      ctx.beginPath();
      ctx.moveTo(x, 588);
      ctx.lineTo(x - 48, 720);
      ctx.stroke();
    }
  }

  function drawTopBar(state, screen, ui) {
    ctx.fillStyle = PALETTE.counter;
    ctx.fillRect(0, 0, FIELD.width, 56);
    ctx.fillStyle = PALETTE.counterTop;
    ctx.fillRect(0, 52, FIELD.width, 4);
    text('🍳 SIZZLE & SERVE', 16, 29, 24, '#fff8ec', 800);
    const timeLeft = SHIFT_LENGTH - state.time;
    const frac = Math.max(0, timeLeft / SHIFT_LENGTH);
    ctx.fillStyle = '#5d3a24';
    roundRect(ctx, 300, 14, 360, 28, 14);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? PALETTE.good : frac > 0.25 ? PALETTE.warn : PALETTE.bad;
    if (frac > 0) {
      roundRect(ctx, 300, 14, 360 * frac, 28, 14);
      ctx.fill();
    }
    text(`⏱ ${formatTime(timeLeft)}`, 480, 29, 20, '#ffffff', 800, 'center');
    text(`SCORE ${state.score}`, 700, 29, 20, '#fff8ec', 800);
    text(`🪙 ${state.coins}`, 860, 29, 20, PALETTE.gold, 800);
    if (state.combo >= 2) text(`🔥 COMBO x${state.combo}`, 960, 29, 20, '#ffb26b', 800);
    ctx.fillStyle = ui.muted ? '#8a5a3b' : '#fff8ec';
    roundRect(ctx, LAYOUT.muteButton.x, LAYOUT.muteButton.y, 40, 36, 8);
    ctx.fill();
    text(ui.muted ? '🔇' : '🔊', 1156, 29, 18, PALETTE.text, 700, 'center');
    ctx.fillStyle = '#fff8ec';
    roundRect(ctx, LAYOUT.pauseButton.x, LAYOUT.pauseButton.y, 40, 36, 8);
    ctx.fill();
    text(screen === SCREEN_PAUSED ? '▶' : '⏸', 1204, 29, 18, PALETTE.text, 700, 'center');
  }

  function drawBoard(state) {
    ctx.fillStyle = PALETTE.board;
    roundRect(ctx, LAYOUT.board.x, LAYOUT.board.y, LAYOUT.board.w, LAYOUT.board.h, 12);
    ctx.fill();
    ctx.strokeStyle = PALETTE.boardEdge;
    ctx.lineWidth = 2;
    ctx.stroke();
    text('📋 ORDER BOARD', 32, 86, 15, PALETTE.muted, 800);
    for (let i = 0; i < 4; i += 1) {
      const x = 32 + i * (LAYOUT.ticket.w + LAYOUT.ticket.gap);
      const y = 96;
      if (i >= state.orders.length) {
        ctx.fillStyle = 'rgba(122, 106, 88, 0.12)';
        roundRect(ctx, x, y, LAYOUT.ticket.w, 68, 10);
        ctx.fill();
        text('— waiting —', x + LAYOUT.ticket.w / 2, y + 34, 14, PALETTE.muted, 600, 'center');
        continue;
      }
      const order = state.orders[i];
      const frac = Math.max(0, order.timeLeft / order.patience);
      const urgent = frac < 0.35;
      ctx.fillStyle = PALETTE.ticket;
      roundRect(ctx, x, y, LAYOUT.ticket.w, 68, 10);
      ctx.fill();
      ctx.strokeStyle = urgent ? PALETTE.bad : PALETTE.ticketEdge;
      ctx.lineWidth = urgent ? 3 : 2;
      ctx.stroke();
      text(`#${order.id} ${order.recipe.name}`, x + 12, y + 16, 16, PALETTE.text, 800);
      text(`$${order.recipe.price}`, x + LAYOUT.ticket.w - 12, y + 16, 16, PALETTE.good, 800, 'right');
      order.recipe.items.forEach((item, j) => {
        drawIngredient(ctx, item, x + 24 + j * 36, y + 44, 13);
      });
      ctx.fillStyle = '#e8dfc9';
      roundRect(ctx, x + 12, y + 58, LAYOUT.ticket.w - 24, 6, 3);
      ctx.fill();
      ctx.fillStyle = frac > 0.5 ? PALETTE.good : frac > 0.25 ? PALETTE.warn : PALETTE.bad;
      if (frac > 0) {
        roundRect(ctx, x + 12, y + 58, (LAYOUT.ticket.w - 24) * frac, 6, 3);
        ctx.fill();
      }
    }
  }

  function drawGrill(state, ui) {
    const g = LAYOUT.grill;
    ctx.fillStyle = PALETTE.steel;
    roundRect(ctx, g.x, g.y, g.w, g.h, 12);
    ctx.fill();
    ctx.strokeStyle = PALETTE.steelDark;
    ctx.lineWidth = 2;
    ctx.stroke();
    text('🔥 GRILL', g.x + 14, g.y + 18, 15, PALETTE.text, 800);
    state.grill.forEach((slot, i) => {
      const x = g.x + 14 + i * (LAYOUT.grillSlot.w + LAYOUT.grillSlot.gap);
      const y = g.y + 32;
      const hover = inRect({ x, y, w: LAYOUT.grillSlot.w, h: LAYOUT.grillSlot.h }, ui.mouse);
      ctx.fillStyle = slot.state === 'burnt' ? '#241d18' : PALETTE.grill;
      roundRect(ctx, x, y, LAYOUT.grillSlot.w, LAYOUT.grillSlot.h, 10);
      ctx.fill();
      if (hover) {
        ctx.strokeStyle = PALETTE.gold;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;
      for (let gy = y + 18; gy < y + LAYOUT.grillSlot.h - 8; gy += 18) {
        ctx.beginPath();
        ctx.moveTo(x + 10, gy);
        ctx.lineTo(x + LAYOUT.grillSlot.w - 10, gy);
        ctx.stroke();
      }
      const cx = x + LAYOUT.grillSlot.w / 2;
      const cy = y + LAYOUT.grillSlot.h / 2 + 6;
      if (slot.state === 'cooking') {
        drawIngredient(ctx, 'patty', cx, cy, 30);
        const frac = Math.min(1, slot.t / 6);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        roundRect(ctx, x + 14, y + 10, LAYOUT.grillSlot.w - 28, 8, 4);
        ctx.fill();
        ctx.fillStyle = PALETTE.grillHot;
        roundRect(ctx, x + 14, y + 10, (LAYOUT.grillSlot.w - 28) * frac, 8, 4);
        ctx.fill();
        text('COOKING…', cx, y + LAYOUT.grillSlot.h - 12, 11, '#ffffff', 700, 'center');
      } else if (slot.state === 'done') {
        drawIngredient(ctx, 'patty', cx, cy, 32);
        ctx.fillStyle = PALETTE.good;
        ctx.beginPath();
        ctx.arc(x + LAYOUT.grillSlot.w - 16, y + 16, 11, 0, Math.PI * 2);
        ctx.fill();
        text('✓', x + LAYOUT.grillSlot.w - 16, y + 17, 13, '#ffffff', 800, 'center');
        text('READY — CLICK!', cx, y + LAYOUT.grillSlot.h - 12, 11, PALETTE.good, 800, 'center');
      } else if (slot.state === 'burnt') {
        drawIngredient(ctx, 'patty', cx, cy, 30);
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.arc(cx, cy, 30, 0, Math.PI * 2);
        ctx.fill();
        text('BURNT — CLICK TO BIN', cx, y + LAYOUT.grillSlot.h - 12, 11, '#ff9d8a', 800, 'center');
      } else {
        text('empty', cx, cy, 14, '#8a93a3', 600, 'center');
      }
    });
  }

  function drawPlateItems(ctx, items, cx, cy) {
    const n = items.length;
    items.forEach((item, i) => {
      const y = cy + 14 - (n - 1 - i) * 0 + (i - (n - 1) / 2) * 0;
      drawIngredient(ctx, item, cx, cy + 10 - (n - 1 - i) * 16, 20);
      void y;
    });
  }

  function drawPlates(state, ui) {
    const p = LAYOUT.plates;
    ctx.fillStyle = PALETTE.counter;
    roundRect(ctx, p.x, p.y, p.w, p.h, 12);
    ctx.fill();
    ctx.fillStyle = PALETTE.counterTop;
    ctx.fillRect(p.x, p.y, p.w, 10);
    text('🍽 ASSEMBLY COUNTER', p.x + 14, p.y + 26, 15, '#fff8ec', 800);
    state.plates.forEach((plate, i) => {
      const x = p.x + 16 + i * (LAYOUT.plate.w + LAYOUT.plate.gap);
      const y = p.y + 40;
      const active = state.activePlate === i;
      const hover = inRect({ x, y, w: LAYOUT.plate.w, h: LAYOUT.plate.h - 16 }, ui.mouse);
      ctx.fillStyle = active ? '#fff3d6' : PALETTE.plate;
      roundRect(ctx, x, y, LAYOUT.plate.w, LAYOUT.plate.h - 16, 12);
      ctx.fill();
      ctx.strokeStyle = active ? PALETTE.gold : PALETTE.plateEdge;
      ctx.lineWidth = active ? 4 : 2;
      ctx.stroke();
      const cx = x + LAYOUT.plate.w / 2;
      const cy = y + (LAYOUT.plate.h - 16) / 2 + 4;
      ctx.fillStyle = '#dfe4ea';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 18, 74, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b9c0c9';
      ctx.lineWidth = 2;
      ctx.stroke();
      if (plate.items.length === 0) {
        text(active ? 'click ingredients ↓' : 'empty plate', cx, cy - 6, 13, PALETTE.muted, 600, 'center');
      } else {
        drawPlateItems(ctx, plate.items, cx, cy);
        if (state.plates[i].items.length > 0) {
          const ready = plateCouldServeLocal(state, plate.items);
          if (ready) text('✓ READY TO SERVE', cx, y + 16, 12, PALETTE.good, 800, 'center');
        }
      }
      if (hover && !active) text('click to use this plate', cx, y + LAYOUT.plate.h - 26, 11, PALETTE.muted, 600, 'center');
      text(`PLATE ${i + 1}${active ? ' ●' : ''}`, x + 10, y + 14, 11, PALETTE.muted, 700);
    });

    function plateCouldServeLocal(st, items) {
      for (const order of st.orders) {
        if (items.length === order.recipe.items.length) {
          const a = [...items].sort();
          const b = [...order.recipe.items].sort();
          if (a.every((v, j) => v === b[j])) return true;
        }
      }
      return false;
    }
  }

  function drawServe(state, ui) {
    const s = LAYOUT.serve;
    ctx.fillStyle = PALETTE.steel;
    roundRect(ctx, s.x, s.y, s.w, s.h, 12);
    ctx.fill();
    ctx.strokeStyle = PALETTE.steelDark;
    ctx.lineWidth = 2;
    ctx.stroke();
    text('🛎 SERVE WINDOW', s.x + 14, s.y + 18, 15, PALETTE.text, 800);
    const activeItems = state.plates[state.activePlate].items;
    let match = null;
    for (const order of state.orders) {
      if (activeItems.length === order.recipe.items.length) {
        const a = [...activeItems].sort();
        const b = [...order.recipe.items].sort();
        if (a.every((v, j) => v === b[j])) { match = order; break; }
      }
    }
    const bx = s.x + 24;
    const by = s.y + 34;
    const bw = 150;
    const bh = 96;
    const hover = inRect({ x: bx, y: by, w: bw, h: bh }, ui.mouse);
    ctx.fillStyle = match ? PALETTE.good : hover ? '#d5dae1' : '#b9c0c9';
    roundRect(ctx, bx, by, bw, bh, 14);
    ctx.fill();
    ctx.strokeStyle = match ? '#3d7a26' : PALETTE.steelDark;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = match ? '#ffffff' : PALETTE.text;
    ctx.font = `800 44px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔔', bx + bw / 2, by + 32);
    text(match ? 'SERVE!' : 'SERVE', bx + bw / 2, by + 76, 20, match ? '#ffffff' : PALETTE.text, 800, 'center');
    const tx = s.x + 190;
    text('Active plate:', tx, s.y + 48, 13, PALETTE.muted, 700);
    if (activeItems.length === 0) {
      text('empty — add', tx, s.y + 72, 14, PALETTE.text, 600);
      text('ingredients below', tx, s.y + 92, 14, PALETTE.text, 600);
    } else if (match) {
      text(`✓ ${match.recipe.name}`, tx, s.y + 72, 14, PALETTE.good, 800);
      text(`#${match.id} — $${match.recipe.price}`, tx, s.y + 92, 14, PALETTE.text, 600);
    } else {
      text('does not match', tx, s.y + 72, 14, PALETTE.bad, 800);
      text('any open order', tx, s.y + 92, 14, PALETTE.text, 600);
    }
    const trash = { x: s.x + s.w - 78, y: s.y + s.h - 40, w: 64, h: 28 };
    ctx.fillStyle = inRect(trash, ui.mouse) ? '#e5534b' : '#c9ced6';
    roundRect(ctx, trash.x, trash.y, trash.w, trash.h, 8);
    ctx.fill();
    text('🗑 TRASH', trash.x + trash.w / 2, trash.y + 15, 12, '#ffffff', 800, 'center');
  }

  function drawBins(state, ui) {
    const bins = LAYOUT.bins;
    text('🥬 INGREDIENTS — click a bin (or press 1–6) to add it to the active plate', 16, bins.y - 12, 15, PALETTE.text, 800);
    const ingredients = ['bun', 'patty', 'lettuce', 'tomato', 'cheese', 'fries'];
    ingredients.forEach((id, i) => {
      const ing = ING_BY_ID[id];
      const x = bins.x + i * (LAYOUT.bin.w + LAYOUT.bin.gap);
      const y = bins.y + 8;
      const hover = inRect({ x, y, w: LAYOUT.bin.w, h: LAYOUT.bin.h }, ui.mouse);
      ctx.fillStyle = hover ? '#ffe9b8' : '#fff8ec';
      roundRect(ctx, x, y, LAYOUT.bin.w, LAYOUT.bin.h, 14);
      ctx.fill();
      ctx.strokeStyle = hover ? PALETTE.gold : PALETTE.boardEdge;
      ctx.lineWidth = hover ? 3 : 2;
      ctx.stroke();
      drawIngredient(ctx, id, x + LAYOUT.bin.w / 2, y + 74, 46);
      text(ing.name, x + LAYOUT.bin.w / 2, y + 138, 20, PALETTE.text, 800, 'center');
      text(id === 'patty' ? 'goes on the grill' : 'onto the plate', x + LAYOUT.bin.w / 2, y + 162, 13, PALETTE.muted, 600, 'center');
      ctx.fillStyle = PALETTE.counter;
      ctx.beginPath();
      ctx.arc(x + 22, y + 22, 14, 0, Math.PI * 2);
      ctx.fill();
      text(ing.key, x + 22, y + 23, 15, '#ffffff', 800, 'center');
    });
  }

  function drawBottomBar(state, ui) {
    text('Keys: 1–6 ingredients · G take patty · S serve · T trash plate · Q switch plate · P pause · M mute', 16, 616, 14, PALETTE.text, 600);
    text('Build the dish an order asks for, grill the patty first, and serve before the ticket timer runs out!', 16, 640, 14, PALETTE.muted, 600);
    const hearts = STRIKES_MAX - state.strikes;
    let hx = 1248;
    for (let i = 0; i < STRIKES_MAX; i += 1) {
      text(i < hearts ? '❤️' : '🖤', hx - i * 34, 628, 22, '#ffffff', 700, 'center');
    }
    text('missed orders', 1248 - 3 * 34 - 8, 628, 13, PALETTE.text, 700, 'right');
    text(`Served: ${state.served}   Missed: ${state.missed}   Best combo: x${state.bestCombo}`, 16, 668, 14, PALETTE.text, 600);
    if (ui.toast) {
      ctx.fillStyle = 'rgba(46, 33, 24, 0.85)';
      const tw = 420;
      roundRect(ctx, FIELD.width / 2 - tw / 2, 660, tw, 40, 20);
      ctx.fill();
      text(ui.toast, FIELD.width / 2, 681, 16, '#ffffff', 700, 'center');
    }
  }

  function drawOverlay(lines, sublines, panel) {
    ctx.fillStyle = PALETTE.overlay;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    if (panel) {
      ctx.fillStyle = 'rgba(46, 33, 24, 0.88)';
      roundRect(ctx, panel.x, panel.y, panel.w, panel.h, 18);
      ctx.fill();
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    let y = panel ? panel.y + 62 : 200;
    for (const line of lines) {
      text(line.text, FIELD.width / 2, y, line.size, line.color, 800, 'center');
      y += line.size + 14;
    }
    y += 6;
    for (const sub of sublines) {
      text(sub, FIELD.width / 2, y, 17, '#fff8ec', 600, 'center');
      y += 28;
    }
  }

  function draw(state, screen, best, ui) {
    drawBackground();
    drawTopBar(state, screen, ui);
    drawBoard(state);
    drawGrill(state, ui);
    drawPlates(state, ui);
    drawServe(state, ui);
    drawBins(state, ui);
    drawBottomBar(state, ui);

    if (screen === SCREEN_TITLE) {
      drawOverlay(
        [
          { text: '🍳 SIZZLE & SERVE', size: 56, color: '#fff8ec' },
          { text: 'The lunch rush is on — cook fast, serve faster!', size: 24, color: PALETTE.gold },
        ],
        [
          'Orders land on the board with a timer. Build each dish on a plate,',
          'grill every patty first, and ring the bell to serve before time runs out.',
          '',
          'Click or press SPACE to start the shift  •  Best score: ' + best,
        ],
        { x: 190, y: 150, w: 900, h: 300 },
      );
    } else if (screen === SCREEN_PAUSED) {
      drawOverlay(
        [{ text: '⏸ PAUSED', size: 48, color: '#fff8ec' }],
        ['Press P or click ▶ to keep cooking.'],
      );
    } else if (screen === SCREEN_OVER) {
      const stars = state.served >= 12 ? '★★★' : state.served >= 8 ? '★★' : state.served >= 4 ? '★' : '☆';
      drawOverlay(
        [
          { text: state.strikes >= STRIKES_MAX ? '😖 SHIFT CUT SHORT' : '🎉 SHIFT COMPLETE!', size: 44, color: '#fff8ec' },
          { text: `${stars}  Score ${state.score}  •  ${state.coins} coins  •  ${state.served} served`, size: 26, color: PALETTE.gold },
        ],
        [
          `Best combo x${state.bestCombo}  •  Missed ${state.missed} order${state.missed === 1 ? '' : 's'}  •  Best score: ${Math.max(best, state.score)}`,
          '',
          'Press SPACE or click to cook another shift.',
        ],
        { x: 190, y: 160, w: 900, h: 280 },
      );
    }
  }

  return { draw };
}
