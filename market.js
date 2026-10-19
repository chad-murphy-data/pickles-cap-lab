// Lists and computer owners share this doubles-ranked eligibility cutoff.
export const draftPool = players => players.filter(p => p.dr <= 100);
export function affordableCeiling(players) {
  const picksRemaining = 6 - players.length;
  if (picksRemaining <= 0) return 0;
  const spend = players.reduce((sum, p) => sum + p.p, 0);
  return Math.max(0, 1000000 - spend - 45000 * (picksRemaining - 1));
}
