// Sizzle & Serve — the kitchen simulation. Everything the game is lives here:
// orders arriving on the board, patties cooking on the grill, dishes built on
// the plates, and the score. The renderer only reads this state; the input
// layer only calls the action functions below.
import {
  BURN_TIME,
  COOK_TIME,
  MAX_ORDERS,
  PATIENCE_END,
  PATIENCE_START,
  PLATE_SLOTS,
  RECIPES,
  SHIFT_LENGTH,
  SPAWN_END,
  SPAWN_START,
  STRIKES_MAX,
} from './config.js';
import { createRandom } from './random.js';

export const EVENT_NONE = 0;
export const EVENT_SERVED = 1;
export const EVENT_WRONG = 2;
export const EVENT_EXPIRED = 4;
export const EVENT_OVER = 8;
export const EVENT_PATTY_DONE = 16;
export const EVENT_PATTY_BURNT = 32;

export function sameMultiset(a, b) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  for (let i = 0; i < sortedA.length; i += 1) {
    if (sortedA[i] !== sortedB[i]) return false;
  }
  return true;
}

function isSubset(items, recipeItems) {
  const remaining = [...recipeItems];
  for (const item of items) {
    const index = remaining.indexOf(item);
    if (index === -1) return false;
    remaining.splice(index, 1);
  }
  return true;
}

export function createWorld(random) {
  const state = freshState();

  function freshState() {
    return {
      time: 0,
      score: 0,
      coins: 0,
      combo: 0,
      bestCombo: 0,
      served: 0,
      missed: 0,
      strikes: 0,
      orders: [],
      nextOrderId: 1,
      nextOrderIn: 1.5,
      grill: [
        { state: 'empty', t: 0 },
        { state: 'empty', t: 0 },
      ],
      plates: [{ items: [] }, { items: [] }],
      activePlate: 0,
      over: false,
      lastServed: null,
    };
  }

  function reset() {
    Object.assign(state, freshState());
    spawnOrder();
    spawnOrder();
  }

  function spawnOrder() {
    if (state.orders.length >= MAX_ORDERS) return false;
    const progress = Math.min(1, state.time / SHIFT_LENGTH);
    const recipe = random.weighted(RECIPES);
    const patience = PATIENCE_START + (PATIENCE_END - PATIENCE_START) * progress + random.range(0, 6);
    state.orders.push({
      id: state.nextOrderId,
      recipe,
      patience,
      timeLeft: patience,
    });
    state.nextOrderId += 1;
    return true;
  }

  function spawnInterval() {
    const progress = Math.min(1, state.time / SHIFT_LENGTH);
    return SPAWN_START + (SPAWN_END - SPAWN_START) * progress;
  }

  /** The open order this plate could still become, preferring the most urgent. */
  function matchingOrder(items) {
    let best = null;
    for (const order of state.orders) {
      if (sameMultiset(items, order.recipe.items)) {
        if (!best || order.timeLeft < best.timeLeft) best = order;
      }
    }
    return best;
  }

  function plateCouldServe(items) {
    return matchingOrder(items) !== null;
  }

  function plateFitsOrder(items) {
    for (const order of state.orders) {
      if (isSubset(items, order.recipe.items)) return true;
    }
    return items.length === 0;
  }

  function activePlate() {
    return state.plates[state.activePlate];
  }

  function addToPlate(ingredient) {
    const plate = activePlate();
    if (plate.items.length >= PLATE_SLOTS) return false;
    plate.items.push(ingredient);
    return true;
  }

  /** Clicking a bin: a patty goes on the grill, everything else onto the plate. */
  function addBin(ingredient) {
    if (ingredient === 'patty') return startGrill();
    return addToPlate(ingredient);
  }

  function startGrill() {
    const slot = state.grill.find((s) => s.state === 'empty');
    if (!slot) return false;
    slot.state = 'cooking';
    slot.t = 0;
    return true;
  }

  /** Take a cooked patty off the grill onto the plate; a burnt one is binned. */
  function takeGrill(index) {
    const slot = state.grill[index];
    if (!slot) return false;
    if (slot.state === 'done') {
      if (!addToPlate('patty')) return false;
      slot.state = 'empty';
      slot.t = 0;
      return true;
    }
    if (slot.state === 'burnt') {
      slot.state = 'empty';
      slot.t = 0;
      return true;
    }
    return false;
  }

  /** Take the first cooked patty off any grill slot (the G key). */
  function takeAnyGrill() {
    for (let i = 0; i < state.grill.length; i += 1) {
      if (state.grill[i].state === 'done') return takeGrill(i);
    }
    for (let i = 0; i < state.grill.length; i += 1) {
      if (state.grill[i].state === 'burnt') return takeGrill(i);
    }
    return false;
  }

  function trashPlate() {
    const plate = activePlate();
    if (plate.items.length === 0) return false;
    plate.items = [];
    return true;
  }

  function switchPlate(index) {
    if (index < 0 || index >= state.plates.length) return false;
    state.activePlate = index;
    return true;
  }

  function serve() {
    const plate = activePlate();
    if (plate.items.length === 0) return EVENT_NONE;
    const order = matchingOrder(plate.items);
    if (!order) return EVENT_WRONG;
    state.orders = state.orders.filter((o) => o.id !== order.id);
    const timeBonus = Math.round((50 * order.timeLeft) / order.patience);
    const comboBonus = state.combo * 10;
    const earned = order.recipe.price + Math.floor(state.combo / 2);
    state.coins += earned;
    state.score += order.recipe.price * 10 + timeBonus + comboBonus;
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.served += 1;
    state.lastServed = { name: order.recipe.name, coins: earned, combo: state.combo };
    plate.items = [];
    return EVENT_SERVED;
  }

  function step(dt) {
    if (state.over) return EVENT_NONE;
    let events = EVENT_NONE;
    state.time += dt;

    for (const slot of state.grill) {
      if (slot.state === 'cooking') {
        slot.t += dt;
        if (slot.t >= COOK_TIME) {
          slot.state = 'done';
          slot.t = 0;
          events |= EVENT_PATTY_DONE;
        }
      } else if (slot.state === 'done') {
        slot.t += dt;
        if (slot.t >= BURN_TIME) {
          slot.state = 'burnt';
          slot.t = 0;
          events |= EVENT_PATTY_BURNT;
        }
      }
    }

    for (const order of state.orders) order.timeLeft -= dt;
    const expired = state.orders.filter((order) => order.timeLeft <= 0);
    if (expired.length > 0) {
      state.orders = state.orders.filter((order) => order.timeLeft > 0);
      state.missed += expired.length;
      state.strikes += expired.length;
      state.combo = 0;
      events |= EVENT_EXPIRED;
    }

    state.nextOrderIn -= dt;
    if (state.nextOrderIn <= 0) {
      spawnOrder();
      state.nextOrderIn = spawnInterval() * random.range(0.85, 1.15);
    }

    if (state.time >= SHIFT_LENGTH || state.strikes >= STRIKES_MAX) {
      state.over = true;
      events |= EVENT_OVER;
    }
    return events;
  }

  return {
    state,
    reset,
    step,
    addBin,
    addToPlate,
    startGrill,
    takeGrill,
    takeAnyGrill,
    trashPlate,
    switchPlate,
    serve,
    plateCouldServe,
    plateFitsOrder,
    matchingOrder,
  };
}

export function createWorldWithSeed(seed) {
  return createWorld(createRandom(seed));
}
