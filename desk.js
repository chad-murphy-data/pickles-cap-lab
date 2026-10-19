import {singlesRank,singlesEvidence} from './singles-evidence.js?v=plain-copy-20261019';
import {rankingsSealed} from './desk-state.js';
import {features,matchup} from './engine.js';
import {resultPng,resultText} from './desk-result.js?v=plain-copy-20261019';
import {initTour} from './desk-tour.js?v=plain-copy-20261019';
import {activityWindow} from './room-activity.js';
const $=id=>document.getElementById(id),money=n=>'$'+n.toLocaleString('en-US'),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let finalKey='',roomContext=null,allActivity=false,inspectedFocus=null;
$('rank-toggle').onclick=()=>{const open=$('draft-main').classList.toggle('rankings-open');if(open)$('view-room').click();$('rank-toggle').setAttribute('aria-expanded',String(open));$('rank-toggle').textContent=open?'Back to draft board':'Team rankings'};
$('reveal-final').onclick=()=>{$('draft-main').classList.add('result-revealed');$('results').classList.add('revealed');$('desk-finish').scrollIntoView({block:'start',behavior:'instant'})};
document.addEventListener('cap-draft-render',({detail:r})=>{
  roomContext=r;renderActivity(r);
  const sealed=rankingsSealed(r.state);
  $('draft-main').classList.toggle('rankings-sealed',sealed);
  $('draft-main').classList.toggle('hq-finished',r.complete);
  $('rank-seal').hidden=!sealed;
  $('rank-toggle').disabled=sealed;
  $('rank-toggle').textContent=sealed?'Rankings hidden for round 6':$('draft-main').classList.contains('rankings-open')?'Back to draft board':'Team rankings';
  if(sealed){$('draft-main').classList.remove('rankings-open');$('rank-toggle').setAttribute('aria-expanded','false')}
  $('desk-remaining').textContent=money(1000000-r.cost);
  const spots=6-r.ids.length;
  $('desk-coach').textContent=!r.state?'Start when you’re ready. Your first player can be anyone who fits.':r.complete?'Your team is complete. See how it did.':!r.ids.length?'Choose your first player. There’s no timer on your turn.':r.cost===775000&&r.ids.length===1?'You have $225,000 left for five players: $45,000 each.':r.cost<500000?`Spend at least ${money(500000-r.cost)} more to reach the $500,000 minimum. There’s no bonus for saving money.`:`${money(1000000-r.cost)} left for ${spots} more ${spots===1?'player':'players'}. You can look at player details before choosing.`;
  if(!r.complete){$('draft-main').classList.remove('result-revealed');finalKey='';$('results').classList.remove('revealed');return}
  const key=r.state.seat+':'+r.state.teams.map(ids=>ids.join(',')).join(';');if(key===finalKey)return;finalKey=key;$('draft-main').classList.remove('result-revealed');$('results').classList.remove('revealed');
  const players=r.ids.map(i=>r.data.players[i]),f=features(players),your=r.ownRank;
  const model={players,cost:r.cost,rank:your.rank,win:your.win,seat:r.state.seat,playUrl:new URL('draft.html',location.href).href};
  $('desk-finish').innerHTML=`<article class="finish-sheet"><div class="finish-top"><div><p class="eyebrow">Draft complete · Your position: ${r.state.seat}</p><h2>Your team ranked ${your.rank} out of 20.</h2></div><div class="finish-stats"><div class="finish-stat"><strong>#${your.rank}<small> /20</small></strong><span>Final rank</span></div><div class="finish-stat"><strong>${(your.win*100).toFixed(1)}%</strong><span>Expected win rate</span></div></div></div><div class="finish-columns"><section><h3>${money(r.cost)} spent · Your team</h3><ol class="finish-roster">${players.map(p=>`<li><span>${esc(p.n)}</span><span class="cost">${money(p.p)}</span></li>`).join('')}</ol></section><section><h3>Suggested lineup</h3>${['Women','Men','Mixed 1','Mixed 2'].map((label,i)=>`<div class="lineup"><span>${label}</span><span>${f.pairs[i].map(p=>esc(p.n)).join(' + ')}</span></div>`).join('')}<p class="finish-db"><b>DreamBreaker order</b><br>${f.dbPlayers.map(p=>esc(p.n)).join(' → ')}</p></section></div><div class="finish-actions"><button id="play-again">Draft again</button><a class="primary-link" href="build.html#v=3&p=${r.ids.join(',')}">Try different combinations →</a><button id="save-card">Download result card</button><button id="copy-result">Copy result</button><button id="copy-team">Copy team link</button></div><p class="finish-note">${(your.win*19).toFixed(1)} expected wins in a 19-match round robin against these drafted teams. These are model estimates, not championship chances.</p><p id="share-status" role="status" aria-live="polite"></p></article>`;
  $('play-again').onclick=()=>$('start').click();
  $('save-card').onclick=async()=>{const button=$('save-card');button.disabled=true;$('share-status').textContent='Preparing your result card…';try{const blob=await resultPng(model),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='pickles-draft-result.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('share-status').textContent='Result card downloaded.'}catch{$('share-status').textContent='We couldn’t make the image. Please try again, or use Copy result.'}finally{button.disabled=false}};
  const copy=async(text,done)=>{try{await navigator.clipboard.writeText(text);$('share-status').textContent=done}catch{$('share-status').textContent=text}};
  $('copy-result').onclick=()=>copy(resultText(model),'Result copied.');
  $('copy-team').onclick=()=>copy(new URL('build.html',location.href).href+'#v=3&p='+r.ids.join(','),'Team link copied. Anyone with the link can open this roster.');
});
function renderActivity(r){
  const w=activityWindow(r.state),list=allActivity?w.picks:w.picks.slice(-4);
  $('until-your-pick').textContent=!r.state?'':r.complete?'The draft is complete':w.ownTurn?'Your turn':r.ids.length===6?`${w.remaining} final ${w.remaining===1?'pick':'picks'} to go`:`${w.remaining} ${w.remaining===1?'pick':'picks'} until yours`;
  $('activity-context').textContent=!r.state?'':!w.picks.length?'Other teams’ picks will appear here. Feel free to browse players while you wait.':w.ownTurn?`${w.picks.length} ${w.picks.length===1?'player was':'players were'} taken since your last turn. You can select a team below to see who it picked.`:`${w.picks.length} ${w.picks.length===1?'player picked':'players picked'} by other teams since your turn.`;
  $('recent-picks').classList.toggle('expanded',allActivity);$('recent-picks').innerHTML=[...list].reverse().map(p=>{const player=r.data.players[p.id];return `<li><span class="activity-pick">#${p.pick}</span><div><button class="player-link" data-scout="${player.i}">${esc(player.n)}</button><span class="activity-meta">${player.g==='F'?'Women':'Men'} · ${money(player.p)}</span></div><button class="team-link" data-rival="${p.team}">Team ${p.team+1} →</button></li>`}).join('');
  $('activity-toggle').hidden=w.picks.length<=4;
  $('activity-toggle').textContent=allActivity?'Show the latest four':`See all ${w.picks.length} recent picks`;
  $('activity-toggle').setAttribute('aria-expanded',String(allActivity));
}
$('activity-toggle').onclick=()=>{allActivity=!allActivity;if(roomContext)renderActivity(roomContext)};
function inspect(title,html){
  inspectedFocus=document.activeElement;
  document.dispatchEvent(new CustomEvent('cap-room-hold',{detail:true}));
  $('inspect-title').textContent=title;$('inspect-content').innerHTML=html;$('room-inspector').showModal();
}
function closeInspector(){
  $('room-inspector').close();document.dispatchEvent(new CustomEvent('cap-room-hold',{detail:false}));
  if(inspectedFocus?.isConnected)inspectedFocus.focus({preventScroll:true});
}
$('inspect-close').onclick=closeInspector;
$('room-inspector').addEventListener('cancel',e=>{e.preventDefault();closeInspector()});
function inspectTeam(t){
  const r=roomContext;if(!r?.state||!Number.isInteger(t)||t<0||t>19)return;
  const ids=r.state.teams[t],ps=ids.map(i=>r.data.players[i]),cost=ps.reduce((sum,p)=>sum+p.p,0),own=t===r.state.seat-1;
  const names=pair=>pair.map(p=>esc(p.n)).join(' + '),f=ps.length===6?features(ps):null;
  inspect(own?'Your team':`Team ${t+1}`,`<p class="inspect-budget"><b>${money(cost)} spent</b> · ${money(1000000-cost)} remaining · ${ids.length}/6 players</p><div class="inspect-roster">${['F','M'].map(g=>{const members=ps.filter(p=>p.g===g);return `<section><h3>${g==='F'?'Women':'Men'} · ${members.length}/3</h3><ul>${members.map(p=>`<li><span>${esc(p.n)}</span><b>${money(p.p)}</b></li>`).join('')}${Array.from({length:3-members.length},()=>'<li class="note">Open roster spot</li>').join('')}</ul></section>`}).join('')}</div>${f?`<details><summary>Suggested lineup</summary>${['Women','Men','Mixed 1','Mixed 2'].map((label,i)=>`<div class="lineup"><span>${label}</span><span>${names(f.pairs[i])}</span></div>`).join('')}<p>DreamBreaker order: ${f.dbPlayers.map(p=>esc(p.n)).join(' → ')}</p></details>`:''}${!own&&f&&r.complete&&$('results').classList.contains('revealed')?`<p class="inspect-matchup">Your team’s estimated chance of winning this matchup: <b>${(matchup(features(r.ids.map(i=>r.data.players[i])),f).win*100).toFixed(1)}%</b></p>`:''}`);
}
function inspectPlayer(id){
  const r=roomContext,p=r?.data.players[id];if(!p)return;const owner=r.state?.teams.findIndex(ids=>ids.includes(id))??-1,pick=r.state?.picks.find(q=>q.id===id);
  inspect(p.n,`<p class="eyebrow">${p.g==='F'?'WOMEN':'MEN'} · DOUBLES #${p.dr} · SINGLES ${singlesRank(p)}</p><h3>${money(p.p)}</h3>${owner>=0?`<p class="taken-label">${owner===r.state.seat-1?'On your roster':`Drafted by Team ${owner+1}`} · Round ${pick.round}, pick ${pick.pick}</p>`:'<p>This player hasn’t been picked. Your budget and remaining roster spots determine whether you can add them.</p>'}<div class="lineup"><span>Roster spot baseline</span><span>${money(p.base)}</span></div><div class="lineup"><span>Performance value</span><span>${money(p.premium)}</span></div><div class="lineup"><span>Singles adjustment</span><span>${p.singlesAdj<0?'−':'+'}${money(Math.abs(p.singlesAdj))}</span></div><p class="note">${singlesEvidence(p)}</p><p class="note">Performance value includes the singles ability expected at this doubles rating. The singles adjustment accounts for being above or below that expectation. Confidence is shown separately. Ratings and prices are from October 7, 2026.</p>`);
}
document.addEventListener('click',e=>{
  const team=e.target.closest('[data-rival]'),player=e.target.closest('[data-scout]');
  if(team)inspectTeam(+team.dataset.rival);else if(player)inspectPlayer(+player.dataset.scout);
});
initTour();
await import('./draft.js?v=plain-copy-20261019');
