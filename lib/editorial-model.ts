export type SectionKind='documented_history'|'observed_practice'|'folk_belief'|'hypothesis'|'explanation'|'editorial_note'|'legend'|'anecdote'|'community_memory';
export type ArticleSection={heading:string;kind:SectionKind;text:string;sourceIds:string[]};
export const sectionLabels:Record<SectionKind,string>={documented_history:'Tư liệu lịch sử',observed_practice:'Thực hành được ghi nhận',folk_belief:'Quan niệm dân gian',hypothesis:'Giả thuyết chưa ngã ngũ',explanation:'Giải thích theo nguồn',editorial_note:'Ghi chú biên tập',legend:'Truyền thuyết',anecdote:'Giai thoại',community_memory:'Ký ức của người kể'};
export const topics:Record<string,string>={toponym:'Tên đất & giả thuyết',architecture:'Nhà cổ & kiến trúc',floating_market:'Văn hóa sông nước',riverfront:'Bến sông & đô thị',wedding:'Cưới hỏi',anniversary:'Đám giỗ & thờ cúng',ancestor:'Tưởng nhớ tổ tiên',funeral:'Tang lễ',pronoun:'Xưng hô',verb:'Hành động',particle:'Cách nói thường ngày',new_year:'Tết Khmer',moon_festival:'Lễ cúng trăng',boat_racing:'Đua ghe Ngo',music:'Âm nhạc',performance:'Nghệ thuật trình diễn',craft:'Nghề truyền thống',proverb:'Tục ngữ có bản ghi'};
export function nfc(value:string){return value.normalize('NFC');}
export function parseSections(value:string):ArticleSection[]{
  try{const sections:unknown=JSON.parse(value);if(!Array.isArray(sections))return [];
    return sections.filter((s):s is ArticleSection=>!!s&&typeof s==='object'&&typeof s.heading==='string'&&typeof s.text==='string'&&s.kind in sectionLabels&&Array.isArray(s.sourceIds)&&s.sourceIds.every((x:unknown)=>typeof x==='string'));
  }catch{return [];}
}
export function sectionBody(sections:ArticleSection[]){return sections.map(s=>`## ${s.heading}\n\n${s.text}`).join('\n\n').normalize('NFC');}
export function permitsCommercialMedia(license:string,url:string){
  return (license==='Public domain'&&url==='https://creativecommons.org/publicdomain/zero/1.0/')||
    (license==='Public domain'&&url==='https://commons.wikimedia.org/wiki/Template:PD-self')||
    (license==='Public domain'&&url==='https://commons.wikimedia.org/wiki/Template:PD-old-100-expired')||
    (license==='Public domain'&&url==='https://creativecommons.org/publicdomain/mark/1.0/')||
    /^https:\/\/creativecommons\.org\/licenses\/by(?:-sa)?\/(?:2\.0|2\.5|3\.0|4\.0)\/?$/.test(url);
}
export function imagePathAllowed(value:string){return /^\/media\/[a-z0-9][a-z0-9._-]*\.(?:jpg|jpeg|png|webp)$/.test(value);}
export function audioPathAllowed(value:string){return /^\/media\/[a-z0-9][a-z0-9._-]*\.(?:mp3|ogg|wav|webm)$/.test(value);}
export function topicForCategory(category:string){return ['dia_danh','cuoi_hoi','dam_gio','tang_le','ngon_ngu'].includes(category);}
