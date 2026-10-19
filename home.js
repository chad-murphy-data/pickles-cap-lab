// Existing shared-team and methods links still open the builder.
export function builderDestination(href){
 const url=new URL(href),hash=new URLSearchParams(url.hash.slice(1));
 if(!hash.has('p')&&!['#methods','#builder'].includes(url.hash))return null;
 return new URL('build.html'+url.search+url.hash,url).href;
}
if(typeof window!=='undefined'){
 const destination=builderDestination(location.href);
 if(destination)location.replace(destination);
 const read=k=>{try{return localStorage.getItem(k)}catch{return null}};
 document.documentElement.dataset.theme=read('pklTheme')||read('cap-desk-theme')||'light';
 document.getElementById('theme').onclick=()=>{
  const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';
  document.documentElement.dataset.theme=theme;
  try{localStorage.setItem('pklTheme',theme);localStorage.setItem('cap-desk-theme',theme)}catch{}
 };
}
