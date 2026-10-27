import { NextResponse } from 'next/server';
import { batch,content,contentCitations,database,ensureSeed,log,one,publicContents,publicTours,run,timestamp,uid,viewer } from '@/lib/data';
import { assertAllowed,canAdmin,canEdit,canReview,eligibilitySQL,rightsCanStore,validCoordinates } from '@/lib/policy';
import { classes,safeUrl,slugify } from '@/lib/catalog';

export const dynamic='force-dynamic';
function field(f:FormData,key:string,max=2000){const v=String(f.get(key)??'').trim();assertAllowed(v.length<=max,`Trường ${key} quá dài.`);return v;}
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
    if(action==='save_content'){
      const old=id?await content(id,true):null;assertAllowed(!id||old,'Không tìm thấy hồ sơ.');
      const title=required(field(f,'title',160)),body=field(f,'body',20000),summary=field(f,'summary',500);
      const consent=checked(f,'storage_consent');assertAllowed(rightsCanStore(body+'\n'+summary,consent),'Xác nhận quyền lưu trước khi nhập nội dung văn bản.');
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
