// Display eligibility is separate from the sporting estimate used by the engine.
export const singlesRank=p=>Number.isInteger(p.sr)&&p.sr>0&&p.sg>0?'#'+p.sr:'Not ranked';
export function compareSingles(a,b){
  const rank=p=>singlesRank(p)==='Not ranked'?Infinity:p.sr;
  return (rank(a)-rank(b))||a.n.localeCompare(b.n);
}
const count=(n,label,plural=label+'s')=>`${n.toLocaleString('en-US')} ${n===1?label:plural}`;
export function singlesEvidence(p){
  const recent=p.sg||0,total=p.sc||0;
  const date=p.sl?new Date(p.sl+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}):null;
  const record=recent?`${count(recent,'recorded 2026 singles game')}. Singles rank is within gender, among players with a recorded 2026 singles game.`:`No recorded 2026 singles games, so no singles rank is shown. ${total?`${count(total,'historical singles game')}; last recorded ${date}.`:'No recorded singles games in this snapshot.'}`;
  const db=p.db?`DreamBreaker evidence is separate: ${count(p.db,'recorded rally','recorded rallies')}, including ${p.db26||0} in 2026.`:'No recorded DreamBreaker rallies in this snapshot.';
  return `${record} ${db} The match model still uses a projected singles ability; not ranked does not mean no singles ability. Records are through October 7, 2026.`;
}
