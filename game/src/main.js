// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps (several in a slow frame, none in a fast one), and the renderer
// paints what is there. The game moves between four screens: title, play,
// paused and game over.
//
// ?seed=N fixes the order pattern. ?shot=start|play|rush|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, INGREDIENTS, LAYOUT, STEP } from './config.js';
import { createAudio } from './audio.js';
import {
  ACTION_BIN_1,
  ACTION_CONFIRM,
  ACTION_GRILL,
  ACTION_MUTE,
  ACTION_PAUSE,
  ACTION_PLATE_NEXT,
  ACTION_PLATE_PREV,
  ACTION_SERVE,
  ACTION_TRASH,
  createInput,
} from './input.js';
import { createWorldWithSeed } from './world.js';
import { EVENT_EXPIRED, EVENT_OVER, EVENT_PATTY_BURNT, EVENT_PATTY_DONE, EVENT_SERVED, EVENT_WRONG } from './world.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorldWithSeed(seed);
const renderer = createRenderer(canvas);
const audio = createAudio();

// Play-test hooks: the page's own state, readable from the console or CDP.
window.__world = world.state;
window.__errors = [];
window.addEventListener('error', (event) => {
  window.__errors.push(String(event.message || event.error || 'error'));
});

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, { mouse: { x: -1, y: -1 }, muted: false, toast: null });
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let toast = null;
  let toastUntil = 0;

  world.reset();

  function showToast(message) {
    toast = message;
    toastUntil = performance.now() + 2200;
  }

  // Screen readers (and anyone watching the page's text) hear the screen changes and each serve.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.unlock();
    announce('Playing. Serve the orders before their timers run out.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    audio.play('over');
    announce(`Shift over. Score ${world.state.score}. Served ${world.state.served} orders.`);
  }

  function handleServeResult(events) {
    if (events & EVENT_SERVED) {
      const served = world.state.lastServed;
      audio.play('serve');
      showToast(`Served ${served.name}! +${served.coins} coins (combo x${served.combo})`);
      announce(`Served ${served.name}. Score ${world.state.score}.`);
    } else if (events & EVENT_WRONG) {
      audio.play('buzz');
      showToast("That dish doesn't match any open order!");
    }
  }

  function doServe() {
    const events = world.serve();
    handleServeResult(events);
  }

  function clickZones() {
    const zones = [];
    zones.push({ kind: 'mute', rect: LAYOUT.muteButton });
    zones.push({ kind: 'pause', rect: LAYOUT.pauseButton });
    for (let i = 0; i < 2; i += 1) {
      zones.push({
        kind: 'grill',
        index: i,
        rect: {
          x: LAYOUT.grill.x + 14 + i * (LAYOUT.grillSlot.w + LAYOUT.grillSlot.gap),
          y: LAYOUT.grill.y + 32,
          w: LAYOUT.grillSlot.w,
          h: LAYOUT.grillSlot.h,
        },
      });
    }
    for (let i = 0; i < 2; i += 1) {
      zones.push({
        kind: 'plate',
        index: i,
        rect: {
          x: LAYOUT.plates.x + 16 + i * (LAYOUT.plate.w + LAYOUT.plate.gap),
          y: LAYOUT.plates.y + 40,
          w: LAYOUT.plate.w,
          h: LAYOUT.plate.h - 16,
        },
      });
    }
    zones.push({
      kind: 'serve',
      rect: { x: LAYOUT.serve.x + 24, y: LAYOUT.serve.y + 34, w: 150, h: 96 },
    });
    zones.push({
      kind: 'trash',
      rect: { x: LAYOUT.serve.x + LAYOUT.serve.w - 78, y: LAYOUT.serve.y + LAYOUT.serve.h - 40, w: 64, h: 28 },
    });
    for (let i = 0; i < 6; i += 1) {
      zones.push({
        kind: 'bin',
        index: i,
        rect: {
          x: LAYOUT.bins.x + i * (LAYOUT.bin.w + LAYOUT.bin.gap),
          y: LAYOUT.bins.y + 8,
          w: LAYOUT.bin.w,
          h: LAYOUT.bin.h,
        },
      });
    }
    return zones;
  }

  const zones = clickZones();

  function handleClick(pos) {
    audio.unlock();
    for (const zone of zones) {
      const r = zone.rect;
      if (pos.x >= r.x && pos.x <= r.x + r.w && pos.y >= r.y && pos.y <= r.y + r.h) {
        if (zone.kind === 'mute') {
          audio.toggleMute();
          return;
        }
        if (zone.kind === 'pause') {
          if (screen === SCREEN_PLAY) screen = SCREEN_PAUSED;
          else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
          return;
        }
        if (screen !== SCREEN_PLAY) return;
        if (zone.kind === 'grill') {
          if (world.takeGrill(zone.index)) audio.play('pop');
          return;
        }
        if (zone.kind === 'plate') {
          world.switchPlate(zone.index);
          audio.play('click');
          return;
        }
        if (zone.kind === 'serve') {
          doServe();
          return;
        }
        if (zone.kind === 'trash') {
          if (world.trashPlate()) audio.play('click');
          return;
        }
        if (zone.kind === 'bin') {
          const ing = INGREDIENTS[zone.index];
          if (world.addBin(ing.id)) audio.play(ing.id === 'patty' ? 'sizzle' : 'add');
          return;
        }
      }
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) audio.toggleMute();
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) screen = SCREEN_PAUSED;
      else if (screen === SCREEN_PAUSED) screen = SCREEN_PLAY;
    }
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
      if (actions & ACTION_CONFIRM) startGame();
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    for (let i = 0; i < 6; i += 1) {
      if (actions & (ACTION_BIN_1 << i)) {
        const ing = INGREDIENTS[i];
        if (world.addBin(ing.id)) audio.play(ing.id === 'patty' ? 'sizzle' : 'add');
      }
    }
    if (actions & ACTION_GRILL) {
      if (world.takeAnyGrill()) audio.play('pop');
    }
    if (actions & ACTION_SERVE) doServe();
    if (actions & ACTION_TRASH) {
      if (world.trashPlate()) audio.play('click');
    }
    if (actions & ACTION_PLATE_PREV) world.switchPlate(0);
    if (actions & ACTION_PLATE_NEXT) world.switchPlate(1);
  }

  function step() {
    const events = world.step(STEP);
    if (events & EVENT_PATTY_DONE) {
      audio.play('pop');
      showToast('Patty ready on the grill!');
    }
    if (events & EVENT_PATTY_BURNT) {
      audio.play('buzz');
      showToast('A patty burnt on the grill!');
    }
    if (events & EVENT_EXPIRED) {
      audio.play('expire');
      showToast('An order expired — strike!');
      announce('An order expired.');
    }
    if (events & EVENT_OVER) endGame();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    for (const click of input.takeClicks()) {
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER) startGame();
      else handleClick(click);
    }
    handleActions();
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    if (toast && performance.now() > toastUntil) toast = null;
    renderer.draw(world.state, screen, best, { mouse: input.mouse, muted: audio.muted, toast });
  }

  // Leaving the tab pauses a running game rather than letting orders expire unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Sizzle and Serve. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
