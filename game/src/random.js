// A small seeded random generator (mulberry32) so a screenshot seed always
// deals the same orders and the same kitchen.
export function createRandom(seed) {
  let state = seed >>> 0;
  function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function range(min, max) {
    return min + next() * (max - min);
  }
  function pick(list) {
    return list[Math.floor(next() * list.length)];
  }
  /** Pick one entry from a weighted list of { weight } objects. */
  function weighted(list) {
    let total = 0;
    for (const item of list) total += item.weight;
    let roll = next() * total;
    for (const item of list) {
      roll -= item.weight;
      if (roll <= 0) return item;
    }
    return list[list.length - 1];
  }
  return { next, range, pick, weighted };
}
