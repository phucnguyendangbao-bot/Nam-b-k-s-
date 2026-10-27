export const categories = [
  {slug:'dat-nam-bo',name:'Đất Nam Bộ',subtitle:'Địa danh & dòng chảy lịch sử',number:'01',types:['dia_danh'],motif:'river'},
  {slug:'nep-xua',name:'Nếp xưa',subtitle:'Phong tục & đời sống',number:'02',types:['cuoi_hoi','tang_le','dam_gio','phong_tuc'],motif:'house'},
  {slug:'tieng-que-minh',name:'Tiếng quê mình',subtitle:'Lời ăn, tiếng nói Nam Bộ',number:'03',types:['ngon_ngu'],motif:'type'},
  {slug:'loi-nguoi-xua',name:'Lời người xưa',subtitle:'Ca dao, tục ngữ & chuyện kể',number:'04',types:['ca_dao','truyen_thuyet'],motif:'book'},
  {slug:'le-hoi',name:'Mùa lễ hội',subtitle:'Lễ hội & tín ngưỡng',number:'05',types:['le_hoi','khmer','tin_nguong'],motif:'sun'},
  {slug:'dau-xua',name:'Dấu xưa còn đó',subtitle:'Di sản, nghệ thuật & nghề',number:'06',types:['di_san','nghe_thuat','nghe','du_lich'],motif:'arch'},
] as const;
export const classes: Record<string,string> = {
  official_register:'Danh mục chính thức',source_supported:'Có nguồn hỗ trợ',research_lead:'Đầu mối nghiên cứu',
  bibliographic_lead:'Đầu mối thư mục',proposed_not_verified:'Đề xuất chưa kiểm chứng',
};
export const statusLabels: Record<string,string>={draft:'Bản nháp',in_review:'Đang duyệt',approved:'Đã duyệt',published:'Đã công bố',pending:'Chờ duyệt',accepted:'Chấp nhận',rejected:'Từ chối'};
export const roleLabels: Record<string,string>={admin:'Quản trị viên',editor:'Biên tập viên',researcher:'Nghiên cứu viên',contributor:'Người đóng góp',visitor:'Bạn đọc'};
export function fold(value:string){ return value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/\s+/g,' ').trim(); }
export function slugify(value:string){ return fold(value).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90); }
export function similarity(a:string,b:string){
  a=fold(a);b=fold(b);if(a.includes(b)||b.includes(a))return 1;
  const row=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){let prev=row[0];row[0]=i;for(let j=1;j<=b.length;j++){const old=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=old;}}
  return 1-row[b.length]/Math.max(a.length,b.length,1);
}
export function safeUrl(value:string){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}}
export function mapEmbed(lat?:number|null,lon?:number|null){
  if(lat!=null&&lon!=null&&Number.isFinite(lat)&&Number.isFinite(lon))return `https://www.openstreetmap.org/export/embed.html?bbox=${lon-.012}%2C${lat-.008}%2C${lon+.012}%2C${lat+.008}&layer=mapnik&marker=${lat}%2C${lon}`;
  return 'https://www.openstreetmap.org/export/embed.html?bbox=104.4%2C9.0%2C106.6%2C11.0&layer=mapnik';
}
