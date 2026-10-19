// Builder-specific help. Opening or advancing it never edits a roster or filter.
export const BUILDER_TOUR_KEY='cap-builder-tour-v2';
export const builderSteps=[
 {title:'Build your dream team',copy:'Choose three women and three men, spending between $500,000 and $1 million. Then see your team’s score out of 100.',note:'No one else takes your players in this mode. Swap freely and try different combinations.',next:'Show me around →'},
 {target:'search',title:'Find a player',copy:'Search by name or initials. Use Women or Men to narrow the list, and Maximum price to look within a budget.',note:'The pool includes the top 100 doubles-rated players of each gender. Only players who fit your remaining roster and budget appear.'},
 {target:'sort',title:'Compare players',copy:'Sort by price, name, doubles rank or singles rank. Select a player’s name to read their price breakdown and rating evidence.',note:'Ranks are within gender. Singles ranks require a recorded 2026 singles game; other players show Not ranked.'},
 {target:'players',title:'Add someone to your team',copy:'Choose the + beside a player to add them. If your team is already full, remove someone first to try a different player.',note:'The list keeps at least $45,000 aside for every remaining spot. These tips won’t add or remove anyone.'},
 {target:'roster',title:'Keep track of your team',copy:'Your team panel shows your players, spending and open spots. Use × to remove a player, or Undo to go back one change.',note:'A finished team needs three women, three men and a total price between $500,000 and $1 million. There’s no bonus for saving money.'},
 {target:'assessment',title:'See how your team scores',copy:'Once your team fits the rules, its score appears here with suggested lineups. Swap players to see how the score changes.',note:'The 0–100 score compares modeled team strength with the weakest and strongest legal teams found in our search. It isn’t a win percentage.'},
 {target:'preset',title:'Try another combination',copy:'You can start with an example team, then make it your own. Copy team link shares a completed roster with someone who can access the site.',note:'Your team saves in this browser. Questions about the rules, player prices or scores? The FAQ explains them. Choose Tutorial at the top to revisit these tips.',faq:true,next:'Back to building'}
];
export function initBuilderTour(){
 const $=id=>document.getElementById(id),dialog=$('builder-tour');
 let active=false,index=0,target=null,returnFocus=null,frame=0,seen=null;
 try{seen=localStorage.getItem(BUILDER_TOUR_KEY)}catch{}
 const complete=()=>{seen='done';try{localStorage.setItem(BUILDER_TOUR_KEY,'done')}catch{}};
 function clearTarget(){target?.classList.remove('tour-target');target=null}
 function position(){
  if(!active)return;
  const edge=12,gap=14,w=innerWidth,h=innerHeight,box=dialog.getBoundingClientRect(),r=target?.getBoundingClientRect();
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
  cancelAnimationFrame(frame);clearTarget();const step=builderSteps[index];
  target=step.target==='players'?(document.querySelector('#players [data-add]')||$('market-title')):step.target?$(step.target):null;
  $('tour-progress').textContent=`Team builder · ${index+1} of ${builderSteps.length}`;
  $('tour-title').textContent=step.title;$('tour-copy').textContent=step.copy;$('tour-footnote').textContent=step.note;
  $('tour-faq').hidden=!step.faq;
  $('tour-back').disabled=index===0;$('tour-next').textContent=step.next||'Next →';
  if(target){target.classList.add('tour-target');target.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'})}
  frame=requestAnimationFrame(position);$('tour-next').focus({preventScroll:true});
 }
 function begin(){
  if(active)return;active=true;index=0;returnFocus=document.activeElement?.id?document.activeElement:$('search');
  dialog.showModal();show();
 }
 function end(){
  if(!active)return;active=false;cancelAnimationFrame(frame);clearTarget();dialog.close();complete();
  if(returnFocus?.isConnected)returnFocus.focus();
 }
 $('tour-help').onclick=begin;$('tour-skip').onclick=end;
 $('tour-back').onclick=()=>{if(index>0){index--;show()}};
 $('tour-next').onclick=()=>{if(index<builderSteps.length-1){index++;show()}else end()};
 dialog.addEventListener('cancel',e=>{e.preventDefault();end()});
 dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();$('tour-next').click()}else if(e.key==='ArrowLeft'){e.preventDefault();$('tour-back').click()}});
 window.addEventListener('resize',position);window.addEventListener('scroll',position,true);
 if(seen!=='done')frame=requestAnimationFrame(begin);
}
