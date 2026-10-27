import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import seed from './research-seed.json';
import { eligibilitySQL, type Role } from './policy';
import { fold, similarity, slugify } from './catalog';
import { nfc } from './editorial-model';

// Prepared SQL returns heterogeneous projections. Validate writes at the action boundary.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row=Record<string,any>;
export function database(){if(!env.DB)throw new Error('Cơ sở dữ liệu chưa được kết nối.');return env.DB;}
export function displayRow(row:Row):Row{return Object.fromEntries(Object.entries(row).map(([k,v])=>[k,typeof v==='string'?nfc(v):v]));}
export async function all(sql:string,...params:unknown[]):Promise<Row[]>{const r=await database().prepare(sql).bind(...params).all();return (r.results as Row[]).map(displayRow);}
export async function one(sql:string,...params:unknown[]):Promise<Row|null>{const row=await database().prepare(sql).bind(...params).first<Row>();return row?displayRow(row):null;}
export async function run(sql:string,...params:unknown[]){return database().prepare(sql).bind(...params).run();}
export async function batch(statements:{sql:string,params:unknown[]}[]){return database().batch(statements.map(s=>database().prepare(s.sql).bind(...s.params)));}
export const timestamp=()=>new Date().toISOString();
export const uid=()=>crypto.randomUUID();

export async function ensureSeed(){
  if(await one('SELECT value FROM app_settings WHERE key=?','research_seed_v1'))return;
  const time=timestamp();const jobs:{sql:string,params:unknown[]}[]=[];
  for(const s of seed.sources)jobs.push({sql:`INSERT OR IGNORE INTO source_registry
    (id,name,source_type,url,topics,format,license_reported,next_action,notes,input_locator,batch_hash) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    params:[s.id,s.name,s.source_type,s.url,s.topics,s.format,s.license_reported,s.next_action,s.notes,s.input_locator,seed.sha256]});
  for(const c of seed.contents)jobs.push({sql:`INSERT OR IGNORE INTO cultural_contents
    (id,slug,title,category,historical_area,community,classification,imported_verification,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    params:[c.id,`${slugify(c.title)}-${c.id.toLowerCase()}`,c.title,c.category,c.historical_area,c.community,c.classification,c.imported_verification,time,time]});
  for(const c of seed.links)jobs.push({sql:'INSERT OR IGNORE INTO source_citations (id,content_id,source_id) VALUES (?,?,?)',params:[`lead-${c.content_id}`,c.content_id,c.source_id]});
  for(const [id,kind] of [['E038','physical'],['E039','memory'],['E040','digital']]){
    const c=seed.contents.find(x=>x.id===id)!;
    jobs.push({sql:'INSERT OR IGNORE INTO tours (id,slug,title,kind,status,created_at) VALUES (?,?,?,?,?,?)',params:[id,slugify(c.title),c.title,kind,'draft',time]});
  }
  for(let i=0;i<jobs.length;i+=30)await batch(jobs.slice(i,i+30));
  await run('INSERT OR IGNORE INTO app_settings (key,value) VALUES (?,?)','research_seed_v1',seed.sha256);
}

export async function viewer(){
  const user=await getChatGPTUser();if(!user)return null;
  let role=await one('SELECT role FROM user_roles WHERE user_id=?',user.userId);
  // Only enable while Sites enforces owner-only access. Never bootstrap a public/shared site.
  if(!role&&env.OWNER_PRIVATE_SETUP==='true'){
    await batch([
      {sql:'INSERT OR IGNORE INTO app_settings (key,value) VALUES (?,?)',params:['initial_owner',user.userId]},
      {sql:`INSERT OR IGNORE INTO user_roles (user_id,role,name,created_at)
        SELECT ?,'admin',?,? WHERE EXISTS(SELECT 1 FROM app_settings WHERE key='initial_owner' AND value=?)`,params:[user.userId,user.displayName,timestamp(),user.userId]},
    ]);
    role=await one('SELECT role FROM user_roles WHERE user_id=?',user.userId);
  }
  return {...user,role:(role?.role??'visitor') as Role};
}
export async function log(userId:string,action:string,targetId:string,details:unknown){
  await run('INSERT INTO review_logs (id,user_id,action,target_id,details,created_at) VALUES (?,?,?,?,?,?)',uid(),userId,action,targetId,JSON.stringify(details),timestamp());
}
export const publicWhere=`c.status='published' AND (${eligibilitySQL})`;
export async function publicContents(query='',category='',area=''){
  let rows=await all(`SELECT c.*,
    (SELECT m.url FROM media_assets m WHERE m.content_id=c.id AND m.kind='image' AND m.review_status='accepted' ORDER BY m.id LIMIT 1) image_url,
    (SELECT m.author FROM media_assets m WHERE m.content_id=c.id AND m.kind='image' AND m.review_status='accepted' ORDER BY m.id LIMIT 1) image_author,
    (SELECT m.license_name FROM media_assets m WHERE m.content_id=c.id AND m.kind='image' AND m.review_status='accepted' ORDER BY m.id LIMIT 1) image_license,
    (SELECT m.source_url FROM media_assets m WHERE m.content_id=c.id AND m.kind='image' AND m.review_status='accepted' ORDER BY m.id LIMIT 1) image_source_url,
    d.meaning,d.usage_context,d.part_of_speech FROM cultural_contents c LEFT JOIN dialect_entries d ON d.content_id=c.id WHERE ${publicWhere} ORDER BY c.updated_at DESC`);
  if(category)rows=rows.filter(r=>category.split(',').includes(r.category));
  if(area)rows=rows.filter(r=>r.historical_area===area);
  if(query.trim()){
    const q=fold(query);rows=rows.map(r=>({...r,_score:fold(r.title+' '+r.summary+' '+r.body+' '+(r.meaning??'')+' '+(r.usage_context??'')).includes(q)?2:similarity(r.title,q)})).filter(r=>r._score>.52).sort((a,b)=>b._score-a._score);
  }return rows;
}
export async function stats(){
  const rows=await all(`SELECT COUNT(*) total,SUM(CASE WHEN ${eligibilitySQL} THEN 1 ELSE 0 END) eligible,
    SUM(CASE WHEN ${publicWhere} THEN 1 ELSE 0 END) published FROM cultural_contents c`);
  const sources=await one('SELECT COUNT(*) total FROM source_registry');
  return {total:rows[0]?.total??0,eligible:rows[0]?.eligible??0,published:rows[0]?.published??0,sources:sources?.total??0};
}
export async function content(slug:string,privateAccess=false){
  return one(`SELECT c.*,CASE WHEN ${eligibilitySQL} THEN 1 ELSE 0 END eligible FROM cultural_contents c WHERE (c.slug=? OR c.id=?) ${privateAccess?'':`AND ${publicWhere}`}`,slug,slug);
}
export async function contentCitations(id:string){return all(`SELECT sc.*,s.name source_name,s.url source_url,s.license_reported,s.source_type
  FROM source_citations sc JOIN source_registry s ON s.id=sc.source_id WHERE sc.content_id=? ORDER BY sc.id`,id);}
export async function publicTours(){
  return all(`SELECT t.*,(SELECT COUNT(*) FROM tour_stops ts WHERE ts.tour_id=t.id) stop_count FROM tours t WHERE t.status='published'
    AND EXISTS(SELECT 1 FROM tour_stops ts WHERE ts.tour_id=t.id)
    AND NOT EXISTS(SELECT 1 FROM tour_stops ts JOIN cultural_contents c ON c.id=ts.content_id WHERE ts.tour_id=t.id
      AND (NOT (${publicWhere}) OR (t.kind='physical' AND (c.latitude IS NULL OR c.longitude IS NULL OR c.geo_reviewed<>1)))) ORDER BY t.title`);
}
export async function tourStops(id:string){return all(`SELECT ts.id stop_id,ts.position,c.* FROM tour_stops ts
  JOIN cultural_contents c ON c.id=ts.content_id WHERE ts.tour_id=? AND ${publicWhere} ORDER BY ts.position`,id);}
