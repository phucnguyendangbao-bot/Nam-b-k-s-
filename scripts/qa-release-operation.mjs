// Only accepts the loopback preview and uses the ignored local test secret.
import {readFile} from 'node:fs/promises';
const raw=await readFile('.dev.vars','utf8');
const auth=JSON.parse(raw.split(/\r?\n/).find(s=>s.startsWith('REVIEWED_RELEASE_AUTH=')).slice('REVIEWED_RELEASE_AUTH='.length));
const endpoint='http://127.0.0.1:5173/api/editorial-release';
const cases=[];
function check(name,ok){cases.push({name,passed:ok});if(!ok)throw Error(name);}
async function post(body,token=auth.token){const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','x-reviewed-release-token':token},body:JSON.stringify(body)});return {status:r.status,body:await r.json()};}
check('GET never publishes',(await fetch(endpoint)).status===405);
check('Missing token denied',(await post({},'')).status===403);
check('Wrong token denied',(await post({},'x'.repeat(64))).status===403);
check('Wrong bundle rejected',(await post({confirm:'publish-reviewed-bundle',bundleSha256:'wrong'})).status===409);
const result=await post({confirm:'publish-reviewed-bundle',bundleSha256:auth.bundleSha256});
if(result.status!==200)console.log(JSON.stringify(result));
check('Approved exact bundle succeeds',result.status===200);
check('Only eleven reviewed articles and three reading journeys',result.body.articles?.length===11&&result.body.tours?.length===3&&result.body.publishedArticles===11&&result.body.publishedTours===3);
check('Replay cannot rewrite content',(await post({confirm:'publish-reviewed-bundle',bundleSha256:auth.bundleSha256})).status===409);
console.log(JSON.stringify({cases,result:result.body}));
