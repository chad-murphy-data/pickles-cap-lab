// The tour teaches controls without making picks or changing roster/search settings.
export const TOUR_KEY='cap-desk-tour-v3';
export const tourSteps={
  lobby:[
    {title:'Let’s build your team',copy:'Draft an MLP-style team and see how it compares with 19 computer teams. You’ll choose three women and three men, spending between $500,000 and $1 million.',note:'This quick tutorial shows you around. You won’t make any picks during it, and you can skip it whenever you like.',next:'Show me around →'},
    {target:'seat',settings:true,title:'Choose when to pick',copy:'You can pick first or take a random position. Teams keep the same order for all six rounds.',note:'There’s no timer on your turn, and no bonus for saving money. Take your time.'},
    {target:'start',settings:true,title:'Start when you’re ready',copy:'Choose Start draft to open the player list. We’ll show you the other controls there.',note:'Your draft saves on this device. Questions about the rules, player prices or scores? The FAQ explains them.',faq:true,next:'Got it'}
  ],
  room:[
    {target:'search',view:'pick',title:'Find a player',copy:'Search by name, surname or initials. “ALW” works for Anna Leigh Waters. Choose Women or Men to narrow the list.',note:'Select a name for details. A player only joins your team when you choose Draft.'},
    {target:'sort',view:'pick',title:'Compare player rankings',copy:'Choose Singles rank under Sort by to put the top singles players first. You can also sort by doubles rank, price or name.',note:'Singles ranks are within gender and require a recorded 2026 singles game. Other players show Not ranked; they still have a projected DreamBreaker ability.'},
    {target:'desk-remaining',view:'pick',title:'Leave room for everyone',copy:'Your team panel shows your budget and open spots. The list keeps at least $45,000 aside for each player you still need.',note:'Your finished team needs three women, three men and a total price between $500,000 and $1 million.'},
    {target:'players',view:'pick',title:'Add someone to your team',copy:'Choose Draft beside the player you’d like. Other teams will then take their turns before your next pick.',note:'After your pick, the draft board comes into view. When it’s your turn again, you return to the player list. You can browse while the other teams pick.'},
    {target:'grid-title',view:'room',title:'Follow the other teams',copy:'The draft board fills in as each team picks. Recent picks are listed beneath it. Select a team to see its roster, or search for a player to find out who picked them.',note:'Team rankings show strength so far. They’re hidden during round six, with the final results revealed once everyone has picked.'},
    {target:'pace',settings:true,view:'pick',title:'Go at your own pace',copy:'Watch picks every half-second, every second, or choose Instant. Pause gives you time to look around. Undo last turn lets you revisit your previous choice.',note:'Picks are paused while the tutorial is open. Your speed and pause settings stay as you left them.'},
    {target:'tour-help',title:'You’re ready to pick',copy:'Start with a player you like and build from there. When the draft finishes, you can see your results, try different combinations or draft again.',note:'The FAQ covers the rules, player prices and scores. Choose Tutorial at the top whenever you’d like another look.',faq:true,next:'Back to the draft'}
  ],
  finished:[
    {target:'reveal-final',title:'See how your team did',copy:'Choose See the results to compare your team with the other 19. The model estimates how each team would do against the rest of this league.',note:'If you’ve already opened the results, your lineup and result card are below.'},
    {target:'tour-help',title:'Try another team',copy:'Draft again takes you back to the start. Try different combinations opens your roster in the team builder, where you can swap players freely.',note:'Your draft stays as it is while these tips are open. The FAQ explains how the prices and scores work.',faq:true,next:'Got it'}
  ]
};
export function tourStage(state){return !state?'lobby':state.turn>=120?'finished':'room'}
export function initTour(){
  const $=id=>document.getElementById(id),dialog=$('draft-tour');
  let last=null,active=false,stage='',index=0,target=null,returnFocus=null,previousView=null,previousSettings=false,frame=0,positionFrame=0;
  const read=()=>{try{return localStorage.getItem(TOUR_KEY)}catch{return null}};
  let seen=read();
  const write=value=>{seen=value;try{localStorage.setItem(TOUR_KEY,value)}catch{}};
  const hold=value=>document.dispatchEvent(new CustomEvent('cap-tour-hold',{detail:value}));
  function clearTarget(){target?.classList.remove('tour-target');target=null}
  function position(){
    if(!active)return;
    const gap=14,edge=12,w=innerWidth,h=innerHeight,box=dialog.getBoundingClientRect(),r=target?.getBoundingClientRect();
    let left=(w-box.width)/2,top=(h-box.height)/2;
    if(r){
      left=r.left+r.width/2-box.width/2;
      if(r.bottom+gap+box.height<=h-edge)top=r.bottom+gap;
      else if(r.top-gap-box.height>=edge)top=r.top-gap-box.height;
      else if(r.left-gap-box.width>=edge){left=r.left-gap-box.width;top=r.top}
      else if(r.right+gap+box.width<=w-edge){left=r.right+gap;top=r.top}
      else top=r.top>h/2?edge:h-box.height-edge;
    }
    dialog.style.left=Math.max(edge,Math.min(left,w-box.width-edge))+'px';
    dialog.style.top=Math.max(edge,Math.min(top,h-box.height-edge))+'px';
  }
  function show(){
    cancelAnimationFrame(positionFrame);clearTarget();const step=tourSteps[stage][index];
    if(step.settings)$('draft-settings').open=true;
    if(step.view)$(step.view==='room'?'view-room':'view-pick').click();
    const targetId=stage==='finished'&&step.target==='reveal-final'&&$('results').classList.contains('revealed')?'desk-finish':step.target;
    target=targetId==='players'?(document.querySelector('#players [data-pick]')||$('players')):targetId?$(targetId):null;
    $('tour-progress').textContent=`${stage==='lobby'?'Getting started':stage==='finished'?'Your results':'How to draft'} · ${index+1} of ${tourSteps[stage].length}`;
    $('tour-title').textContent=step.title;$('tour-copy').textContent=step.copy;$('tour-footnote').textContent=step.note;
    $('tour-faq').hidden=!step.faq;
    $('tour-back').disabled=index===0;$('tour-next').textContent=step.next||'Next →';
    if(target){target.classList.add('tour-target');target.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'})}
    positionFrame=requestAnimationFrame(position);$('tour-next').focus({preventScroll:true});
  }
  function begin(nextStage){
    cancelAnimationFrame(frame);if(active)return;active=true;stage=nextStage;index=0;
    returnFocus=document.activeElement;previousSettings=$('draft-settings').open;previousView=$('view-room').getAttribute('aria-pressed')==='true'?'room':'pick';
    hold(true);dialog.showModal();show();
  }
  function end(skipped=false){
    if(!active)return;const enterRoom=!skipped&&stage==='lobby';active=false;
    cancelAnimationFrame(positionFrame);clearTarget();dialog.close();
    write(enterRoom?'room':'done');
    if(last?.state&&!last.complete)$(previousView==='room'?'view-room':'view-pick').click();
    $('draft-settings').open=previousSettings;hold(false);
    const focus=enterRoom?$('start'):returnFocus;
    if(focus?.isConnected)focus.focus({preventScroll:!enterRoom});
  }
  const replay=()=>{if(last)begin(tourStage(last.state))};
  $('tour-help').onclick=replay;$('tour-welcome').onclick=replay;
  $('tour-skip').onclick=()=>end(true);
  $('tour-back').onclick=()=>{if(index>0){index--;show()}};
  $('tour-next').onclick=()=>{if(index<tourSteps[stage].length-1){index++;show()}else end()};
  dialog.addEventListener('cancel',e=>{e.preventDefault();end(true)});
  dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();$('tour-next').click()}else if(e.key==='ArrowLeft'){e.preventDefault();$('tour-back').click()}});
  addEventListener('resize',position);addEventListener('scroll',position,true);
  document.addEventListener('cap-draft-render',({detail:r})=>{
    last=r;if(active)return;if(seen==='done'||seen==='room'&&!r.state)return;
    cancelAnimationFrame(frame);
    // After render, the controller has also made the correct pane visible.
    hold(true);frame=requestAnimationFrame(()=>{if(!active)begin(tourStage(last.state))});
  });
}
