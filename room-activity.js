// Derived solely from revealed picks. No future computer choices enter this view.
export function activityWindow(state){
  if(!state)return {picks:[],remaining:0,ownTurn:false};
  const owner=state.seat-1,done=state.turn>=120;
  let lastOwn=-1;for(let i=state.picks.length-1;i>=0;i--)if(state.picks[i].team===owner){lastOwn=i;break}
  const picks=state.picks.slice(lastOwn+1).filter(p=>p.team!==owner);
  const ownTurn=!done&&state.turn%20===owner;
  return {picks,ownTurn,remaining:done?0:state.teams[owner].length===6?120-state.turn:(owner-state.turn%20+20)%20};
}
export function draftedBy(state,id){return state?.teams.findIndex(ids=>ids.includes(id))??-1}
