// Mouse and keyboard input. The renderer asks where the pointer is (for hover
// highlights); the game loop takes the clicks and the key actions each frame.
// Clicks are reported in the game's logical coordinates, whatever the window size.
import { FIELD } from './config.js';

export const ACTION_CONFIRM = 1 << 0;
export const ACTION_PAUSE = 1 << 1;
export const ACTION_MUTE = 1 << 2;
export const ACTION_SERVE = 1 << 3;
export const ACTION_TRASH = 1 << 4;
export const ACTION_GRILL = 1 << 5;
export const ACTION_PLATE_PREV = 1 << 6;
export const ACTION_PLATE_NEXT = 1 << 7;
export const ACTION_BIN_1 = 1 << 8;
export const ACTION_BIN_2 = 1 << 9;
export const ACTION_BIN_3 = 1 << 10;
export const ACTION_BIN_4 = 1 << 11;
export const ACTION_BIN_5 = 1 << 12;
export const ACTION_BIN_6 = 1 << 13;

const KEY_ACTIONS = {
  ' ': ACTION_CONFIRM,
  Enter: ACTION_CONFIRM,
  p: ACTION_PAUSE,
  P: ACTION_PAUSE,
  Escape: ACTION_PAUSE,
  m: ACTION_MUTE,
  M: ACTION_MUTE,
  s: ACTION_SERVE,
  S: ACTION_SERVE,
  t: ACTION_TRASH,
  T: ACTION_TRASH,
  g: ACTION_GRILL,
  G: ACTION_GRILL,
  q: ACTION_PLATE_PREV,
  Q: ACTION_PLATE_PREV,
  Tab: ACTION_PLATE_NEXT,
  1: ACTION_BIN_1,
  2: ACTION_BIN_2,
  3: ACTION_BIN_3,
  4: ACTION_BIN_4,
  5: ACTION_BIN_5,
  6: ACTION_BIN_6,
};

export function createInput(canvas) {
  let mouseX = FIELD.width / 2;
  let mouseY = FIELD.height / 2;
  let clicks = [];
  let actions = 0;

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * FIELD.width,
      y: ((event.clientY - rect.top) / rect.height) * FIELD.height,
    };
  }

  canvas.addEventListener('pointermove', (event) => {
    const pos = toLogical(event);
    mouseX = pos.x;
    mouseY = pos.y;
  });

  canvas.addEventListener('pointerdown', (event) => {
    const pos = toLogical(event);
    mouseX = pos.x;
    mouseY = pos.y;
    clicks.push(pos);
  });

  window.addEventListener('keydown', (event) => {
    const action = KEY_ACTIONS[event.key];
    if (action === undefined) return;
    event.preventDefault();
    actions |= action;
  });

  return {
    get mouse() { return { x: mouseX, y: mouseY }; },
    takeClicks() {
      const taken = clicks;
      clicks = [];
      return taken;
    },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
