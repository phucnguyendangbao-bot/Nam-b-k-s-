import { NextResponse } from 'next/server';
import { batch,content,contentCitations,database,ensureSeed,log,one,publicContents,publicTours,run,timestamp,uid,viewer } from '@/lib/data';
import { assertAllowed,canAdmin,canEdit,canReview,eligibilitySQL,rightsCanStore,validCoordinates } from '@/lib/policy';
import { classes,safeUrl,slugify } from '@/lib/catalog';
import { stagePreparedArticle } from '@/lib/editorial-drafts';
import { imagePathAllowed,audioPathAllowed,nfc,parseSections,permitsCommercialMedia,sectionBody,sectionLabels,type ArticleSection,type SectionKind } from '@/lib/editorial-model';

export const dynamic='force-dynamic';
function field(f:FormData,key:string,max=2000){const v=nfc(String(f.get(key)??'')).trim();assertAllowed(!v.includes('\uFFFD'),'Văn bản có ký tự Unicode lỗi.');assertAllowed(v.length<=max,`Trường ${key} quá dài.`);return v;}
function checked(f:FormData,key:string){return f.get(key)==='on'||f.get(key)==='true';}
function required(value:string,message='Vui lòng nhập đủ thông tin.'){assertAllowed(value,message);return value;}
function result(request:Request,path:string,message:string,error=false){const url=new URL(path,request.url);url.searchParams.set(error?'error':'done',message);return NextResponse.redirect(url,303);}
async function readForm(request:Request){
  assertAllowed(request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded'),'Định dạng biểu mẫu không được hỗ trợ.');
  const reader=request.body?.getReader();assertAllowed(reader,'Thiếu biểu mẫu.');
  const chunks:Uint8Array[]=[];let size=0;
  while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>70000){await reader.cancel();throw new Error('Biểu mẫu quá lớn.');}chunks.push(part.value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  const form=new FormData();for(const [key,value] of new URLSearchParams(new TextDecoder().decode(bytes)))form.append(key,value);return form;
}

export async function POST(request:Request){
  let back='/quan-tri';
  try{
    assertAllowed(request.headers.get('origin')===new URL(request.url).origin,'Yêu cầu không cùng nguồn.');
    assertAllowed(Number(request.headers.get('content-length')??0)<70000,'Biểu mẫu quá lớn.');
    await ensureSeed();const user=await viewer();assertAllowed(user,'Vui lòng đăng nhập trước.');
    const f=await readForm(request),action=field(f,'action',80),id=field(f,'id',100);
    const returnTo=field(f,'return_to',300);if(returnTo.startsWith('/')&&!returnTo.startsWith('//'))back=returnTo.split('?')[0];
    if(action==='bookmark'){
      const kind=field(f,'kind',20);assertAllowed(['content','tour'].includes(kind),'Loại mục không hợp lệ.');
      const target=kind==='content'?await content(id): (await publicTours()).find(t=>t.id===id);assertAllowed(target,'Mục chưa được công bố.');
      const old=await one('SELECT target_id FROM user_bookmarks WHERE user_id=? AND kind=? AND target_id=?',user.userId,kind,id);
      if(old)await run('DELETE FROM user_bookmarks WHERE user_id=? AND kind=? AND target_id=?',user.userId,kind,id);
      else await run('INSERT INTO user_bookmarks VALUES (?,?,?,?)',user.userId,kind,id,timestamp());
      return result(request,back,old?'Đã bỏ lưu.':'Đã lưu vào sổ tay.');
    }
    if(action==='progress'){
      const stopId=field(f,'stop_id',100),tour=(await publicTours()).find(t=>t.id===id);assertAllowed(tour,'Hành trình chưa được công bố.');
      assertAllowed(await one('SELECT id FROM tour_stops WHERE id=? AND tour_id=?',stopId,id),'Chặng không thuộc hành trình.');
      await run('INSERT INTO tour_progress VALUES (?,?,?,?) ON CONFLICT(user_id,tour_id) DO UPDATE SET stop_id=excluded.stop_id,updated_at=excluded.updated_at',user.userId,id,stopId,timestamp());
      return result(request,back,'Đã lưu chặng đang trải nghiệm.');
    }
    if(action==='submission'){
      back='/ky-uc-cong-dong';const title=required(field(f,'title',160)),body=required(field(f,'body',12000));
      const provenance=required(field(f,'provenance',2000));assertAllowed(checked(f,'storage_consent'),'Cần quyền lưu và xem xét đóng góp.');
      const bucket=Math.floor(Date.now()/3600000),key=`submission:${user.userId}:${bucket}`;
      const quota=await database().prepare(`INSERT INTO rate_limits (key,count,expires_at) VALUES (?,1,?)
        ON CONFLICT(key) DO UPDATE SET count=count+1 WHERE count<5 RETURNING count`).bind(key,(bucket+1)*3600000).first();
      assertAllowed(quota,'Bạn đã gửi 5 đóng góp trong giờ này. Vui lòng thử lại sau.');
      await run('DELETE FROM rate_limits WHERE expires_at<?',Date.now()-86400000);
      const newId=uid();await run(`INSERT INTO community_submissions
        (id,user_id,contributor_name,title,kind,body,provenance,storage_consent,publication_consent,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        newId,user.userId,user.displayName,title,field(f,'kind',60)||'memory',body,provenance,1,checked(f,'publication_consent')?1:0,timestamp());
      await log(user.userId,'submission.create',newId,{publicationConsent:checked(f,'publication_consent')});
      return result(request,back,'Đã nhận đóng góp. Tư liệu đang chờ biên tập và chưa được công bố.');
    }
    assertAllowed(canEdit(user.role),'Bạn không có quyền thao tác trong khu nghiên cứu.');
    if(action==='stage_prepared'){
      assertAllowed(canReview(user.role),'Cần biên tập viên đưa bản chuẩn bị vào hàng đợi.');
      assertAllowed(checked(f,'review_before_import'),'Cần xem bản chuẩn bị trước khi nhập nháp.');
      await stagePreparedArticle(database(),required(id),user.userId);
      return result(request,`/quan-tri/noi-dung/${id}`,'Đã nhập bản nháp, nguồn và metadata ảnh. Chưa chấp nhận bằng chứng hoặc công bố.');
    }
    if(action==='review_materials'){
      assertAllowed(canReview(user.role),'Chỉ biên tập viên được duyệt tư liệu.');
      assertAllowed(checked(f,'materials_checked'),'Cần xác nhận đã mở nguồn và kiểm tra tư liệu.');
      const c=await content(id,true);assertAllowed(c,'Không có hồ sơ.');
      const evidence=await contentCitations(id);assertAllowed(evidence.length&&evidence.every(e=>e.statement&&e.locator&&e.source_version&&!['library_catalog','book_notice'].includes(e.source_type)),'Còn nguồn đầu mối chưa đủ chứng minh.');
      const assets=await database().prepare('SELECT * FROM media_assets WHERE content_id=?').bind(id).all();
      for(const m of assets.results){
        assertAllowed(m.commercial_allowed===1&&typeof m.license_name==='string'&&typeof m.license_url==='string'&&permitsCommercialMedia(m.license_name,m.license_url),'Ảnh/âm thanh chưa có giấy phép phù hợp.');
        assertAllowed(m.author&&m.source_url&&m.modifications,'Thiếu tác giả, nguồn hoặc thay đổi tư liệu.');
        assertAllowed(typeof m.url==='string'&&(m.kind==='image'?imagePathAllowed(m.url):audioPathAllowed(m.url)),'Chỉ duyệt tài sản local đã được chuẩn bị và cấp quyền.');
      }
      const dialect=await one('SELECT * FROM dialect_entries WHERE content_id=?',id);
      assertAllowed(c.content_kind!=='dialect'||(dialect?.meaning&&dialect?.usage_context&&dialect?.example_note),'Mục từ còn thiếu nghĩa, ngữ cảnh hoặc xuất xứ ví dụ.');
      await batch([
        {sql:"UPDATE source_citations SET status='accepted',reviewer=?,reviewed_at=? WHERE content_id=?",params:[user.userId,timestamp(),id]},
        {sql:"UPDATE dialect_entries SET review_status='accepted',reviewer=?,reviewed_at=? WHERE content_id=?",params:[user.userId,timestamp(),id]},
        {sql:"UPDATE media_assets SET review_status='accepted',reviewer=?,reviewed_at=? WHERE content_id=?",params:[user.userId,timestamp(),id]},
      ]);await log(user.userId,'materials.accept',id,{evidence:evidence.length,media:assets.results.length});
      return result(request,back,'Đã chấp nhận phần tư liệu. Bài vẫn cần duyệt quyền và chủ động công bố.');
    }
    if(action==='save_content'){
      const old=id?await content(id,true):null;assertAllowed(!id||old,'Không tìm thấy hồ sơ.');
      const title=required(field(f,'title',160)),summary=field(f,'summary',500);
      const kind=field(f,'content_kind',30)||'general';assertAllowed(['general','place','custom','dialect'].includes(kind),'Loại hồ sơ không hợp lệ.');
      const previous=parseSections(old?.sections_json??'[]');const sections:ArticleSection[]=[];
      for(const [key,label] of Object.entries(sectionLabels)){const text=field(f,`section_${key}`,4000);if(text)sections.push({heading:label,kind:key as SectionKind,text,sourceIds:[...new Set(previous.filter(s=>s.kind===key).flatMap(s=>s.sourceIds))]});}
      let body=kind==='general'?field(f,'body',20000):sectionBody(sections);
      const intro=field(f,'introduction',1600),topic=field(f,'topic',80),scope=field(f,'scope_note',2500),textLicense=field(f,'text_license',150),textLicenseUrl=field(f,'text_license_url',1000);
      assertAllowed(!textLicenseUrl||safeUrl(textLicenseUrl),'URL giấy phép văn bản không hợp lệ.');
      const dialect=kind==='dialect'?{headword:required(field(f,'headword',100)),meaning:required(field(f,'meaning',1500)),context:required(field(f,'usage_context',1500)),example:required(field(f,'example',1000)),exampleNote:required(field(f,'example_note',1000)),region:required(field(f,'regional_scope',1000)),part:required(field(f,'part_of_speech',150)),audio:field(f,'audio_asset_id',150)||null}:null;
      if(dialect){body+='\n\n## Nghĩa\n\n'+dialect.meaning+'\n\n## Ví dụ\n\n'+dialect.example;if(dialect.audio)assertAllowed(await one("SELECT id FROM media_assets WHERE id=? AND content_id=? AND kind='audio' AND review_status='accepted'",dialect.audio,id),'Bản ghi chưa được duyệt cho mục từ này.');}
      const consent=checked(f,'storage_consent');assertAllowed(rightsCanStore(body+'\n'+summary+'\n'+intro,consent),'Xác nhận quyền lưu trước khi nhập nội dung văn bản.');
      const classification=field(f,'classification',60);assertAllowed(classes[classification],'Phân loại không hợp lệ.');
      const category=required(field(f,'category',60)),area=required(field(f,'historical_area',160)),community=required(field(f,'community',120));
      const time=timestamp(),newId=id||uid(),slug=old?.slug||`${slugify(title)}-${newId.slice(0,8)}`;
      const jobs=[];
      if(old){
        assertAllowed(Number(field(f,'revision',10))===old.revision,'Hồ sơ vừa được sửa ở phiên khác. Tải lại trước khi lưu.');
        jobs.push({sql:'INSERT INTO content_revisions VALUES (?,?,?,?,?,?)',params:[uid(),id,old.revision,JSON.stringify(old),user.userId,time]});
        jobs.push({sql:`UPDATE cultural_contents SET title=?,category=?,historical_area=?,community=?,classification=?,summary=?,body=?,storage_consent=?,
          revision=revision+1,approved_revision=0,status='draft',publish_rights=0,rights_reviewer=NULL,reviewed_by=NULL,updated_at=? WHERE id=? AND revision=?`,
          params:[title,category,area,community,classification,summary,body,consent?1:0,time,id,old.revision]});
      }else jobs.push({sql:`INSERT INTO cultural_contents (id,slug,title,category,historical_area,community,classification,summary,body,storage_consent,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,params:[newId,slug,title,category,area,community,classification,summary,body,consent?1:0,time,time]});
      jobs.push({sql:'UPDATE cultural_contents SET content_kind=?,introduction=?,topic=?,scope_note=?,sections_json=?,text_license=?,text_license_url=? WHERE id=?',params:[kind,intro,topic,scope,JSON.stringify(sections),textLicense,textLicenseUrl,newId]});
      if(dialect)jobs.push({sql:`INSERT INTO dialect_entries (content_id,headword,meaning,usage_context,example,example_note,regional_scope,part_of_speech,audio_asset_id,review_status)
        VALUES (?,?,?,?,?,?,?,?,?,'pending') ON CONFLICT(content_id) DO UPDATE SET headword=excluded.headword,meaning=excluded.meaning,usage_context=excluded.usage_context,example=excluded.example,example_note=excluded.example_note,regional_scope=excluded.regional_scope,part_of_speech=excluded.part_of_speech,audio_asset_id=excluded.audio_asset_id,review_status='pending',reviewer=NULL,reviewed_at=NULL`,
        params:[newId,dialect.headword,dialect.meaning,dialect.context,dialect.example,dialect.exampleNote,dialect.region,dialect.part,dialect.audio]});
      await batch(jobs);await log(user.userId,'content.save',newId,{revision:(old?.revision??0)+1});
      return result(request,`/quan-tri/noi-dung/${newId}`,'Đã lưu bản nháp. Bản sửa cần được duyệt lại.');
    }
    if(action==='citation'){
      assertAllowed(canReview(user.role),'Biên tập viên cần duyệt bằng chứng.');
      const c=await content(id,true);assertAllowed(c,'Không tìm thấy hồ sơ.');
      const sourceId=required(field(f,'source_id',100)),source=await one('SELECT * FROM source_registry WHERE id=?',sourceId);assertAllowed(source,'Nguồn chưa đăng ký.');
      const statement=required(field(f,'statement',1500)),locator=required(field(f,'locator',500)),version=required(field(f,'source_version',200));
      const accepted=checked(f,'accepted'),kind=field(f,'claim_kind',80)||'fact';
      assertAllowed(['fact','register_entry','hypothesis','variant','quotation','etymology','historical_interpretation'].includes(kind),'Loại phát biểu không hợp lệ.');
      assertAllowed(!accepted||!['library_catalog','book_notice'].includes(source.source_type),'Catalog không chứng minh nội dung sách. Hãy đăng ký tài liệu gốc đã đọc hợp pháp.');
      const note=required(field(f,'note',1500));const citationId=field(f,'citation_id',100)||uid();
      const old=await one('SELECT content_id FROM source_citations WHERE id=?',citationId);assertAllowed(!old||old.content_id===id,'Bằng chứng không thuộc hồ sơ này.');
      await batch([
        {sql:`INSERT INTO source_citations (id,content_id,source_id,statement,claim_kind,locator,source_version,relation,status,review_note,reviewer,reviewed_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET source_id=excluded.source_id,statement=excluded.statement,claim_kind=excluded.claim_kind,
          locator=excluded.locator,source_version=excluded.source_version,relation=excluded.relation,status=excluded.status,review_note=excluded.review_note,reviewer=excluded.reviewer,reviewed_at=excluded.reviewed_at`,
         params:[citationId,id,sourceId,statement,kind,locator,version,'supports',accepted?'accepted':'pending',note,accepted?user.userId:null,accepted?timestamp():null]},
        {sql:"UPDATE cultural_contents SET revision=revision+1,approved_revision=0,status='draft',reviewed_by=NULL WHERE id=?",params:[id]},
      ]);await log(user.userId,'citation.review',id,{citationId,accepted,sourceId});return result(request,back,'Đã lưu chứng minh; hồ sơ cần duyệt biên tập lại.');
    }
    if(action==='review_content'){
      assertAllowed(canReview(user.role),'Bạn không có quyền duyệt công bố.');
      const c=await content(id,true);assertAllowed(c,'Không tìm thấy hồ sơ.');
      assertAllowed(Number(field(f,'revision',10))===c.revision,'Phiên bản đã thay đổi. Hãy tải lại và đối chiếu.');
      assertAllowed(c.storage_consent===1&&c.body.trim(),'Cần nội dung có quyền lưu.');
      assertAllowed(checked(f,'publish_rights'),'Chưa xác nhận quyền công bố toàn bộ nội dung.');
      const basis=required(field(f,'rights_basis',2000));assertAllowed(checked(f,'claims_complete'),'Cần xác nhận mọi phát biểu đã có chứng minh.');
      const citations=await contentCitations(id);assertAllowed(citations.length&&citations.every(e=>e.status==='accepted'&&e.relation==='supports'&&e.statement&&e.locator&&e.source_version&&e.reviewer),'Mọi nguồn đầu mối phải được đối chiếu thành bằng chứng trước khi duyệt.');
      assertAllowed(['official_register','source_supported'].includes(c.classification),'Cần phân loại phù hợp với bằng chứng đã đối chiếu.');
      await batch([
        {sql:'UPDATE cultural_contents SET publish_rights=1,rights_basis=?,rights_reviewer=?,approved_revision=revision,reviewed_by=?,reviewed_at=?,updated_at=? WHERE id=? AND revision=?',params:[basis,user.userId,user.userId,timestamp(),timestamp(),id,c.revision]},
      ]);const ready=await one(`SELECT c.id FROM cultural_contents c WHERE c.id=? AND ${eligibilitySQL}`,id);
      if(!ready){await run('UPDATE cultural_contents SET approved_revision=0 WHERE id=?',id);throw new Error('Hồ sơ còn thiếu điều kiện: kiểm tra nguồn danh mục, quyền hoặc tọa độ.');}
      const publish=checked(f,'publish');await run('UPDATE cultural_contents SET status=? WHERE id=?',publish?'published':'approved',id);
      await log(user.userId,publish?'content.publish':'content.approve',id,{revision:c.revision,rightsBasis:basis});
      return result(request,back,publish?'Đã chủ động công bố phiên bản được duyệt.':'Đã duyệt; chưa công bố.');
    }
    if(action==='unpublish'){
      assertAllowed(canReview(user.role),'Bạn không có quyền gỡ công bố.');
      await run("UPDATE cultural_contents SET status='draft',approved_revision=0,reviewed_by=NULL WHERE id=?",id);
      await log(user.userId,'content.unpublish',id,{});return result(request,back,'Đã chuyển về bản nháp.');
    }
    if(action==='source'){
      const newId=id||uid(),url=safeUrl(required(field(f,'url',2000)));assertAllowed(url,'Nguồn cần URL HTTPS hợp lệ.');
      await run(`INSERT INTO source_registry (id,name,source_type,url,topics,format,license_reported,next_action,notes,input_locator,batch_hash)
        VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,url=excluded.url,source_type=excluded.source_type,topics=excluded.topics,format=excluded.format,license_reported=excluded.license_reported,notes=excluded.notes`,
        newId,required(field(f,'name',200)),required(field(f,'source_type',80)),url,field(f,'topics',200),field(f,'format',60)||'HTML',
        field(f,'license',150)||'unknown','manual_review',field(f,'notes',2000),'CMS','manual');
      await batch([
        {sql:"UPDATE source_citations SET status='pending',reviewer=NULL,reviewed_at=NULL WHERE source_id=?",params:[newId]},
        {sql:"UPDATE cultural_contents SET approved_revision=0,status='draft',reviewed_by=NULL WHERE id IN (SELECT content_id FROM source_citations WHERE source_id=?)",params:[newId]},
      ]);
      await log(user.userId,'source.save',newId,{});return result(request,'/quan-tri/nguon','Đã lưu metadata nguồn; chưa cấp quyền nội dung.');
    }
    if(action==='coordinates'){
      assertAllowed(canReview(user.role),'Cần biên tập viên đối chiếu tọa độ.');
      const latText=field(f,'latitude',30),lonText=field(f,'longitude',30),lat=latText?Number(latText):null,lon=lonText?Number(lonText):null;
      assertAllowed(validCoordinates(lat,lon),'Cần cặp tọa độ WGS84 hợp lệ.');
      const basis=required(field(f,'geo_basis',2000));assertAllowed(checked(f,'geo_reviewed'),'Cần đối chiếu đối tượng OSM, ranh giới và quyền sử dụng.');
      await run("UPDATE cultural_contents SET latitude=?,longitude=?,geo_reviewed=1,geo_basis=?,revision=revision+1,approved_revision=0,status='draft' WHERE id=?",lat,lon,basis,id);
      await log(user.userId,'coordinates.review',id,{lat,lon,basis});return result(request,back,'Đã ghi tọa độ được đối chiếu; cần duyệt bài lại.');
    }
    if(action==='review_submission'){
      assertAllowed(canReview(user.role),'Bạn không có quyền duyệt đóng góp.');
      const decision=field(f,'decision',30);assertAllowed(['accepted','rejected'].includes(decision),'Quyết định không hợp lệ.');
      await run('UPDATE community_submissions SET status=?,reviewer=?,review_note=? WHERE id=?',decision,user.userId,required(field(f,'note',1500)),id);
      await log(user.userId,'submission.review',id,{decision});return result(request,back,'Đã ghi nhận đánh giá. Đóng góp không tự động thành bài công bố.');
    }
    if(action==='role'){
      assertAllowed(canAdmin(user.role),'Chỉ quản trị viên được phân quyền.');
      const role=field(f,'role',30);assertAllowed(['admin','editor','researcher','contributor','visitor'].includes(role),'Vai trò không hợp lệ.');
      assertAllowed(id!==user.userId||role==='admin','Không tự hạ quyền quản trị viên đang thao tác.');
      await run('INSERT INTO user_roles VALUES (?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET role=excluded.role,name=excluded.name',required(id),role,field(f,'name',160)||id,timestamp());
      await log(user.userId,'role.assign',id,{role});return result(request,back,'Đã cập nhật vai trò phía máy chủ.');
    }
    if(action==='tour'){
      assertAllowed(canReview(user.role),'Bạn không có quyền quản lý hành trình.');
      const newId=id||uid(),title=required(field(f,'title',160)),kind=field(f,'kind',30);
      assertAllowed(['physical','digital','memory'].includes(kind),'Loại hành trình không hợp lệ.');
      const stopIds=field(f,'stops',2000).split(',').map(x=>x.trim()).filter(Boolean);assertAllowed(new Set(stopIds).size===stopIds.length,'Chặng bị trùng.');
      const publishing=checked(f,'publish');const publicRows=await publicContents();
      if(publishing){assertAllowed(stopIds.length>0,'Hành trình cần ít nhất một chặng đã công bố.');
        assertAllowed(stopIds.every(stop=>publicRows.some(c=>c.id===stop&&(kind!=='physical'||(c.latitude!==null&&c.geo_reviewed===1)))),'Chặng chưa công bố hoặc chưa xác minh vị trí.');}
      for(const stop of stopIds)assertAllowed(await one('SELECT id FROM cultural_contents WHERE id=?',stop),'Có mã nội dung không tồn tại.');
      const existing=await one('SELECT slug FROM tours WHERE id=?',newId);
      const jobs=[{sql:`INSERT INTO tours (id,slug,title,kind,description,status,reviewed_by,created_at) VALUES (?,?,?,?,?,?,?,?)
        ON CONFLICT(id) DO UPDATE SET title=excluded.title,kind=excluded.kind,description=excluded.description,status=excluded.status,reviewed_by=excluded.reviewed_by`,
        params:[newId,existing?.slug||`${slugify(title)}-${newId.slice(0,6)}`,title,kind,field(f,'description',2000),publishing?'published':'draft',publishing?user.userId:null,timestamp()]},
        {sql:'DELETE FROM tour_progress WHERE tour_id=?',params:[newId]},{sql:'DELETE FROM tour_stops WHERE tour_id=?',params:[newId]}];
      stopIds.forEach((cid,i)=>jobs.push({sql:'INSERT INTO tour_stops VALUES (?,?,?,?)',params:[uid(),newId,cid,i+1]}));
      await batch(jobs);await log(user.userId,'tour.save',newId,{publishing,stops:stopIds});return result(request,back,'Đã lưu hành trình và thứ tự chặng.');
    }
    if(action==='relationship'){
      assertAllowed(canReview(user.role),'Bạn không có quyền duyệt quan hệ tri thức.');
      const from=required(field(f,'from_id',100)),to=required(field(f,'to_id',100));assertAllowed(from!==to,'Chọn hai hồ sơ khác nhau.');
      await run('INSERT INTO entity_relationships VALUES (?,?,?,?,?,?,?,?,?)',uid(),from,to,required(field(f,'kind',120)),required(field(f,'source_id',100)),required(field(f,'locator',500)),checked(f,'accepted')?'accepted':'pending',required(field(f,'note',1200)),user.userId);
      await log(user.userId,'relationship.create',from,{to});return result(request,back,'Đã lưu quan hệ và dẫn chứng.');
    }
    throw new Error('Thao tác không được hỗ trợ.');
  }catch(error){return result(request,back,error instanceof Error?error.message:'Có lỗi xảy ra. Vui lòng thử lại.',true);}
}
