"""HTTP integration test, localhost only. Creates labeled fixtures; emits exact cleanup SQL.

Run before the append-only audit migration on a disposable local preview database.
Never run this test against a hosted Site or a database with user edits to retain.
"""
import http.cookiejar
import json
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

BASE='http://127.0.0.1:5173'
results=[]
created=[]
class Inputs(HTMLParser):
    def __init__(self):super().__init__();self.values={}
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        if tag=='input' and d.get('name'):self.values.setdefault(d['name'],d.get('value',''))

def client():return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
def get(op,path,headers=None):
    try:
        with op.open(urllib.request.Request(BASE+path,headers=headers or {}),timeout=50) as r:return r.status,r.url,r.read().decode()
    except urllib.error.HTTPError as e:return e.code,e.url,e.read().decode()
def post(op,data,origin=BASE,headers=None):
    req=urllib.request.Request(BASE+'/api/action',data=urllib.parse.urlencode(data).encode(),headers={'Origin':origin,'Content-Type':'application/x-www-form-urlencoded',**(headers or {})})
    try:
        with op.open(req,timeout=50) as r:return r.url,r.read().decode()
    except urllib.error.HTTPError as e:return e.url+'?error=HTTP_'+str(e.code),e.read().decode()
def check(label,condition):
    results.append({'test':label,'passed':bool(condition)})
    if not condition:raise AssertionError(label)
def revision(op,id):
    _,_,html=get(op,'/quan-tri/noi-dung/'+id);p=Inputs();p.feed(html);return p.values['revision']

admin=client();anon=client()
try:
    status,_,html=get(anon,'/');check('home serves Vietnamese hero',status==200 and 'Một vùng đất.' in html)
    for path in ['/kham-pha','/chuyen-muc/nep-xua','/tim-kiem?q=dau+sau','/nguon-tu-lieu','/ban-do','/hanh-trinh','/ky-uc-cong-dong','/hoi-dap','/ve-du-an','/so-tay']:
        status,_,_=get(anon,path);check('route '+path,status==200)
    status,_,body=get(anon,'/api/catalog');catalog=json.loads(body)
    check('draft research stays out of public catalog',catalog['items']==[] and catalog['stats']=={'total':40,'eligible':0,'published':0,'sources':20})
    status,_,_=get(anon,'/ho-so/E014');check('draft detail cannot be read publicly',status==404)
    _,_,html=get(anon,'/quan-tri/noi-dung');check('anonymous admin sees sign-in, not drafts','Đăng nhập bằng ChatGPT' in html and 'Nghệ thuật Rô Băm' not in html)
    _,_,html=get(admin,'/signin-with-chatgpt?return_to=/quan-tri');check('loopback SIWC login establishes admin','Gìn giữ bắt đầu' in html)
    for path in ['/quan-tri/noi-dung','/quan-tri/noi-dung/E014','/quan-tri/nguon','/quan-tri/hanh-trinh','/quan-tri/lien-ket','/quan-tri/cong-dong','/quan-tri/lich-su','/quan-tri/phan-quyen']:
        status,_,html=get(admin,path);check('protected route '+path,status==200 and 'Cơ sở dữ liệu chưa sẵn sàng' not in html)
    fixture={'action':'save_content','title':'Dữ liệu minh họa — HTTP integration fixture','category':'di_san','historical_area':'Dữ liệu minh họa','community':'Dữ liệu minh họa','classification':'source_supported','summary':'Dữ liệu minh họa kỹ thuật.','body':'Dữ liệu minh họa. Chỉ kiểm thử phần mềm, không phải tư liệu văn hóa.','return_to':'/quan-tri'}
    url,_=post(admin,fixture);check('storage consent is required','error=' in url)
    url,_=post(admin,{**fixture,'storage_consent':'on'},origin='https://attacker.invalid');check('cross-origin write rejected','error=' in url)
    url,_=post(anon,{**fixture,'storage_consent':'on'});check('anonymous write rejected','error=' in url)
    visitor={'oai-authenticated-user-id':'integration_visitor','oai-authenticated-user-email':'visitor@sites.test'}
    url,_=post(anon,{**fixture,'storage_consent':'on'},headers=visitor);check('visitor cannot edit cultural contents','error=' in url)
    url,_=post(admin,{**fixture,'storage_consent':'on'});check('admin can persist draft','error=' not in url)
    cid=urllib.parse.urlsplit(url).path.rsplit('/',1)[1];created.append(cid)
    check('draft exists in CMS',get(admin,'/quan-tri/noi-dung/'+cid)[0]==200)
    url,_=post(admin,{'action':'review_content','id':cid,'revision':revision(admin,cid),'rights_basis':'Synthetic test permission only','publish_rights':'on','claims_complete':'on','publish':'on','return_to':'/quan-tri/noi-dung/'+cid})
    check('publication without citations rejected','error=' in url)
    evidence={'action':'citation','id':cid,'source_id':'S08','statement':'Dữ liệu minh họa kiểm thử.','locator':'Synthetic test locator','source_version':'Synthetic test revision','note':'Fixture only; not cultural evidence','accepted':'on','return_to':'/quan-tri/noi-dung/'+cid}
    url,_=post(admin,evidence);check('library catalog cannot prove book contents','error=' in url)
    url,_=post(admin,{**evidence,'source_id':'S01'});check('reviewer can record synthetic fixture evidence','error=' not in url)
    url,_=post(admin,{'action':'review_content','id':cid,'revision':revision(admin,cid),'rights_basis':'Dữ liệu minh họa: synthetic test permission','publish_rights':'on','claims_complete':'on','publish':'on','return_to':'/quan-tri/noi-dung/'+cid})
    check('explicit eligible fixture publication works','error=' not in url)
    catalog=json.loads(get(anon,'/api/catalog')[2]);published=next(x for x in catalog['items'] if x['id']==cid)
    check('public catalog only returns eligible fixture',len(catalog['items'])==1 and published['title'].startswith('Dữ liệu minh họa'))
    check('published detail serves citations',get(anon,'/ho-so/'+published['slug'])[0]==200)
    url,_=post(admin,{'action':'bookmark','id':cid,'kind':'content','return_to':'/so-tay'});check('bookmark persists by user','error=' not in url and 'Dữ liệu minh họa' in get(admin,'/so-tay')[2])
    tour={'action':'tour','title':'Dữ liệu minh họa — digital journey fixture','kind':'digital','stops':cid,'description':'Dữ liệu minh họa kiểm thử.','publish':'on','return_to':'/quan-tri/hanh-trinh'}
    url,_=post(admin,{**tour,'kind':'physical'});check('physical journey needs reviewed coordinates','error=' in url)
    url,_=post(admin,tour);check('digital journey can link published contents','error=' not in url)
    url,_=post(admin,{'action':'submission','title':'Dữ liệu minh họa — submission fixture','kind':'memory','body':'Dữ liệu minh họa kiểm thử phần mềm.','provenance':'Synthetic test fixture created locally','storage_consent':'on','return_to':'/ky-uc-cong-dong'})
    check('community submission remains pending','error=' not in url and 'Chờ duyệt' in get(admin,'/ky-uc-cong-dong')[2])
    url,_=post(admin,{'action':'unpublish','id':cid,'return_to':'/quan-tri/noi-dung/'+cid});check('unpublishing removes public access',json.loads(get(anon,'/api/catalog')[2])['items']==[])
finally:
    out=Path('outputs');out.mkdir(exist_ok=True)
    (out/'http-integration.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    if created:
        # Exact IDs only. This is the disposable LOCAL preview, before append-only migration.
        ids=','.join("'"+x.replace("'","''")+"'" for x in created)
        cleanup=f'''DELETE FROM review_logs WHERE target_id IN ({ids}) OR target_id IN (SELECT id FROM tours WHERE title='Dữ liệu minh họa — digital journey fixture') OR target_id IN (SELECT id FROM community_submissions WHERE title='Dữ liệu minh họa — submission fixture');
DELETE FROM tour_progress WHERE tour_id IN (SELECT id FROM tours WHERE title LIKE 'Dữ liệu minh họa — %fixture');
DELETE FROM tour_stops WHERE tour_id IN (SELECT id FROM tours WHERE title LIKE 'Dữ liệu minh họa — %fixture');
DELETE FROM tours WHERE title LIKE 'Dữ liệu minh họa — %fixture';
DELETE FROM user_bookmarks WHERE target_id IN ({ids});
DELETE FROM source_citations WHERE content_id IN ({ids});
DELETE FROM content_revisions WHERE content_id IN ({ids});
DELETE FROM cultural_contents WHERE id IN ({ids});
DELETE FROM community_submissions WHERE title='Dữ liệu minh họa — submission fixture';
'''
        (out/'local-fixture-cleanup.sql').write_text(cleanup,encoding='utf-8')
    print(json.dumps({'passed':sum(x['passed'] for x in results),'total':len(results),'created_fixture_ids':created},ensure_ascii=False))
