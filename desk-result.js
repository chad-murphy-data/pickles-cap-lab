// Portable result artifacts; all displayed strength comes from the existing model.
const xml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const dollars=n=>'$'+n.toLocaleString('en-US');
export function resultText({players,cost,rank,win,seat,playUrl}){
  return `My PICKLES Cap Lab draft\nPosition ${seat} · #${rank} of 20\n${dollars(cost)} roster · ${(win*100).toFixed(1)}% estimated win rate\n\n${players.map(p=>`${p.n} — ${dollars(p.p)}`).join('\n')}\n\nEstimated match-win rate against the other 19 teams in this draft. Ratings and prices: October 7, 2026.${playUrl?`\n\nTry a draft: ${playUrl}`:''}`;
}
export function resultSvg({players,cost,rank,win,seat}){
  const row=(p,i)=>`<text x="64" y="${350+i*58}" font-size="15" fill="#647566">${String(i+1).padStart(2,'0')}</text><text x="112" y="${350+i*58}" font-size="24" fill="#243e31">${xml(p.n)}</text><text x="697" y="${350+i*58}" text-anchor="end" font-size="19" fill="#5b6d5f">${dollars(p.p)}</text><path d="M64 ${369+i*58}H698" stroke="#d6ddcf"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900"><rect width="1200" height="900" fill="#f7f6ee"/><rect x="34" y="34" width="1132" height="832" rx="16" fill="#fffef9" stroke="#d6ddcf"/><g font-family="Arial, sans-serif"><text x="64" y="94" font-size="30" font-weight="700" fill="#243e31">PICKLES · My draft</text><text x="64" y="125" font-size="13" letter-spacing="2" fill="#5b6d5f">2027 fantasy draft</text><path d="M64 157H1136" stroke="#243e31" stroke-width="1"/><text x="64" y="239" font-family="Georgia, serif" font-size="54" font-weight="400" fill="#243e31">My pickleball team</text><text x="64" y="279" font-size="17" fill="#5b6d5f">Draft position ${seat} · ${dollars(cost)} spent · 3 women + 3 men</text>${players.map(row).join('')}<rect x="750" y="205" width="386" height="496" rx="10" fill="#214a37"/><rect x="750" y="205" width="386" height="7" fill="#deeaa5"/><text x="780" y="261" font-size="15" letter-spacing="2" fill="#c4d6c3">Final rank</text><text x="780" y="354" font-size="86" font-weight="700" fill="#f7f6ee">#${rank}</text><text x="780" y="392" font-size="19" fill="#c4d6c3">out of 20 teams</text><path d="M780 427H1106" stroke="#425548"/><text x="780" y="497" font-size="52" font-weight="700" fill="#f7f6ee">${(win*100).toFixed(1)}%</text><text x="780" y="534" font-size="16" fill="#c4d6c3">Estimated win rate</text><text x="780" y="592" font-size="18" fill="#f7f6ee">${(win*19).toFixed(1)} expected wins</text><text x="780" y="621" font-size="16" fill="#c4d6c3">in a 19-match round robin</text><path d="M64 758H1136" stroke="#243e31"/><text x="64" y="797" font-size="15" fill="#5b6d5f">Estimated match-win rate against this drafted league, including mixed doubles and DreamBreakers.</text><text x="64" y="832" font-size="13" fill="#5b6d5f">Ratings and prices: October 7, 2026 · A fan project, not affiliated with MLP.</text></g></svg>`;
}

export async function resultPng(model){
  const source=URL.createObjectURL(new Blob([resultSvg(model)],{type:'image/svg+xml'}));
  try{
    const image=new Image();
    await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Result image could not render'));image.src=source});
    const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=900;
    const context=canvas.getContext('2d');if(!context)throw Error('Image export unavailable');context.drawImage(image,0,0);
    return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Image export unavailable')),'image/png'));
  }finally{URL.revokeObjectURL(source)}
}
