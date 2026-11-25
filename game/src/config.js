// Sizzle & Serve — every tuning number, colour and layout rect in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** One shift lasts this long; the game ends when it runs out. */
export const SHIFT_LENGTH = 150;

/** Seconds a raw patty needs on the grill to cook, and how long after that before it burns. */
export const COOK_TIME = 6;
export const BURN_TIME = 6;

/** How many ingredients fit on one plate, and how many orders the board holds. */
export const PLATE_SLOTS = 4;
export const MAX_ORDERS = 4;

/** Missed orders before the shift ends early. */
export const STRIKES_MAX = 3;

/** Seconds between new orders at the start of a shift and at its end. */
export const SPAWN_START = 8;
export const SPAWN_END = 4.5;

/** Order patience (seconds) at the start of a shift and at its end. */
export const PATIENCE_START = 48;
export const PATIENCE_END = 36;

export const INGREDIENTS = [
  { id: 'bun', name: 'Bun', key: '1', color: '#e8b06a', dark: '#c98d4a' },
  { id: 'patty', name: 'Patty', key: '2', color: '#8a5a3b', dark: '#6b4229' },
  { id: 'lettuce', name: 'Lettuce', key: '3', color: '#7ec850', dark: '#57a336' },
  { id: 'tomato', name: 'Tomato', key: '4', color: '#e5534b', dark: '#b93a34' },
  { id: 'cheese', name: 'Cheese', key: '5', color: '#f2c94c', dark: '#d9a92c' },
  { id: 'fries', name: 'Fries', key: '6', color: '#f6d365', dark: '#e0a93c' },
];

export const ING_BY_ID = Object.fromEntries(INGREDIENTS.map((ing) => [ing.id, ing]));

/** Recipes: the dishes orders ask for. `items` is the exact multiset a plate must hold. */
export const RECIPES = [
  { id: 'burger', name: 'Classic Burger', items: ['bun', 'patty', 'lettuce'], price: 8, weight: 3 },
  { id: 'cheeseburger', name: 'Cheese Melt', items: ['bun', 'patty', 'cheese'], price: 10, weight: 3 },
  { id: 'garden', name: 'Garden Stack', items: ['bun', 'lettuce', 'tomato', 'cheese'], price: 9, weight: 2 },
  { id: 'double', name: 'Double Stack', items: ['bun', 'patty', 'patty', 'cheese'], price: 14, weight: 1 },
  { id: 'fries', name: 'Crispy Fries', items: ['fries'], price: 5, weight: 2 },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((recipe) => [recipe.id, recipe]));

/**
 * Clickable zones, shared by the renderer and the click handling so they can
 * never drift apart. Every rect is { x, y, w, h } in logical coordinates.
 */
export const LAYOUT = {
  topBar: { x: 0, y: 0, w: 1280, h: 56 },
  board: { x: 16, y: 68, w: 1248, h: 108 },
  ticket: { w: 300, h: 104, gap: 16 },
  grill: { x: 16, y: 196, w: 300, h: 148 },
  grillSlot: { w: 128, h: 108, gap: 16 },
  plates: { x: 340, y: 196, w: 560, h: 148 },
  plate: { w: 260, h: 128, gap: 24 },
  serve: { x: 924, y: 196, w: 340, h: 148 },
  trash: { x: 924, y: 196, w: 64, h: 64 },
  bins: { x: 16, y: 368, w: 1248, h: 200 },
  bin: { w: 196, h: 188, gap: 14 },
  bottomBar: { x: 0, y: 588, w: 1280, h: 132 },
  pauseButton: { x: 1184, y: 10, w: 40, h: 36 },
  muteButton: { x: 1136, y: 10, w: 40, h: 36 },
};

export const PALETTE = {
  wall: '#f7e8d0',
  wallTile: '#f2ddbd',
  floor: '#c98d5f',
  floorLine: '#b57a4e',
  counter: '#8a5a3b',
  counterTop: '#a9744f',
  steel: '#c9ced6',
  steelDark: '#9aa1ad',
  grill: '#3a3f47',
  grillHot: '#e5534b',
  board: '#fff8ec',
  boardEdge: '#d9c39a',
  ticket: '#fffdf6',
  ticketEdge: '#e0d3b3',
  plate: '#f4f6f8',
  plateEdge: '#c9ced6',
  bell: '#f2c94c',
  bellDark: '#d9a92c',
  text: '#2e2118',
  muted: '#7a6a58',
  good: '#57a336',
  warn: '#e08a1e',
  bad: '#e5534b',
  accent: '#e5534b',
  gold: '#f2c94c',
  panel: '#fff8ec',
  overlay: 'rgba(46, 33, 24, 0.72)',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'sizzle-and-serve.best';
