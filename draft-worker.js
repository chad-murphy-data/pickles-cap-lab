import {configure,choosePick,pick} from './draft-engine.js';
onmessage=e=>{try{if(e.data.type==='init'){configure(e.data.players,e.data.refs);return}const state=e.data.state;pick(state,choosePick(state));postMessage({state,generation:e.data.generation})}catch(error){postMessage({error:error.message,generation:e.data.generation})}};
