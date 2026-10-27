import rawBundle from './editorial-bundle.json';
import { slugify } from './catalog';
import { imagePathAllowed, permitsCommercialMedia } from './editorial-model';

export type ReviewedSource={id:string;name:string;url:string;source_type:string;author?:string;source_version?:string;rights?:string;license?:string;license_url?:string};
export type PreparedMedia={id:string;kind:string;url:string;caption:string;author:string;source_url:string;license_name:string;license_url:string;modifications:string;attribution:string;commercial_allowed:number;file_sha256:string;width:number;height:number};
export type PreparedDialect={headword:string;meaning:string;usage_context:string;example:string;example_note:string;regional_scope:string;part_of_speech:string;audio_asset_id:null};
export type PreparedArticle={id:string;title:string;category:string;kind:string;topic:string;historical_area:string;community:string;summary:string;body:string;introduction:string;scope_note:string;sections:unknown[];claims:{id:string;source_id:string;statement:string;locator:string;kind:string}[];rights_basis:string;text_license:string;text_license_url:string;media:PreparedMedia[];dialect?:PreparedDialect;publish:false};
type Bundle={version:string;reviewed_at:string;reviewer:string;sources:ReviewedSource[];articles:PreparedArticle[];draft_notes:Record<string,string>;tours:{id:string;title:string;kind:string;description:string;content_ids:string[]}[]};
export const editorialDrafts=rawBundle as unknown as Bundle;
type Job={sql:string;params:unknown[]};

/** Explicit CMS POST only. Never called on GET and never sets approved/published. */
export async function stagePreparedArticle(db:D1Database,id:string,actor:string){
  const a=editorialDrafts.articles.find(x=>x.id===id);if(!a)throw new Error('Không có bản chuẩn bị này.');
  const time=new Date().toISOString(),version=editorialDrafts.version;
  for(const m of a.media)if(!m.commercial_allowed||!permitsCommercialMedia(m.license_name,m.license_url)||!imagePathAllowed(m.url)||!m.author||!m.modifications||!m.source_url.startsWith('https://commons.wikimedia.org/wiki/File:'))throw new Error('Ảnh chưa đủ điều kiện quyền sử dụng.');
  const old=await db.prepare('SELECT * FROM cultural_contents WHERE id=?').bind(id).first<Record<string,unknown>>();
  if(old&&(old.body!==''||old.revision!==1||old.status!=='draft'))throw new Error('Hồ sơ đã được biên tập. Hãy đối chiếu thủ công để giữ các sửa đổi hiện có.');
  const originals=old?await db.prepare('SELECT * FROM source_citations WHERE content_id=?').bind(id).all():{results:[]};
  const jobs:Job[]=[];
  for(const s of editorialDrafts.sources.filter(s=>a.claims.some(c=>c.source_id===s.id))){
    jobs.push({sql:`INSERT OR IGNORE INTO source_registry (id,name,source_type,url,topics,format,license_reported,next_action,notes,input_locator,batch_hash)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`,params:[s.id,s.name,s.source_type,s.url,'collections','HTML',s.license??'copyright_unspecified','manual_claim_review',
      [s.author,s.rights,s.license_url].filter(Boolean).join(' · '),'Source review 2026-10-27',version]});
  }
  jobs.push({sql:`INSERT OR IGNORE INTO cultural_contents (id,slug,title,category,historical_area,community,classification,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?)`,params:[id,`${slugify(a.title)}-${id.toLowerCase()}`,a.title,a.category,a.historical_area,a.community,'source_supported',time,time]});
  const changed=`EXISTS(SELECT 1 FROM cultural_contents WHERE id=? AND updated_at=? AND revision=2 AND status='draft')`,guard=[id,time];
  jobs.push({sql:`INSERT OR IGNORE INTO content_revisions (id,content_id,revision,snapshot_json,user_id,created_at)
    SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM cultural_contents WHERE id=? AND body='' AND revision=1 AND status='draft')`,
    params:[`${version}:${id}`,id,1,JSON.stringify({content:old,citations:originals.results}),actor,time,id]});
  jobs.push({sql:`UPDATE cultural_contents SET title=?,summary=?,body=?,content_kind=?,topic=?,introduction=?,scope_note=?,sections_json=?,
    text_license=?,text_license_url=?,historical_area=?,community=?,classification='source_supported',storage_consent=1,
    publish_rights=0,status='draft',revision=2,approved_revision=0,reviewed_by=NULL,updated_at=?
    WHERE id=? AND body='' AND revision=1 AND status='draft'`,
    params:[a.title,a.summary,a.body,a.kind,a.topic,a.introduction,a.scope_note,JSON.stringify(a.sections),a.text_license,a.text_license_url,a.historical_area,a.community,time,id]});
  jobs.push({sql:`DELETE FROM source_citations WHERE content_id=? AND ${changed}`,params:[id,...guard]});
  for(const c of a.claims){const source=editorialDrafts.sources.find(s=>s.id===c.source_id);
    jobs.push({sql:`INSERT OR IGNORE INTO source_citations (id,content_id,source_id,statement,claim_kind,locator,source_version,relation,status,review_note)
      SELECT ?,?,?,?,?,?,?,'supports','pending',? WHERE ${changed}`,
      params:[c.id,id,c.source_id,c.statement,c.kind,c.locator,source?.source_version??'Bản web đối chiếu 2026-10-27',
        'Bản chuẩn bị đã đối chiếu nguồn; biên tập viên cần xác nhận lại phạm vi trước khi chấp nhận.',...guard]});}
  if(a.dialect){const d=a.dialect;jobs.push({sql:`INSERT OR IGNORE INTO dialect_entries
    (content_id,headword,meaning,usage_context,example,example_note,regional_scope,part_of_speech,review_status)
    SELECT ?,?,?,?,?,?,?,?,'pending' WHERE ${changed}`,params:[id,d.headword,d.meaning,d.usage_context,d.example,d.example_note,d.regional_scope,d.part_of_speech,...guard]});}
  for(const m of a.media)jobs.push({sql:`INSERT OR IGNORE INTO media_assets
    (id,content_id,kind,url,caption,author,source_url,license_name,license_url,modifications,attribution,commercial_allowed,review_status,file_sha256,width,height)
    SELECT ?,?,?,?,?,?,?,?,?,?,?,1,'pending',?,?,? WHERE ${changed}`,
    params:[m.id,id,m.kind,m.url,m.caption,m.author,m.source_url,m.license_name,m.license_url,m.modifications,m.attribution,m.file_sha256,m.width,m.height,...guard]});
  jobs.push({sql:`INSERT INTO review_logs (id,user_id,action,target_id,details,created_at) SELECT ?,?,?,?,?,? WHERE ${changed}`,
    params:[crypto.randomUUID(),actor,'research.stage_draft',id,JSON.stringify({version,sourceIds:a.claims.map(c=>c.source_id),publication:false}),time,...guard]});
  await db.batch(jobs.map(j=>db.prepare(j.sql).bind(...j.params)));
  const staged=await db.prepare("SELECT id FROM cultural_contents WHERE id=? AND updated_at=? AND revision=2 AND status='draft'").bind(id,time).first();
  if(!staged)throw new Error('Hồ sơ vừa được sửa ở phiên khác; không ghi đè thay đổi.');
  return {id,staged:true,status:'draft'};
}
