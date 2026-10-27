// Read-only server-side check. Service access enters hidden stdin only.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const line=await new Promise(resolve=>{
 let input='';const terminal=process.stdin.isTTY;if(terminal)process.stdin.setRawMode(true);
 process.stdin.setEncoding('utf8');process.stdin.resume();
 const finish=()=>{process.stdin.removeAllListeners('data');if(terminal)process.stdin.setRawMode(false);process.stdin.pause();resolve(input.trim());};
 process.stdin.on('data',chunk=>{input+=chunk;if(/[\r\n]/.test(input))finish();});process.stdin.once('end',finish);
 console.log('Ready for service access on hidden stdin.');
});
const {serviceToken}=JSON.parse(line),origin='https://nam-bo-ky-su.gladmouse16.chatgpt.site';
const headers={'OAI-Sites-Authorization':'Bearer '+serviceToken},checks=[];
const check=(name,ok)=>{checks.push({name,passed:ok});if(!ok)throw Error(name);};
const response=await fetch(origin+'/api/catalog',{headers,redirect:'error',signal:AbortSignal.timeout(60000)});
const catalog=await response.json();check('Catalog is live',response.ok);check('Eleven published articles',catalog.items.length===11);check('Eleven eligible articles',catalog.stats.eligible===11);
const tourPage=await fetch(origin+'/hanh-trinh',{headers,signal:AbortSignal.timeout(60000)});const html=await tourPage.text();check('Journey directory works',tourPage.ok);
const tours=[...new Set([...html.matchAll(/href="(\/hanh-trinh\/[^"?#]+)"/g)].map(m=>m[1]))];check('Three published digital journeys',tours.length===3);
const bundle=JSON.parse(await readFile('lib/editorial-bundle.json','utf8'));
const paths=['/','/chuyen-muc/dat-nam-bo','/chuyen-muc/nep-xua','/chuyen-muc/tieng-que-minh',...catalog.items.map(c=>'/ho-so/'+c.slug),...tours,...new Set(bundle.articles.flatMap(a=>a.media.map(m=>m.url)))];
for(const path of paths){const r=await fetch(origin+path,{headers,redirect:'error',signal:AbortSignal.timeout(60000)});check('GET '+path,r.ok);await r.arrayBuffer();}
const removed=await fetch(origin+'/api/editorial-release',{headers,signal:AbortSignal.timeout(60000)}),removedText=await removed.text();
// A streamed not-found page can retain HTTP 200 after headers have been sent.
check('Temporary publication route removed',removed.status===404||(removed.headers.get('content-type')?.includes('text/html')&&removedText.includes('404 · CHƯA CÓ TRANG NÀY')&&removedText.includes('Trang ký sự chưa mở.')));
const report={checkedAt:new Date().toISOString(),origin,stats:catalog.stats,publishedJourneys:tours.length,checks};await mkdir('outputs/collections-qa',{recursive:true});await writeFile('outputs/collections-qa/hosted-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
