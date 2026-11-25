// The screenshot scenes behind ?shot=start|play|rush|end. Each one plays the real
// rules forward from a fresh world for a fixed number of steps, steered by a
// simple autopilot that does what a player does (grill the patty, stack the
// ingredients, ring the bell), so every frame is what a real game looks like
// and the same seed always gives the same frame.
import { STEP } from './config.js';
import { EVENT_OVER } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 3;
const PLAY_SECONDS = 26;
const RUSH_SECONDS = 70;
const END_LIMIT_SECONDS = 200;

function isSubset(items, recipeItems) {
  const remaining = [...recipeItems];
  for (const item of items) {
    const index = remaining.indexOf(item);
    if (index === -1) return false;
    remaining.splice(index, 1);
  }
  return true;
}

/** The order the active plate is already being built for, else the most urgent. */
function chooseTarget(world) {
  const state = world.state;
  const plate = state.plates[state.activePlate];
  let candidates = state.orders.filter((order) => isSubset(plate.items, order.recipe.items));
  if (candidates.length === 0) candidates = state.orders;
  if (candidates.length === 0) return null;
  let best = candidates[0];
  for (const order of candidates) {
    if (order.timeLeft < best.timeLeft) best = order;
  }
  return best;
}

/** One greedy move: serve when ready, grill before adding, never stack wrong food. */
function autopilot(world, opts = {}) {
  const canServe = opts.serve !== false;
  const state = world.state;
  if (state.over) return;
  const plate = state.plates[state.activePlate];
  if (world.plateCouldServe(plate.items)) {
    if (canServe) world.serve();
    return;
  }
  if (plate.items.length > 0 && !world.plateFitsOrder(plate.items)) {
    const other = state.plates[1 - state.activePlate];
    if (other.items.length === 0) {
      world.switchPlate(1 - state.activePlate);
      return;
    }
    world.trashPlate();
    return;
  }
  const target = chooseTarget(world);
  if (!target) return;
  const missing = [...target.recipe.items];
  for (const item of plate.items) {
    const index = missing.indexOf(item);
    if (index !== -1) missing.splice(index, 1);
  }
  if (missing.length === 0) {
    if (canServe) world.serve();
    return;
  }
  const next = missing[0];
  if (next === 'patty') {    const doneIndex = state.grill.findIndex((slot) => slot.state === 'done');
    if (doneIndex !== -1) {
      world.takeGrill(doneIndex);
      return;
    }
    const cooking = state.grill.some((slot) => slot.state === 'cooking');
    const empty = state.grill.some((slot) => slot.state === 'empty');
    if (empty && !cooking) {
      world.startGrill();
      return;
    }
    const otherMissing = missing.find((item) => item !== 'patty');
    if (otherMissing) {
      world.addToPlate(otherMissing);
      return;
    }
    return;
  }
  world.addToPlate(next);
}

function runFor(world, seconds, actEvery, opts = {}) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    // A real player acts a few times a second, not every frame: throttling the
    // autopilot's decisions the same way keeps the staged scenes honest and
    // human-paced (the rush scene then actually has orders waiting).
    if (i % actEvery === 0) autopilot(world, opts);
    const events = world.step(STEP);
    if (events & EVENT_OVER) break;
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it and
 * the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'rush' && name !== 'end') {
    for (let i = 0; i < Math.round(START_SECONDS / STEP); i += 1) world.step(STEP);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'play') {
    // Stop the moment a plate is complete and ready to serve (the autopilot
    // holds the serve, so the frame shows the finished dish and the green bell).
    const limit = Math.round(60 / STEP);
    for (let i = 0; i < limit; i += 1) {
      if (i % 6 === 0) autopilot(world, { serve: false });
      world.step(STEP);
      if (world.plateCouldServe(world.state.plates[world.state.activePlate].items)) break;
      if (world.state.over) break;
    }
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'rush') {
    runFor(world, RUSH_SECONDS, 20);
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  runFor(world, END_LIMIT_SECONDS, 6);
  return { screen: SCREEN_OVER, best: world.state.score };
}
