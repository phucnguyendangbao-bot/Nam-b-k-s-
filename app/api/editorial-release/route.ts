import { env } from 'cloudflare:workers';
import { database,ensureSeed,log,one,publicContents,publicTours,run,timestamp,uid,batch } from '@/lib/data';
import { editorialDrafts,stagePreparedArticle } from '@/lib/editorial-drafts';
import { eligibilitySQL,assertAllowed } from '@/lib/policy';
import { imagePathAllowed,permitsCommercialMedia } from '@/lib/editorial-model';
import { slugify } from '@/lib/catalog';

export const dynamic='force-dynamic';
// Explicit owner-approved service operation, never invoked by GET/seed/migration.
// Platform service access is supplemented by a short-lived runtime secret.
export async function POST(request:Request){
 let lease:string|null=null;
 const db=database(),releaseKey=`reviewed_release:${editorialDrafts.version}`;
 try{
  if(!env.REVIEWED_RELEASE_AUTH)return Response.json({error:'Release operation disabled.'},{status:404});
  const auth=JSON.parse(env.REVIEWED_RELEASE_AUTH) as {token:string;expiresAt:string;bundleSha256:string};
  if(!auth.token||auth.token.length<48||Date.parse(auth.expiresAt)<=Date.now()||!Number.isFinite(Date.parse(auth.expiresAt)))return Response.json({error:'Release operation expired.'},{status:403});
  const received=new TextEncoder().encode(request.headers.get('x-reviewed-release-token')??'');
  const expected=new TextEncoder().encode(auth.token);
  if(received.length!==expected.length)return Response.json({error:'Unauthorized.'},{status:403});
  const digests=await Promise.all([received,expected].map(bytes=>crypto.subtle.digest('SHA-256',bytes)));
  const actualHash=new Uint8Array(digests[0]),expectedHash=new Uint8Array(digests[1]);let mismatch=0;
  for(let i=0;i<32;i++)mismatch|=actualHash[i]^expectedHash[i];
  if(mismatch!==0)return Response.json({error:'Unauthorized.'},{status:403});
  if(Number(request.headers.get('content-length')??0)>2048)return Response.json({error:'Payload too large.'},{status:413});
  const payload=await request.text();assertAllowed(payload.length<2048,'Payload too large.');
  const input=JSON.parse(payload);
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(editorialDrafts)));
  const bundleHash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  assertAllowed(input.confirm==='publish-reviewed-bundle'&&input.bundleSha256===bundleHash&&auth.bundleSha256===bundleHash,'The approved bundle does not match.');
  assertAllowed(editorialDrafts.articles.length===11&&editorialDrafts.tours.length===3,'Unexpected release scope.');
  await ensureSeed();
  const previous=await one('SELECT value FROM app_settings WHERE key=?',releaseKey);
  if(previous)return Response.json({error:'Release already applied or in progress.'},{status:409});
  lease=uid();
  const lock=await db.prepare('INSERT OR IGNORE INTO app_settings (key,value) VALUES (?,?)').bind(releaseKey,lease).run();
  assertAllowed(lock.meta.changes===1,'Release already in progress.');
  const actor=`owner-approved-service:${editorialDrafts.version}`;
  await log(actor,'release.explicit_owner_approval',releaseKey,{bundleHash,approval:'Owner approved publishing these 11 prepared articles and 3 digital reading journeys in this conversation.',articleIds:editorialDrafts.articles.map(a=>a.id)});
  for(const a of editorialDrafts.articles){
   let c=await one('SELECT * FROM cultural_contents WHERE id=?',a.id);
   if(!c||(c.body===''&&c.revision===1&&c.status==='draft')){await stagePreparedArticle(db,a.id,actor);c=await one('SELECT * FROM cultural_contents WHERE id=?',a.id);}
   assertAllowed(c&&c.revision===2&&c.body===a.body&&c.title===a.title&&c.summary===a.summary&&c.introduction===a.introduction&&c.scope_note===a.scope_note&&c.sections_json===JSON.stringify(a.sections)&&c.content_kind===a.kind&&c.topic===a.topic&&c.classification==='source_supported'&&c.text_license===a.text_license&&c.text_license_url===a.text_license_url&&c.latitude===null&&c.longitude===null,'An article was edited; manual review required: '+a.id);
   const claims=await db.prepare('SELECT sc.*,s.url,s.source_type FROM source_citations sc JOIN source_registry s ON s.id=sc.source_id WHERE sc.content_id=?').bind(a.id).all();
   assertAllowed(claims.results.length===a.claims.length,'Evidence differs: '+a.id);
   for(const claim of claims.results){const original=a.claims.find(e=>e.id===claim.id),source=editorialDrafts.sources.find(s=>s.id===claim.source_id);
    assertAllowed(original&&source&&claim.source_id===original.source_id&&claim.statement===original.statement&&claim.locator===original.locator&&claim.claim_kind===original.kind&&claim.relation==='supports'&&claim.url===source.url&&claim.source_version===(source.source_version??'Bản web đối chiếu 2026-10-27')&&!['library_catalog','book_notice'].includes(String(claim.source_type)),'Evidence needs a new review: '+a.id);
   }
   const media=await db.prepare('SELECT * FROM media_assets WHERE content_id=?').bind(a.id).all();
   assertAllowed(media.results.length===a.media.length,'Media differs: '+a.id);
   for(const m of media.results){const original=a.media.find(x=>x.id===m.id);
    assertAllowed(original&&Object.entries(original).every(([k,v])=>m[k]===v)&&m.commercial_allowed===1&&permitsCommercialMedia(String(m.license_name),String(m.license_url))&&imagePathAllowed(String(m.url)),'Media needs a new review: '+a.id);
   }
   const dialect=await one('SELECT * FROM dialect_entries WHERE content_id=?',a.id);
   assertAllowed(a.dialect?dialect&&Object.entries(a.dialect).every(([k,v])=>dialect[k]===v):!dialect,'Dictionary needs a new review: '+a.id);
   if(c.status==='published'){assertAllowed(await one(`SELECT c.id FROM cultural_contents c WHERE c.id=? AND ${eligibilitySQL}`,a.id),'Existing publication is no longer eligible.');continue;}
   await batch([
    {sql:"UPDATE source_citations SET status='accepted',reviewer=?,reviewed_at=? WHERE content_id=?",params:[actor,timestamp(),a.id]},
    {sql:"UPDATE dialect_entries SET review_status='accepted',reviewer=?,reviewed_at=? WHERE content_id=?",params:[actor,timestamp(),a.id]},
    {sql:"UPDATE media_assets SET review_status='accepted',reviewer=?,reviewed_at=? WHERE content_id=?",params:[actor,timestamp(),a.id]},
    {sql:'UPDATE cultural_contents SET publish_rights=1,rights_basis=?,rights_reviewer=?,approved_revision=revision,reviewed_by=?,reviewed_at=?,updated_at=? WHERE id=? AND revision=2',params:[a.rights_basis,actor,actor,timestamp(),timestamp(),a.id]},
   ]);
   assertAllowed(await one(`SELECT c.id FROM cultural_contents c WHERE c.id=? AND ${eligibilitySQL}`,a.id),'Publication requirements incomplete: '+a.id);
   await run("UPDATE cultural_contents SET status='published' WHERE id=? AND revision=2",a.id);
   await log(actor,'content.publish',a.id,{revision:2,bundleHash,rightsBasis:a.rights_basis});
  }
  const published=await publicContents();
  for(const t of editorialDrafts.tours){
   assertAllowed(t.kind==='digital'&&t.content_ids.every(id=>published.some(c=>c.id===id)),'Journey has unpublished stops.');
   const old=await one('SELECT * FROM tours WHERE id=?',t.id);
   if(old){const stops=await db.prepare('SELECT content_id FROM tour_stops WHERE tour_id=? ORDER BY position').bind(t.id).all();
    assertAllowed(old.title===t.title&&old.kind===t.kind&&old.description===t.description&&old.status==='published'&&JSON.stringify(stops.results.map(s=>s.content_id))===JSON.stringify(t.content_ids),'Existing journey needs manual review: '+t.id);continue;
   }
   await batch([
    {sql:"INSERT INTO tours (id,slug,title,kind,description,status,reviewed_by,created_at) VALUES (?,?,?,?,?,'published',?,?)",params:[t.id,`${slugify(t.title)}-${t.id.toLowerCase()}`,t.title,t.kind,t.description,actor,timestamp()]},
    ...t.content_ids.map((id,i)=>({sql:'INSERT INTO tour_stops VALUES (?,?,?,?)',params:[uid(),t.id,id,i+1]})),
   ]);await log(actor,'tour.publish',t.id,{bundleHash,stops:t.content_ids});
  }
  const receipt={completedAt:timestamp(),bundleHash,articles:editorialDrafts.articles.map(a=>a.id),tours:editorialDrafts.tours.map(t=>t.id),publishedArticles:(await publicContents()).length,publishedTours:(await publicTours()).length};
  await run('UPDATE app_settings SET value=? WHERE key=? AND value=?',JSON.stringify(receipt),releaseKey,lease);lease=null;
  return Response.json(receipt,{headers:{'Cache-Control':'no-store'}});
 }catch(error){if(lease)await run('DELETE FROM app_settings WHERE key=? AND value=?',releaseKey,lease);return Response.json({error:error instanceof Error?error.message:'Release failed.'},{status:409});}
}
