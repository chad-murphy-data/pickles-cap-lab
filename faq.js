import './home.js';

// Linked questions open on arrival, including when following a link within the page.
function openLinkedQuestion(){
 let id;try{id=decodeURIComponent(location.hash.slice(1))}catch{return}
 const question=document.getElementById(id);
 if(question?.tagName!=='DETAILS')return;
 question.open=true;
 question.scrollIntoView({block:'start',behavior:'instant'});
}
openLinkedQuestion();
addEventListener('hashchange',openLinkedQuestion);
