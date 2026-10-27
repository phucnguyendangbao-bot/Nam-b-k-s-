// Server-side operator only. Secrets enter stdin and never appear in output.
import {createInterface} from 'node:readline';
const rl=createInterface({input:process.stdin,terminal:false});
process.stdout.write('Ready for approved release credentials on stdin.\n');
for await(const line of rl){
 const {serviceToken,releaseToken,bundleSha256}=JSON.parse(line);
 const origin='https://nam-bo-ky-su.gladmouse16.chatgpt.site';
 const response=await fetch(origin+'/api/editorial-release',{method:'POST',headers:{'Content-Type':'application/json','OAI-Sites-Authorization':'Bearer '+serviceToken,'x-reviewed-release-token':releaseToken},body:JSON.stringify({confirm:'publish-reviewed-bundle',bundleSha256}),redirect:'error'});
 console.log(JSON.stringify({status:response.status,result:await response.json()}));process.exitCode=response.ok?0:1;rl.close();break;
}
