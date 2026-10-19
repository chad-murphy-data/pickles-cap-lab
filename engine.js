// Frozen V3 sporting model. Prices and uncertainty do not enter these functions.
const GAMMA = -0.1829;
const DB_K = 0.42;
const dbCache = new Map();
const sigmoid = x => 1 / (1 + Math.exp(-x));

function race(p, target) {
  const q = 1 - p;
  let term = Math.pow(p, target), win = term;
  for (let b = 1; b < target - 1; b++) {
    term *= q * (target - 1 + b) / b;
    win += term;
  }
  let c = 1;
  for (let i = 1; i < target; i++) c *= (target - 1 + i) / i;
  return win + c * Math.pow(p * q, target - 1) * p * p / (p * p + q * q);
}

function rotation(a, b) {
  const gaps = a.map((s, i) => s - b[i]);
  const key = gaps.join(',');
  if (dbCache.has(key)) return dbCache.get(key);
  const points = gaps.map(gap => sigmoid(DB_K * gap));
  const dp = new Float64Array(21);
  dp[0] = 1;
  let early = 0;
  for (let n = 0; n < 40; n++) {
    const p = points[Math.floor((n % 16) / 4)];
    if (n >= 20) early += dp[20] * p;
    for (let a = Math.min(20, n + 1); a >= 0; a--) {
      dp[a] = (a ? dp[a - 1] * p : 0) + dp[a] * (1 - p);
    }
  }
  // Exact infinite win-by-two tail: eight two-point phases repeat every16 rallies.
  let numerator = 0, survival = 1;
  for (let i = 0; i < 8; i++) {
    const phase = (40 + 2 * i) % 16;
    const p = points[Math.floor(phase / 4)];
    const q = points[Math.floor(((phase + 1) % 16) / 4)];
    numerator += survival * p * q;
    survival *= p * (1 - q) + (1 - p) * q;
  }
  const answer = early + dp[20] * numerator / (1 - survival);
  if (dbCache.size >= 50000) dbCache.clear();
  dbCache.set(key, answer);
  return answer;
}

const strength = (a, b) => a.d + b.d + GAMMA * Math.abs(a.d - b.d);
const byDoubles = (a, b) => b.d - a.d || a.i - b.i;
// Native three-element singles sorting preserves the previous doubles tie order.
const bySingles = (a, b) => b.s - a.s || byDoubles(a, b);

export function features(players) {
  if (!Array.isArray(players) || players.length !== 6 ||
      players.some(p => !p || !Number.isInteger(p.i) || p.i < 0 ||
        !['M', 'F'].includes(p.g) || !Number.isFinite(p.d) || !Number.isFinite(p.s)) ||
      new Set(players.map(p => p.i)).size !== 6) {
    throw new TypeError('A roster must contain six distinct players with valid ratings.');
  }
  const men = players.filter(p => p.g === 'M').sort(byDoubles);
  const women = players.filter(p => p.g === 'F').sort(byDoubles);
  if (men.length !== 3 || women.length !== 3) throw new TypeError('A roster needs three men and three women.');
  const pairs = [[women[0], women[1]], [men[0], men[1]], [women[0], men[0]], [women[1], men[1]]];
  const crossed = [[women[0], men[1]], [women[1], men[0]]];
  if (strength(...crossed[0]) + strength(...crossed[1]) >
      strength(...pairs[2]) + strength(...pairs[3]) + 1e-12) {
    [pairs[2], pairs[3]] = crossed;
  }
  if (strength(...pairs[3]) > strength(...pairs[2])) [pairs[2], pairs[3]] = [pairs[3], pairs[2]];
  const dbPlayers = [...men.slice().sort(bySingles).slice(0, 2), ...women.slice().sort(bySingles).slice(0, 2)];
  return {strength: pairs.map(pair => strength(...pair)), singles: dbPlayers.map(p => p.s), pairs, dbPlayers};
}

function assertFeature(f) {
  if (!f || !Array.isArray(f.strength) || !Array.isArray(f.singles) ||
      f.strength.length !== 4 || f.singles.length !== 4 ||
      !f.strength.every(Number.isFinite) || !f.singles.every(Number.isFinite)) {
    throw new TypeError('A team feature needs four finite doubles strengths and four singles ratings.');
  }
}

export function matchup(a, b) {
  assertFeature(a); assertFeature(b);
  const db = rotation(a.singles, b.singles);
  const games = [0, 0, 0, 0];
  let win = 0, regular = 0, tie = 0;
  for (let order = 0; order < 2; order++) {
    const dist = [1, 0, 0, 0, 0];
    for (let g = 0; g < 4; g++) {
      const h = order && g >= 2 ? 5 - g : g;
      const p = race(sigmoid(a.strength[g] - b.strength[h]), 11);
      games[g] += p / 2;
      for (let j = g + 1; j >= 0; j--) dist[j] = (j ? dist[j - 1] * p : 0) + dist[j] * (1 - p);
    }
    regular += (dist[3] + dist[4]) / 2;
    tie += dist[2] / 2;
    win += (dist[3] + dist[4] + dist[2] * db) / 2;
  }
  return {win, regular, tie, db, games, dbContribution: tie * db, dbEdge: tie * (db - 0.5)};
}

export function evaluate(players, refs) {
  if (!Array.isArray(refs) || refs.length === 0) throw new TypeError('At least one reference opponent is required.');
  const feature = features(players);
  const result = {win: 0, regular: 0, tie: 0, db: 0, games: [0, 0, 0, 0], dbContribution: 0, dbEdge: 0, feature};
  for (const ref of refs) {
    const one = matchup(feature, ref);
    for (const key of ['win', 'regular', 'tie', 'db', 'dbContribution', 'dbEdge']) result[key] += one[key] / refs.length;
    for (let i = 0; i < 4; i++) result.games[i] += one.games[i] / refs.length;
  }
  return result;
}
