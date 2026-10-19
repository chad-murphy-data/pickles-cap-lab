// A comparison scale, not a win probability or a percentile.
export function teamScore(win,benchmarks){
 const low=benchmarks?.low?.win,high=benchmarks?.high?.win;
 if(!Number.isFinite(win)||!Number.isFinite(low)||!Number.isFinite(high)||high<=low)throw new TypeError('Valid strength benchmarks are required.');
 const raw=100*(win-low)/(high-low);
 return {value:Math.max(0,Math.min(100,raw)),outside:raw<-.000001?'below':raw>100.000001?'above':null};
}
export function validBenchmarks(data,b){
 if(b?.version!==1||b.dataVersion!==data.version||b.rules?.minimum!==500000||b.rules?.maximum!==1000000)return false;
 const valid=anchor=>Number.isFinite(anchor?.win)&&anchor.win>=0&&anchor.win<=1&&Number.isInteger(anchor.cost)&&anchor.cost>=500000&&anchor.cost<=1000000;

 return valid(b.low)&&valid(b.high)&&b.low.win<b.high.win;
}
