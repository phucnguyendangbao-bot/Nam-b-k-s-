import type { Row } from '@/lib/static-data';
import { bindingFor } from '@/lib/knowledge';
import { domainById, knowledgeCommunities, editorialQuestions } from '@/lib/knowledge-taxonomy';
import { parseSections, sectionLabels } from '@/lib/editorial-model';
import type { ReleaseAnswer } from '@/lib/release-model';

export function KnowledgeContext({ article }: { article: Row }) {
  const binding = bindingFor(article.id); if (!binding) return null;
  const answers = article.answers as Record<string, ReleaseAnswer> | undefined;
  if (answers) return <details className="kn-context" id="ho-so-tri-thuc"><summary>Hồ sơ tri thức · Phạm vi và điều còn bỏ ngỏ</summary><div className="kn-context-body"><div className="badge-row">{[binding.primary_domain,...binding.secondary_domains].map(id => <a key={id} href={`/chuyen-de/${id}`}>{domainById(id)?.name}</a>)}</div><dl>{editorialQuestions.map(question => {
    const answer = answers[question.id];
    return <div key={question.id}><dt>{question.id === 'unknowns' ? 'Điều gì chưa được xác minh?' : question.label}</dt><dd><span className="kn-answer-state">{({ supported: 'Có nguồn đối chiếu', partial: 'Có nguồn trong phạm vi giới hạn', unknown: 'Chưa xác minh' })[answer.state]}</span><p>{answer.text}</p>{answer.source_ids.length > 0 && <p><a href="#nguon-tham-khao">Đối chiếu: {answer.source_ids.join(', ')}</a></p>}</dd></div>;
  })}</dl>{binding.historical_places?.length ? <><h3>Tên địa bàn theo tư liệu</h3><ul>{binding.historical_places.map((place,index) => <li key={index}>{place.name} ({place.as_of}). <a href="#nguon-tham-khao">Nguồn {place.source_id}</a></li>)}</ul></> : null}<p>Đơn vị hành chính hiện hành: chưa đối chiếu riêng. Giữ cách ghi địa bàn của từng nguồn.</p><p><a href={`/lien-ket-tri-thuc?id=${encodeURIComponent(article.id)}`}>Mở các nhánh đọc tiếp</a></p></div></details>;
  const sections = parseSections(article.sections_json ?? '[]');
  const origin = binding.origin_section !== undefined ? sections[binding.origin_section] : undefined;
  const change = binding.change_section !== undefined ? sections[binding.change_section] : undefined;
  return <details className="kn-context" id="ho-so-tri-thuc"><summary>Hồ sơ tri thức · Phạm vi và điều còn bỏ ngỏ</summary>
    <div className="kn-context-body"><div className="badge-row">{[binding.primary_domain, ...binding.secondary_domains].map(id => <a key={id} href={`/chuyen-de/${id}`}>{domainById(id)?.name}</a>)}</div>
      <dl><dt>Đó là gì?</dt><dd>{article.introduction || article.summary}</dd>
      <dt>Khi nào, ở đâu?</dt><dd>{(binding.historical_places?.length ?? 0) > 0 ? <ul>{binding.historical_places!.map((place, index) => <li key={index}>{place.name} — {place.role === 'publication_place' ? 'nơi xuất bản tư liệu, không phải kết luận về nguồn gốc' : 'địa bàn ghi trong nguồn'} ({place.as_of}). <a href="#nguon-tham-khao">Nguồn {place.source_id}</a></li>)}</ul> : <p>Phạm vi ghi trong bài: {article.historical_area}. Thời điểm từng ghi nhận được nêu trong nội dung và nguồn; chưa lập niên đại khởi đầu cho thực hành này.</p>}
      {binding.current_admin ? <p>Đơn vị hiện hành đã đối chiếu: {binding.current_admin.name} (kiểm tra {binding.current_admin.checked_at}).</p> : <p>Đơn vị hành chính hiện hành: chưa đối chiếu riêng. Tên cũ trong tư liệu được giữ nguyên.</p>}</dd>
      <dt>Gắn với cộng đồng nào?</dt><dd>{binding.communities.length ? binding.communities.map(id => knowledgeCommunities.find(item => item.id === id)?.name).join(', ') : 'Chưa gắn nhãn cộng đồng riêng khi nguồn chưa đủ cụ thể.'} <a href="#nguon-tham-khao">Xem phạm vi nguồn</a>.</dd>
      <dt>Nguồn gốc và ý nghĩa?</dt><dd>{origin ? <><strong>{sectionLabels[origin.kind]}: </strong>{origin.text}<p><a href={`#muc-${binding.origin_section! + 1}`}>Đọc mục và nguồn kèm theo</a></p></> : 'Chưa có kết luận riêng về nguồn gốc trong metadata. Xem các phần có dẫn nguồn và nhãn tư liệu trong bài.'}</dd>
      <dt>Đã thay đổi ra sao?</dt><dd>{change ? <>{change.text}<p><a href={`#muc-${binding.change_section! + 1}`}>Đọc mục đối chiếu</a></p></> : 'Chưa có chuỗi tư liệu đủ để kết luận diễn biến qua các thời kỳ.'}</dd>
      <dt>Điều gì chưa được xác minh?</dt><dd>{article.scope_note || 'Chưa mở rộng kết luận ngoài nhận định được nguồn xác nhận trong bài.'}</dd>
      <dt>Nội dung liên quan?</dt><dd><a href={`/lien-ket-tri-thuc?id=${encodeURIComponent(article.id)}`}>Mở các nhánh đọc tiếp</a>. Liên kết cùng lĩnh vực hoặc chung nguồn không tự chứng minh quan hệ ảnh hưởng lịch sử.</dd></dl>
      {binding.aliases.length > 0 && <div><h3>Tên gọi và từ khóa có nguồn</h3><ul>{binding.aliases.map(alias => <li key={alias.value}>{alias.value} — {({ alternate_name: 'tên gọi khác', historical_name: 'tên lịch sử', related_term: 'từ liên quan', hypothesis_keyword: 'từ khóa của giả thuyết, chưa phải dị danh đã xác nhận' })[alias.kind]}. <a href="#nguon-tham-khao">Nguồn {alias.source_id}</a></li>)}</ul></div>}
    </div>
  </details>;
}
