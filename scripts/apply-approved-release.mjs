// Server-side operator only. Secrets enter stdin and never appear in output.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const line=await new Promise(resolve=>{
 let input='';const terminal=process.stdin.isTTY;
 if(terminal)process.stdin.setRawMode(true);
 process.stdin.setEncoding('utf8');process.stdin.resume();
 const finish=()=>{process.stdin.removeAllListeners('data');if(terminal)process.stdin.setRawMode(false);process.stdin.pause();resolve(input.trim());};
 process.stdin.on('data',chunk=>{input+=chunk;if(input.includes('\n')||input.includes('\r'))finish();});
 process.stdin.once('end',finish);
 process.stdout.write('Ready for approved release credentials on stdin (input hidden).\n');
});
{
 const {serviceToken,releaseToken,bundleSha256,checkOnly=false}=JSON.parse(line);
 const origin='https://nam-bo-ky-su.gladmouse16.chatgpt.site';
 if(checkOnly){
  const headers={'OAI-Sites-Authorization':'Bearer '+serviceToken},checks=[];
  const check=(name,ok)=>{checks.push({name,passed:ok});if(!ok)throw Error(name);};
  const response=await fetch(origin+'/api/catalog',{headers,redirect:'error',signal:AbortSignal.timeout(60000)});
  const catalog=await response.json();check('Catalog is live',response.ok);check('Eleven published articles',catalog.items.length===11);check('Eleven eligible articles',catalog.stats.eligible===11);
  const tourPage=await fetch(origin+'/hanh-trinh',{headers,signal:AbortSignal.timeout(60000)});const html=await tourPage.text();check('Journey directory works',tourPage.ok);
  const tours=[...new Set([...html.matchAll(/href="(\/hanh-trinh\/[^"?#]+)"/g)].map(m=>m[1]))];check('Three published digital journeys',tours.length===3);
  const bundle=JSON.parse(await readFile('lib/editorial-bundle.json','utf8'));
  const paths=['/','/chuyen-muc/dat-nam-bo','/chuyen-muc/nep-xua','/chuyen-muc/tieng-que-minh',...catalog.items.map(c=>'/ho-so/'+c.slug),...tours,...new Set(bundle.articles.flatMap(a=>a.media.map(m=>m.url)))];
  for(const path of paths){const r=await fetch(origin+path,{headers,redirect:'error',signal:AbortSignal.timeout(60000)});check('GET '+path,r.ok);await r.arrayBuffer();}
  const disabled=await fetch(origin+'/api/editorial-release',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(60000)});check('Temporary publication operation disabled',disabled.status===404);
  const report={checkedAt:new Date().toISOString(),origin,stats:catalog.stats,publishedJourneys:tours.length,checks};await mkdir('outputs/collections-qa',{recursive:true});await writeFile('outputs/collections-qa/hosted-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }else{
 const response=await fetch(origin+'/api/editorial-release',{method:'POST',headers:{'Content-Type':'application/json','OAI-Sites-Authorization':'Bearer '+serviceToken,'x-reviewed-release-token':releaseToken},body:JSON.stringify({confirm:'publish-reviewed-bundle',bundleSha256}),redirect:'error',signal:AbortSignal.timeout(60000)});
 console.log(JSON.stringify({status:response.status,result:await response.json()}));process.exitCode=response.ok?0:1;
 }
}
