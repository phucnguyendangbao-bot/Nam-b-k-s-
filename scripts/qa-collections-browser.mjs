// Uses the bundled browser tooling and an isolated headless Edge profile.
// All writes are confined to localhost D1; never accepts a hosted URL.
import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const require=createRequire('C:/Users/LOQ/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json');
const {chromium}=require('playwright');
const origin='http://127.0.0.1:5173';
const bundle=JSON.parse(await readFile(new URL('../lib/editorial-bundle.json',import.meta.url),'utf8'));
const out=new URL('../outputs/collections-qa/',import.meta.url);await mkdir(out,{recursive:true});
const results=[],errors=[];
const visualOnly=process.argv.includes('--visual-only');
function check(name,condition,details){results.push({name,passed:!!condition,...(details?{details}:{} )});if(!condition)throw new Error(name+(details?' '+JSON.stringify(details):''));}
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--no-first-run','--disable-gpu']});
const anonymous=await browser.newContext({viewport:{width:1440,height:1000}}),staff=await browser.newContext({viewport:{width:1440,height:1000}});
const anon=await anonymous.newPage(),page=await staff.newPage();
for(const p of [anon,page]){p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});}
async function open(p,path){const response=await p.goto(origin+path,{waitUntil:'domcontentloaded'});check('GET '+path,response.status()===200);await p.waitForLoadState('networkidle');await p.evaluate(()=>document.fonts.ready);}
async function post(data){const response=await staff.request.post(origin+'/api/action',{form:data,headers:{Origin:origin},maxRedirects:0});const loc=response.headers().location??'';check('POST '+data.action,response.status()===303&&!loc.includes('error='),{status:response.status(),location:decodeURIComponent(loc)});return loc;}
async function visual(p,label,width,height){
 await p.setViewportSize({width,height});await p.evaluate(()=>document.fonts.ready);
 for(const img of await p.locator('img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(async image=>{if(!image.complete)await new Promise((res,rej)=>{image.onload=res;image.onerror=rej;});await image.decode();});}
 await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
 const overflow=await p.evaluate(()=>({actual:document.documentElement.scrollWidth,viewport:innerWidth}));check('No horizontal overflow '+label+' '+width,overflow.actual<=overflow.viewport+1,overflow);
 await p.screenshot({path:fileURLToPath(new URL(label+'-'+width+'.png',out)),fullPage:true,caret:'initial'});
}
try{
 await open(anon,'/');
 await anon.evaluate(async()=>{await document.fonts.load('500 20px "Noto Serif"','Đất Nam Bộ Nếp xưa Tiếng quê mình');});
 const typography=await anon.locator('.category-card h3').evaluateAll(nodes=>nodes.slice(0,3).map(n=>{const s=getComputedStyle(n);return {text:n.textContent,font:s.fontFamily,letterSpacing:s.letterSpacing,fontSize:parseFloat(s.fontSize),lineHeight:parseFloat(s.lineHeight),width:n.clientWidth,scrollWidth:n.scrollWidth};}));
 check('Vietnamese category titles NFC',typography.map(x=>x.text).join('|')==='Đất Nam Bộ|Nếp xưa|Tiếng quê mình');
 check('Category font and accent spacing',typography.every(x=>x.font.includes('Noto Serif')&&(x.letterSpacing==='normal'||x.letterSpacing==='0px')&&x.lineHeight>=x.fontSize*1.4),typography);
 await visual(anon,'home',1440,1000);await visual(anon,'home',390,844);await visual(anon,'home',320,800);
 const before=await (await anonymous.request.get(origin+'/api/catalog')).json();check('Catalog baseline',visualOnly?before.items.length===11:before.items.length===0,{published:before.items.length});
 await open(page,'/signin-with-chatgpt?return_to=/quan-tri/ban-thao');
 check('Prepared desk requires signed-in role',await page.getByRole('heading',{name:'Đọc nguồn, rồi mở từng trang'}).count()===1);
 for(const a of bundle.articles){
  await open(page,'/quan-tri/ban-thao/'+a.id);check('Draft preview badge '+a.id,await page.getByText('Xem trước bản chuẩn bị nguồn.',{exact:true}).count()===1);
  if(a.kind==='dialect')check('No invented pronunciation '+a.id,await page.locator('audio').count()===0&&await page.getByText('Chưa có bản ghi phát âm được cấp quyền và đối chiếu giọng đọc.',{exact:false}).count()>0);
  for(const [w,h] of [[1440,1000],[390,844]])await visual(page,'draft-'+a.id,w,h);
 }
 const unchanged=await (await anonymous.request.get(origin+'/api/catalog')).json();check('Draft previews never change publication',unchanged.items.length===before.items.length);
 // Explicitly exercise the existing manual workflow on disposable LOCAL D1 only.
 if(!visualOnly)for(const a of bundle.articles){
  await post({action:'stage_prepared',id:a.id,review_before_import:'on',return_to:'/quan-tri/ban-thao'});
  await post({action:'review_materials',id:a.id,materials_checked:'on',return_to:'/quan-tri/noi-dung/'+a.id});
  await open(page,'/quan-tri/noi-dung/'+a.id);const rev=await page.locator('input[name=revision]').first().inputValue();
  await post({action:'review_content',id:a.id,revision:rev,rights_basis:a.rights_basis,publish_rights:'on',claims_complete:'on',publish:'on',return_to:'/quan-tri/noi-dung/'+a.id});
 }
 if(!visualOnly)for(const t of bundle.tours)await post({action:'tour',id:t.id,title:t.title,kind:'digital',description:t.description,stops:t.content_ids.join(','),publish:'on',return_to:'/quan-tri/hanh-trinh'});
 const live=await (await anonymous.request.get(origin+'/api/catalog')).json();check('Local manual review publishes exactly reviewed articles',live.items.length===11,{count:live.items.length});
 const collections=['dat-nam-bo','nep-xua','tieng-que-minh'];
 for(const slug of collections)for(const [w,h] of [[1440,1000],[390,844]]){await page.setViewportSize({width:w,height:h});await open(page,'/chuyen-muc/'+slug);await visual(page,'collection-'+slug,w,h);}
 await open(page,'/chuyen-muc/dat-nam-bo?q=dau+sau');check('Accent-insensitive place search',await page.locator('.dossier-card').count()===1&&await page.locator('.dossier-card h2').innerText()==='Đầu Sấu: những giả thuyết về một tên đất');
 await open(page,'/chuyen-muc/dat-nam-bo?topic=architecture');check('Architecture filter isolates Bình Thủy',await page.locator('.dossier-card').count()===1&&await page.locator('.dossier-card h2').innerText()==='Nhà cổ Bình Thủy: đọc kiến trúc và nếp nhà');
 await open(page,'/chuyen-muc/tieng-que-minh?q=lam');check('Dictionary searches meaning',await page.locator('.dossier-card h2').allTextContents().then(x=>x.includes('mần')));
 await open(page,'/chuyen-muc/tieng-que-minh?word_type='+encodeURIComponent('Động từ'));check('Dictionary word type filter',await page.locator('.dossier-card').count()===1&&await page.locator('.dossier-card h2').innerText()==='mần');
 for(const a of live.items){for(const [w,h] of [[1440,1000],[390,844]]){await page.setViewportSize({width:w,height:h});await open(page,'/ho-so/'+a.slug);await visual(page,'article-'+a.id,w,h);}
  check('Article has references and related tours '+a.id,await page.locator('#nguon-tham-khao li').count()>0&&await page.locator('#tour-lien-quan .related-tour').count()>0);
 }
 await page.locator('#tour-lien-quan .related-tour').first().click();check('Related tour opens genuine local reading journey',await page.locator('.tour-layout').count()===1);
 if(!visualOnly){await page.getByRole('button',{name:'Lưu tiến độ tại chặng này'}).click();check('Reading progress saves',await page.getByText('Đã lưu chặng đang trải nghiệm.',{exact:true}).count()===1);}
 check('No browser JavaScript errors',errors.length===0,errors);
}finally{
 await writeFile(new URL(visualOnly?'visual-results.json':'results.json',out),JSON.stringify({target:origin,hostedWrites:false,results,errors,passed:results.filter(x=>x.passed).length,total:results.length},null,2));
 await browser.close();
 console.log(JSON.stringify({passed:results.filter(x=>x.passed).length,total:results.length,errors,output:fileURLToPath(out)}));
}
