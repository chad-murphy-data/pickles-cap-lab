import {evaluate} from './engine.js';

const CAP = 1000000, FLOOR = 500000, BASE = 45000, TICK = 5000;
let players = [], refs = [], byId = new Map(), priceOrder = [];
const cache = new WeakMap();

export function configure(newPlayers, newRefs) {
  if (!Array.isArray(newPlayers) || !Array.isArray(newRefs) || !newRefs.length) throw new TypeError('Draft data is missing.');
  newPlayers = newPlayers.filter(p => p.dr <= 100);
  if (new Set(newPlayers.map(p => p.i)).size !== newPlayers.length || newPlayers.some(p =>
    !Number.isInteger(p.p) || p.p % TICK || p.p < BASE || p.p > CAP - 5 * BASE)) throw new TypeError('Unsupported draft prices.');
  for (const g of ['M', 'F']) if (newPlayers.filter(p => p.g === g).length < 60) throw new TypeError('Not enough players to fill all teams.');
  if (newPlayers.filter(p => p.p >= FLOOR - 5 * BASE).length < 20) throw new TypeError('Not enough affordable first-round anchors.');
  players = newPlayers; refs = newRefs; byId = new Map(players.map(p => [p.i, p]));
  priceOrder = [...players].sort((a, b) => b.p - a.p || a.i - b.i);
}

export function createDraft(newPlayers, newRefs, seat = 1) {
  configure(newPlayers, newRefs);
  if (!Number.isInteger(seat) || seat < 1 || seat > 20) throw new RangeError('Choose a seat from1 to20.');
  const state = {version: 3, teams: Array.from({length: 20}, () => []), turn: 0, seat, picks: [], plans: Array.from({length: 20}, () => [])};
  state.completionTokens = constructCompletion(state, null);
  if (!state.completionTokens) throw new Error('Could not establish a legal complete draft for this pool.');
  return state;
}

export const finished = state => state.turn >= 120;
export function currentTeam(state) {
  if (finished(state)) return -1;
  return state.turn % 20;
}

function context(state) {
  let c = cache.get(state);
  if (c && c.turn === state.turn && c.players === players) return c;
  const owned = new Set(state.teams.flat());
  const available = players.filter(p => !owned.has(p.i));
  const counts = {M: new Map(), F: new Map()};
  for (const p of available) counts[p.g].set(p.p / TICK, (counts[p.g].get(p.p / TICK) || 0) + 1);
  c = {turn: state.turn, players, owned, available, counts, humanSafe: new Map(), legal: new Map(), globalProof: new Map()};
  cache.set(state, c); return c;
}

function cost(ids) { return ids.reduce((sum, id) => sum + byId.get(id).p, 0); }
function needs(ids) {
  const m = ids.filter(id => byId.get(id).g === 'M').length;
  return {M: 3 - m, F: 3 - (ids.length - m)};
}
function cheapest(counts, gender, number, exclude) {
  if (number < 0) return Infinity;
  let total = 0;
  for (const [price, count] of [...counts[gender]].sort((a, b) => a[0] - b[0])) {
    const take = Math.min(number, count - (exclude && exclude.g === gender && exclude.p / TICK === price ? 1 : 0));
    if (take > 0) { total += take * price; number -= take; }
    if (!number) return total;
  }
  return number ? Infinity : total;
}

// Exact bounded0/1 gender-and-price reachability. Repeated prices are counted
// only as often as there are remaining distinct athletes, up to the needed slots.
function completionExists(ids, counts, exclude = null) {
  const need = needs(ids), fixed = cost(ids) / TICK;
  if (need.M < 0 || need.F < 0 || fixed > CAP / TICK) return false;
  const low = Math.max(0, FLOOR / TICK - fixed), high = CAP / TICK - fixed;
  const minimum = cheapest(counts, 'M', need.M, exclude) + cheapest(counts, 'F', need.F, exclude);
  if (minimum > high) return false;
  if (minimum >= low) return true;
  const mask = (1n << BigInt(high + 1)) - 1n, reach = {};
  for (const g of ['M', 'F']) {
    const dp = Array(need[g] + 1).fill(0n); dp[0] = 1n;
    for (const [price, count] of counts[g]) {
      if (price > high) continue;
      const copies = Math.min(need[g], count - (exclude && exclude.g === g && exclude.p / TICK === price ? 1 : 0));
      for (let copy = 0; copy < copies; copy++) for (let k = need[g]; k >= 1; k--) dp[k] |= (dp[k - 1] << BigInt(price)) & mask;
    }
    reach[g] = dp[need[g]];
  }
  for (let m = 0; m <= high; m++) if ((reach.M >> BigInt(m)) & 1n) {
    const lo = Math.max(0, low - m), hi = high - m;
    const interval = ((1n << BigInt(hi - lo + 1)) - 1n) << BigInt(lo);
    if (reach.F & interval) return true;
  }
  return false;
}

function copyCounts(counts) { return {M: new Map(counts.M), F: new Map(counts.F)}; }
function consume(counts, token) {
  const price = token.p / TICK, left = counts[token.g].get(price) || 0;
  if (!left) return false;
  counts[token.g].set(price, left - 1); return true;
}

// Return a cheapest legal completion by price class, using actual remaining
// multiplicities. These tokens never identify or reserve a named athlete.
function floorTokens(need, fixed, counts) {
  const high = (CAP - fixed) / TICK, low = Math.max(0, (FLOOR - fixed) / TICK), reach = {};
  for (const g of ['M', 'F']) {
    const dp = Array.from({length: need[g] + 1}, () => Array(high + 1).fill(null)); dp[0][0] = [];
    for (const [price, count] of [...counts[g]].sort((a, b) => a[0] - b[0])) {
      for (let c = 0; c < Math.min(count, need[g]); c++) for (let k = need[g]; k >= 1; k--) {
        for (let sum = price; sum <= high; sum++) if (dp[k][sum] === null && dp[k - 1][sum - price] !== null) dp[k][sum] = [...dp[k - 1][sum - price], {g, p: price * TICK}];
      }
    }
    reach[g] = dp[need[g]];
  }
  for (let sum = low; sum <= high; sum++) for (let m = 0; m <= sum; m++) if (reach.M[m] !== null && reach.F[sum - m] !== null) return [...reach.M[m], ...reach.F[sum - m]];
  return null;
}

function validateProof(state, candidate, proof) {
  if (!Array.isArray(proof) || proof.length !== 20) return false;
  const counts = copyCounts(context(state).counts), owner = currentTeam(state);
  if (candidate && !consume(counts, candidate)) return false;
  for (let t = 0; t < 20; t++) {
    const ids = candidate && t === owner ? [...state.teams[t], candidate.i] : state.teams[t];
    const need = needs(ids); let spend = cost(ids);
    if (!Array.isArray(proof[t])) return false;
    for (const token of proof[t]) {if (!['M', 'F'].includes(token.g) || !consume(counts, token)) return false; need[token.g]--; spend += token.p;}
    if (need.M !== 0 || need.F !== 0 || spend < FLOOR || spend > CAP) return false;
  }
  return true;
}

function constructCompletion(state, candidate) {
  const owner = currentTeam(state), original = context(state).counts;
  // Following a slot from the current cost-only proof always permits progress.
  if (candidate && state.completionTokens) {
    const ix = state.completionTokens[owner].findIndex(p => p.g === candidate.g && p.p === candidate.p);
    if (ix >= 0) {
      const proof = state.completionTokens.map(a => a.map(p => ({...p}))); proof[owner].splice(ix, 1);
      if (validateProof(state, candidate, proof)) return proof;
    }
  }
  const remaining = copyCounts(original);
  if (candidate && !consume(remaining, candidate)) return null;
  const fixed = state.teams.map((ids, t) => cost(ids) + (candidate && t === owner ? candidate.p : 0));
  const need = state.teams.map((ids, t) => needs(candidate && t === owner ? [...ids, candidate.i] : ids));
  if (fixed.some(x => x > CAP) || need.some(n => n.M < 0 || n.F < 0)) return null;
  const initial = Array.from({length: 20}, () => []), human = state.seat - 1;
  // Complete the human's floor first. This is an allocation proof, not a pick.
  const humanTokens = floorTokens(need[human], fixed[human], remaining);
  if (!humanTokens) return null;
  for (const token of humanTokens) {if (!consume(remaining, token)) return null; initial[human].push(token); fixed[human] += token.p; need[human][token.g]--;}
  // Unstarted bots will need one floor-securing first-round purchase.
  for (let t = 0; t < 20; t++) if (t !== human && fixed[t] === 0) {
    let best = null;
    for (const g of ['M', 'F']) for (const [price, n] of remaining[g]) if (n && price * TICK >= FLOOR - 5 * BASE && (!best || price * TICK > best.p)) best = {g, p: price * TICK};
    if (!best) return null;
    consume(remaining, best); initial[t].push(best); fixed[t] += best.p; need[t][best.g]--;
  }
  // Only upper caps remain for bots. Cheapest necessary tokens dominate dearer
  // tokens; distribute their premiums to owners with matching slots/headroom.
  const tokens = [];
  for (const g of ['M', 'F']) {
    let total = need.reduce((n, x) => n + x[g], 0);
    for (const [price, count] of [...remaining[g]].sort((a, b) => a[0] - b[0])) {
      const n = Math.min(count, total); for (let j = 0; j < n; j++) tokens.push({g, p: price * TICK}); total -= n;
      if (!total) break;
    }
    if (total) return null;
  }
  tokens.sort((a, b) => b.p - a.p || a.g.localeCompare(b.g));
  for (const strategy of [0, 1, 2]) {
    const proof = initial.map(a => a.map(x => ({...x}))), slots = need.map(n => ({...n}));
    const credit = fixed.map((v, t) => CAP - v - BASE * (slots[t].M + slots[t].F)); let okay = true;
    for (const token of tokens) {
      const extra = token.p - BASE;
      const eligible = Array.from({length: 20}, (_, t) => t).filter(t => slots[t][token.g] > 0 && credit[t] >= extra);
      eligible.sort((a, b) => strategy === 0 ? credit[b] - credit[a] || a - b : strategy === 1 ? credit[b] / (slots[b].M + slots[b].F) - credit[a] / (slots[a].M + slots[a].F) || a - b : credit[a] - credit[b] || a - b);
      if (!eligible.length) {okay = false; break;}
      const t = eligible[0]; proof[t].push(token); slots[t][token.g]--; credit[t] -= extra;
    }
    if (okay && validateProof(state, candidate, proof)) return proof;
  }
  return null;
}

export function legalPick(state, id) {
  if (!players.length) return 'Draft data is not configured.';
  if (state.version !== 3) return 'This saved draft uses an older format. Start a new draft.';
  if (finished(state)) return 'The draft is finished.';
  const p = byId.get(id), c = context(state), team = currentTeam(state);
  if (!p) return 'Choose a player from the list.';
  if (c.owned.has(id)) return 'That player has already been drafted.';
  if (c.legal.has(id)) return c.legal.get(id);
  const selected = state.teams[team], next = [...selected, id], need = needs(next);
  let reason = '';
  if (need.M < 0 || need.F < 0) reason = `This team already has three ${p.g === 'M' ? 'men' : 'women'}.`;
  else if (!completionExists(next, c.counts, p)) reason = 'That pick leaves no roster meeting both the $500k minimum and $1M cap.';
  else if (team !== state.seat - 1) {
    const key = `${p.g}:${p.p}`;
    if (!c.humanSafe.has(key)) c.humanSafe.set(key, completionExists(state.teams[state.seat - 1], c.counts, p));
    if (!c.humanSafe.get(key)) reason = 'That pick would leave your team unable to complete a legal roster.';
    // This rule is enforced even on a manually supplied computer pick.
    if (!selected.length && p.p < FLOOR - 5 * BASE) reason = 'Computer teams must secure their minimum spend in round one.';
  }
  if (!reason) {
    const key = `${p.g}:${p.p}`;
    if (!c.globalProof.has(key)) c.globalProof.set(key, constructCompletion(state, p));
    if (!c.globalProof.get(key)) reason = 'Cannot verify that all teams could finish within budget after this pick. Try another player.';
  }
  c.legal.set(id, reason); return reason;
}

export function pick(state, id) {
  const reason = legalPick(state, id);
  if (reason) throw new Error(reason);
  const team = currentTeam(state);
  state.completionTokens = context(state).globalProof.get(`${byId.get(id).g}:${byId.get(id).p}`);
  state.teams[team].push(id);
  state.picks.push({team, id, round: Math.floor(state.turn / 20) + 1, pick: state.turn + 1});
  state.turn++;
  return state;
}

function score(ids, memo) {
  const key = [...ids].sort((a, b) => a - b).join(',');
  if (!memo.has(key)) memo.set(key, evaluate(ids.map(id => byId.get(id)), refs).win);
  return memo.get(key);
}

// Small deterministic completion search for interactive response times. It is
// deliberately distinct from the native research optimizer and has no lookahead.
function bestPlan(state) {
  const team = currentTeam(state), locked = state.teams[team], c = context(state), lockedSet = new Set(locked);
  const remaining = 6 - locked.length, allowance = CAP - cost(locked) - (remaining - 1) * BASE;
  const eligible = c.available.filter(p => p.p <= allowance && !legalPick(state, p.i));
  const pool = {M: [], F: []}, keep = new Set();
  for (const g of ['M', 'F']) {
    const ps = eligible.filter(p => p.g === g);
    for (const metric of [p => p.d, p => p.s]) for (const p of [...ps].sort((a, b) => metric(b) - metric(a) || a.i - b.i).slice(0, 14)) keep.add(p.i);
    for (const p of [...ps].sort((a, b) => a.p - b.p || b.d - a.d || a.i - b.i).slice(0, 4)) keep.add(p.i);
  }
  for (const p of eligible) if (keep.has(p.i)) pool[p.g].push(p.i);
  const memo = new Map(), seeds = [];
  for (const metric of [p => p.d, p => p.s]) {
    const a = [...locked], need = needs(a);
    for (const g of ['M', 'F']) {
      const cheap = eligible.filter(p => p.g === g).sort((x, y) => x.p - y.p || metric(y) - metric(x) || x.i - y.i);
      for (let j = 0; j < need[g]; j++) if (cheap[j]) a.push(cheap[j].i);
    }
    if (a.length === 6 && cost(a) >= FLOOR && cost(a) <= CAP) seeds.push(a);
  }
  if (!seeds.length) return null;
  let best = seeds[0], bestValue = score(best, memo);
  for (const seed of seeds) {
    let a = seed, value = score(a, memo);
    // Two coordinate-ascent passes, every shortlisted replacement at each slot.
    for (let pass = 0; pass < 2; pass++) {
      let changed = false;
      for (let slot = 0; slot < 6; slot++) if (!lockedSet.has(a[slot])) {
        let next = a, nextValue = value;
        for (const id of pool[byId.get(a[slot]).g]) {
          if (a.includes(id)) continue;
          const b = [...a]; b[slot] = id;
          if (cost(b) < FLOOR || cost(b) > CAP) continue;
          const val = score(b, memo);
          if (val > nextValue + 1e-12) {next = b; nextValue = val;}
        }
        if (next !== a) changed = true;
        a = next; value = nextValue;
      }
      if (!changed) break;
    }
    if (value > bestValue + 1e-12) {best = a; bestValue = value;}
  }
  return best;
}

export function choosePick(state) {
  if (finished(state)) return null;
  const team = currentTeam(state);
  if (!state.teams[team].length) {
    const p = priceOrder.find(p => !legalPick(state, p.i));
    if (!p) throw new Error('No legal first pick exists.');
    return p.i;
  }
  const plan = bestPlan(state);
  if (plan) {
    state.plans ||= Array.from({length: 20}, () => []);
    state.plans[team] = plan;
    const p = plan.map(id => byId.get(id)).filter(p => !legalPick(state, p.i)).sort((a, b) => b.p - a.p || b.d - a.d || b.s - a.s || a.i - b.i)[0];
    if (p) return p.i;
  }
  // Safe fallback (also useful when an automated test operates the human seat).
  const p = priceOrder.find(p => !legalPick(state, p.i));
  if (!p) throw new Error('No legal completion exists.');
  return p.i;
}
