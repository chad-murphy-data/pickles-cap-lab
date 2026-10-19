// Ordinary legal draft rosters, rather than optimized score-benchmark solutions.
const examples=[
 {name:'Ben & Lea',names:['Ben Johns','Lea Jansen','Jessie Irvine','Dylan Frazier','Salome Devidze','Grayson Goldin']},
 {name:'Parenteau & Sock',names:['Catherine Parenteau','Jack Sock','Milan Rane','Yuta Funemizu','Donald Young','Daria Walczak']},
 {name:'Staksrud & Buckner',names:['Federico Staksrud','Brooke Buckner','Jaume Martinez Vich','Allyce Jones','Seone Mendez','Clayton Powell']}
];
export function builderExamples(players){
 return examples.flatMap(example=>{
  const roster=example.names.map(name=>players.find(p=>p.n===name));
  if(roster.some(p=>!p||p.dr>100))return [];
  const cost=roster.reduce((sum,p)=>sum+p.p,0);
  if(cost<500000||cost>1000000||roster.filter(p=>p.g==='F').length!==3||roster.filter(p=>p.g==='M').length!==3)return [];
  return [{name:example.name,ids:roster.map(p=>p.i)}];
 });
}
