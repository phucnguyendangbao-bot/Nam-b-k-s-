"""Prepare a reviewed content snapshot. No remote writes or source full texts."""
import json
import unicodedata
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
research=json.loads((ROOT/'data/provenance/customs-lexicon-research.json').read_text(encoding='utf-8'))
commons=json.loads((ROOT/'data/provenance/commons-manifest.json').read_text(encoding='utf-8'))
sources=[s for s in research['sources'] if s['id']!='R-TANG-HISTORY']
sources += [
 {'id':'S13','name':'Một vài suy nghĩ về địa danh Đầu Sấu — Báo Cần Thơ','url':'https://baocantho.com.vn/mot-vai-suy-nghi-ve-dia-danh-dau-sau-a20565.html','source_type':'journalism','source_version':'Bản web đối chiếu 2026-10-27','author':'Hoài Phương','rights':'Chỉ diễn giải ngắn các giả thuyết có quy thuộc; không sao chép toàn văn hoặc ảnh báo.'},
 {'id':'R-CAIRANG-ND','name':'Bâng khuâng Cái Răng — Nhân Dân','url':'https://nhandan.vn/bang-khuang-cai-rang-post186885.html','source_type':'journalism_article','source_version':'2013-10-23; đọc 2026-10-27','author':'Báo Nhân Dân','rights':'Chỉ tóm lược ngắn có quy thuộc; không sao chép ảnh hoặc toàn văn.'},
 {'id':'R-BINHTHUY-VNAT','name':'Nhà cổ Bình Thủy — Cơ sở dữ liệu ngành Du lịch','url':'https://csdl.vietnamtourism.gov.vn/dest/?item=145','source_type':'official_dataset','source_version':'Trang điểm đến item=145, đọc 2026-10-27','author':'Cơ sở dữ liệu ngành Du lịch Việt Nam','rights':'Chỉ diễn giải ngắn dữ kiện; ảnh Commons có giấy phép riêng.'},
 {'id':'R-BINHTHUY-CT','name':'Nhà cổ Bình Thủy — Cổng du lịch Cần Thơ','url':'https://canthotourism.vn/vi/nhacobinhthuy','source_type':'official_article','source_version':'Trang điểm đến, đọc 2026-10-27','author':'Cổng du lịch Cần Thơ / Sở Văn hóa, Thể thao và Du lịch','rights':'Chỉ metadata và diễn giải mới; không lấy ảnh của trang.'},
 {'id':'R-MARKET-BVHTTDL','name':'Bàn giải pháp bảo tồn và phát triển Chợ nổi Cái Răng — Bộ VHTTDL','url':'https://bvhttdl.gov.vn/ban-giai-phap-bao-ton-va-phat-trien-cho-noi-cai-rang-tp-can-tho-20190709110942916.htm','source_type':'official_article','source_version':'2019-07-09; đọc 2026-10-27','author':'Như Thanh (tổng hợp), Cổng thông tin Bộ VHTTDL','rights':'Diễn giải ngắn về nội dung đề án; không lấy ảnh.'},
 {'id':'R-MARKET-CONGBAO','name':'Quyết định 1189/QĐ-UBND, Công báo Cần Thơ 45+46 (2024), trang 27','url':'https://congbao.cantho.gov.vn/tmp/docga_18843922_page27.pdf','source_type':'official_register','source_version':'Quyết định 29-05-2024; Công báo 21-06-2024, trang 27','author':'UBND thành phố Cần Thơ','rights':'Dẫn dữ kiện văn bản; không sao chép toàn văn PDF.'},
]
articles=[]
for a in research['custom_articles']:
 if a['recommended_status']=='draft':continue
 articles.append({'id':a['id'],'title':a['title'],'category':a['category'],'kind':'custom',
  'topic':'wedding' if a['id']=='E001' else 'anniversary','historical_area':'Nam Bộ' if a['id']=='E001' else 'Miền Tây theo tư liệu',
  'community':a['community'],'summary':a['intro'],'introduction':a['intro'],'scope_note':a['scope_note'],
  'sections':[{'heading':s['heading'],'kind':'observed_practice' if s['kind']=='practiced_custom' else s['kind'],'text':s['text'],'sourceIds':s['source_ids']} for s in a['sections']],
  'claims':[{'source_id':c['source_id'],'statement':c['claim'],'locator':c['locator'],'kind':'fact' if c['kind']!='folk_belief_commentary' else 'variant'} for c in a['claims']],
  'rights_basis':a['rights_basis'],'media_keys':['trau-cau-khuong-viet-ha'] if a['id']=='E001' else [],'publish':True})

for d in research['dictionary_entries']:
 topic='verb' if d['term']=='mần' else 'particle' if d['term']=='hổng' else 'pronoun'
 articles.append({'id':d['id'],'title':d['term'],'category':'ngon_ngu','kind':'dialect','topic':topic,'historical_area':'Nam Bộ','community':'Nhiều cộng đồng sử dụng tiếng Việt',
  'summary':d['meaning'],'introduction':d['meaning'],'scope_note':d['scope_note'],
  'sections':[{'heading':'Nghĩa được chọn và ngữ cảnh','kind':'explanation','text':d['context'],'sourceIds':[d['source_id']]}],
  'claims':[{'source_id':d['source_id'],'statement':d['meaning'],'locator':d['source_locator'],'kind':'fact'}],
  'dialect':{'headword':d['term'],'meaning':d['meaning'],'usage_context':d['context'],'example':d['example'],'example_note':d['example_label'],
             'regional_scope':d['scope_note'],'part_of_speech':d['part_of_speech'],'audio_asset_id':None},
  'rights_basis':d['attribution']+' '+d['changes'],'text_license':d['license'],'text_license_url':d['license_url'],'media_keys':[],'publish':True})

def sec(heading,kind,text,source):return {'heading':heading,'kind':kind,'text':text,'sourceIds':source}
articles += [
 {'id':'E020','title':'Đầu Sấu: những giả thuyết về một tên đất','category':'dia_danh','kind':'place','topic':'toponym','historical_area':'Cần Thơ cũ','community':'Cộng đồng địa phương theo tư liệu',
  'summary':'Một tên đất được đọc qua nhiều cách giải thích, thay vì chọn một truyền thuyết làm đáp án duy nhất.',
  'introduction':'Bài khảo cứu của Hoài Phương trên Báo Cần Thơ nêu nhiều giả thuyết về Đầu Sấu và chưa xác định được thời điểm tên gọi ra đời.',
  'scope_note':'Hồ sơ xác nhận các cách giải thích đã được tác giả ghi nhận; không xác nhận giả thuyết nào là nguồn gốc cuối cùng.',
  'sections':[
   sec('Ba hướng lý giải','hypothesis','Tác giả đặt ra ba khả năng: ký ức về việc diệt sấu dữ; nơi mổ và bán thịt sấu ở vàm; hoặc sự kết hợp giữa nhiều sấu và hoạt động mua bán. Đây là các giả thuyết trong bài, chưa phải kết luận lịch sử.',['S13']),
   sec('Truyện kể và giới hạn chứng minh','folk_belief','Bài báo còn ghi một truyện dân gian nối Đầu Sấu, Cái Răng và Cái Da với các phần thân cá sấu. Lời kể này không chứng minh niên đại hay nguồn gốc tên đất.',['S13']),
   sec('Điều còn để ngỏ','editorial_note','Cần tiếp tục đối chiếu địa bạ và văn bản hành chính cũ. Không suy ra nguồn gốc địa danh chỉ từ việc tìm thấy xương cá sấu.',['S13'])],
  'claims':[{'source_id':'S13','statement':'Hoài Phương nêu ba giả thuyết và phân biệt truyện kể với căn cứ xác định tên đất.','locator':'Mục Địa danh Đầu Sấu ra đời khi nào?; ba giả thuyết và hai đoạn kết; tác giả Hoài Phương.','kind':'hypothesis'}],
  'rights_basis':'Bản tóm lược mới và ngắn, dẫn đúng quan điểm tác giả; không tái bản lời văn hoặc ảnh báo.','media_keys':[],'publish':True},
 {'id':'E021','title':'Cái Răng: tên gọi, cà ràng và chuyện kể','category':'dia_danh','kind':'place','topic':'toponym','historical_area':'Cần Thơ cũ','community':'Các cách giải thích được báo chí ghi lại',
  'summary':'Phân biệt cách giải thích gắn với tiếng Khmer và giai thoại cá sấu khi đọc tên Cái Răng.',
  'introduction':'Bài Bâng khuâng Cái Răng của Nhân Dân năm 2013 ghi lại cả một cách giải thích ngôn ngữ và giai thoại dân gian.',
  'scope_note':'Chưa đối chiếu trực tiếp ấn bản Tự vị tiếng nói miền Nam được dẫn. Không xem thuật lại của báo là chứng minh từ nguyên duy nhất.',
  'sections':[
   sec('Cách giải thích gắn với cà ràng','hypothesis','Bài báo thuật lại quan điểm của Vương Hồng Sển: Cái Răng có liên hệ với tiếng Khmer karan, chỉ cà ràng, một loại bếp đất. Câu chuyện buôn bán vật dụng này được dùng để giải thích sự biến đổi tên gọi.',['R-CAIRANG-ND']),
   sec('Một giai thoại khác','folk_belief','Nguồn cũng ghi lời kể gắn tên đất với răng của một con cá sấu lớn. Đó là giai thoại được truyền tụng, không phải dữ kiện xác lập nguyên nhân đặt tên.',['R-CAIRANG-ND'])],
  'claims':[{'source_id':'R-CAIRANG-ND','statement':'Bài báo thuật lại cách giải thích cà ràng và giai thoại cá sấu, không cung cấp kết luận độc lập về từ nguyên.','locator':'Mục 1, ba đoạn đầu sau ảnh Chợ nổi Cái Răng; bài ngày 23-10-2013.','kind':'hypothesis'}],
  'rights_basis':'Diễn giải mới ngắn có quy thuộc; không dùng lời văn dài hay ảnh của Nhân Dân.','media_keys':['cai-rang-market-dalbera'],'publish':True},
 {'id':'NBS-BINH-THUY','title':'Nhà cổ Bình Thủy: đọc kiến trúc và nếp nhà','category':'dia_danh','kind':'place','topic':'architecture','historical_area':'Cần Thơ cũ','community':'Gia tộc họ Dương theo tư liệu',
  'summary':'Tìm hiểu nhà cổ của gia đình họ Dương qua hồ sơ du lịch và các chi tiết không gian được ghi nhận.',
  'introduction':'Nhà cổ Bình Thủy được cơ sở dữ liệu du lịch giới thiệu trên đường Bùi Hữu Nghĩa, gắn với gia đình họ Dương.',
  'scope_note':'Tên đơn vị hành chính được giữ theo từng nguồn. Chưa cung cấp giờ mở cửa, vé, tuyến đi hoặc tọa độ được đối chiếu.',
  'sections':[
   sec('Mốc tư liệu và hình thức ngôi nhà','documented_history','Cơ sở dữ liệu ngành Du lịch ghi mốc xây dựng 1870 và mô tả ngôi nhà năm gian, hai mái, có ảnh hưởng kiến trúc Pháp. Mốc này không tự cho biết mọi lần mở rộng hay sửa chữa đã kết thúc khi nào.',['R-BINHTHUY-VNAT']),
   sec('Không gian sống và thờ tự','explanation','Hồ sơ mô tả sân vườn, tiền sảnh và khu vực đặt bàn thờ tổ tiên. Có thể đọc ngôi nhà qua cả không gian tiếp khách lẫn nếp thờ tự, thay vì chỉ nhìn mặt tiền.',['R-BINHTHUY-VNAT']),
   sec('Một lớp ký ức điện ảnh','documented_history','Cổng du lịch Cần Thơ ghi ngôi nhà từng xuất hiện trong các phim Người đẹp Tây Đô, Những nẻo đường phù sa và Người tình.',['R-BINHTHUY-CT'])],
  'claims':[
   {'source_id':'R-BINHTHUY-VNAT','statement':'Hồ sơ điểm đến ghi gia đình họ Dương, mốc 1870, nhà năm gian và không gian thờ tổ tiên.','locator':'Nhà cổ Bình Thủy: đoạn Đặc điểm, kiến trúc và đoạn Giữa tiền sảnh.','kind':'fact'},
   {'source_id':'R-BINHTHUY-CT','statement':'Trang giới thiệu nêu các phim đã dùng ngôi nhà làm bối cảnh.','locator':'Giới thiệu, đoạn Nơi đây được chọn làm bối cảnh.','kind':'fact'}],
  'rights_basis':'Tóm lược mới các dữ kiện có dẫn nguồn; ảnh Daaé thuộc public domain, ảnh Thuydaonguyen theo CC BY 3.0, ghi riêng tác giả và thay đổi.','media_keys':['binh-thuy-house-daae','binh-thuy-house-thuydaonguyen'],'publish':True},
 {'id':'NBS-CHO-NOI','title':'Chợ nổi Cái Răng: một không gian văn hóa sông nước','category':'dia_danh','kind':'place','topic':'floating_market','historical_area':'Cần Thơ cũ','community':'Cộng đồng giao thương trên sông theo nguồn',
  'summary':'Đọc chợ nổi qua tư liệu về bảo tồn văn hóa, thay vì xem đây chỉ là một điểm chụp ảnh.',
  'introduction':'Công báo Cần Thơ năm 2024 gọi Văn hóa Chợ nổi Cái Răng là di sản văn hóa phi vật thể quốc gia và dẫn Quyết định 829/QĐ-BVHTTDL ngày 10-3-2016.',
  'scope_note':'Tư liệu 2019 và 2024 không xác nhận quy mô buôn bán hoặc dịch vụ tại thời điểm bạn đến. Ảnh Commons chụp năm 2011 là ảnh tư liệu, không phải ảnh hiện trạng 2026.',
  'sections':[
   sec('Dấu mốc trong văn bản','documented_history','Quyết định 1189/QĐ-UBND ngày 29-5-2024 kiện toàn Ban Quản lý công tác bảo tồn và phát huy giá trị di sản này. Đây là căn cứ văn bản cho tình trạng được ghi nhận, không phải chứng minh một niên đại hình thành chợ.',['R-MARKET-CONGBAO']),
   sec('Giao thương và bảo tồn','observed_practice','Bài đăng của Bộ Văn hóa, Thể thao và Du lịch năm 2019 mô tả đề án hướng đến gìn giữ vai trò đầu mối, trung chuyển nông sản, đồng thời gắn du lịch với vệ sinh môi trường và an sinh. Những mục tiêu ấy cho thấy bảo tồn cần quan tâm cả đời sống giao thương.',['R-MARKET-BVHTTDL'])],
  'claims':[
   {'source_id':'R-MARKET-CONGBAO','statement':'Quyết định 1189 năm 2024 ghi nhận di sản Văn hóa Chợ nổi Cái Răng và dẫn Quyết định 829 ngày 10-3-2016.','locator':'Công báo 45+46 ngày 21-6-2024, trang 27, phần căn cứ và Điều 1.','kind':'register_entry'},
   {'source_id':'R-MARKET-BVHTTDL','statement':'Bài năm 2019 nêu mục tiêu đề án bảo tồn, giao thương nông sản, du lịch và môi trường.','locator':'Bài ngày 9-7-2019, đoạn Được biết, Đề án này phê duyệt năm 2016.','kind':'fact'}],
  'rights_basis':'Bản diễn giải mới từ thông tin văn bản và bài giới thiệu; ảnh Jean-Pierre Dalbéra theo CC BY 2.0, giữ ghi công và thông tin chuyển WebP.','media_keys':['cai-rang-market-dalbera'],'publish':True},
]

for a in articles:
 a['publish']=False
 a.setdefault('text_license','');a.setdefault('text_license_url','')
 a['body']='\n\n'.join('## '+s['heading']+'\n\n'+s['text'] for s in a['sections'])
 if a.get('dialect'):
  d=a['dialect'];a['body'] += '\n\n## Nghĩa\n\n'+d['meaning']+'\n\n## Ví dụ do ban biên soạn tạo\n\n'+d['example']
 for i,c in enumerate(a['claims']):c['id']=f"verified-{a['id']}-{i+1}"
 a['media']=[]
 for key in a.pop('media_keys'):
  m=next(x for x in commons['images'] if x['id']==key)
  caption=m['description']
  if a['id']=='E021':caption='Chợ nổi Cái Răng — ảnh bối cảnh năm 2011, không chứng minh nguồn gốc tên địa danh.'
  if key=='trau-cau-khuong-viet-ha':caption='Mâm trầu cau trong lễ vật ăn hỏi ở Việt Nam. Chưa xác định địa phương chụp; không xem là khuôn mẫu nghi lễ Nam Bộ.'
  a['media'].append({'id':a['id']+'-'+key,'kind':'image','url':'/media/'+Path(m['local_path']).name,'caption':caption,
   'author':m['author'],'source_url':m['source_url'],'license_name':m['license_name'],'license_url':m['license_url'],
   'modifications':m['modifications']+' Thẻ bài có thể cắt khung hiển thị bằng CSS; ảnh chi tiết giữ trọn khung.',
   'attribution':m['attribution'],'commercial_allowed':1,'file_sha256':m['webp_sha256'],'width':m['width'],'height':m['height']})

bundle={'version':'collections-2026-10-27-v1','reviewed_at':'2026-10-27','reviewer':'source-review:2026-10-27',
 'sources':sources,'articles':articles,
 'keep_draft_ids':['E002','E003','E004','E006','E007','E009'],
 'draft_notes':{'E002':'Chưa đủ nguồn giải thích riêng biểu tượng hoặc nguồn gốc trầu cau.','E003':'Nguồn phỏng vấn chưa mô tả đầy đủ trình tự rước dâu.','E006':'Thiếu khảo sát có địa bàn/cộng đồng/thời kỳ để đối chiếu thực hành phát tang Nam Bộ.','E007':'Nguồn thư mục chưa đủ chứng minh nghi thức cúng thất.'},
 'tours':[
  {'id':'NBS-DOC-TEN-DAT','title':'Đọc tên đất qua những giả thuyết','kind':'digital','description':'Hành trình đọc từ xa: phân biệt giả thuyết, giai thoại và tư liệu về không gian Cái Răng. Không phải tuyến di chuyển.','content_ids':['E020','E021','NBS-CHO-NOI']},
  {'id':'NBS-DOC-NEP-NHA','title':'Nếp nhà qua tư liệu và lời kể','kind':'digital','description':'Đọc cùng các hồ sơ về cưới hỏi, ngày giỗ và nhà cổ; không phải hướng dẫn nghi lễ chung.','content_ids':['E001','E008','NBS-BINH-THUY']},
  {'id':'NBS-DOC-TIENG-QUE','title':'Những cách xưng hô và lời nói phương ngữ','kind':'digital','description':'Chọn nghĩa, đọc ngữ cảnh và phân biệt ví dụ biên soạn với tư liệu đã sưu tầm. Không khẳng định mọi từ chỉ thuộc Nam Bộ.','content_ids':['E029','E030','E031','E032','E033']}
 ]}
raw=json.dumps(bundle,ensure_ascii=False,indent=2)
(ROOT/'lib/editorial-bundle.json').write_text(unicodedata.normalize('NFC',raw)+'\n',encoding='utf-8')
print(json.dumps({'articles':len(articles),'dictionary':sum(a['kind']=='dialect' for a in articles),'images':sum(len(a['media']) for a in articles),'all_real_sources':True},ensure_ascii=False))
