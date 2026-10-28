import { notFound } from 'next/navigation';
import { DossierCards } from './collections';
import { Breadcrumb, PageTitle } from './site';
import { MemoryDraft } from './interactive/memory-draft';
import { knowledgeCounts, knowledgeItems, knowledgeMetadata, knowledgeRelated, publicKnowledgeEvents } from '@/lib/knowledge';
import { knowledgeDomains, knowledgeRegions, knowledgeCommunities, knowledgePages, domainById } from '@/lib/knowledge-taxonomy';
import { all } from '@/lib/static-data';
import { parseSections } from '@/lib/editorial-model';

type Params = Record<string, string | undefined>;
export function KnowledgeNav({ active }: { active: string }) {
  return <nav className="kn-nav" aria-label="Tra cứu tri thức">{knowledgePages.map(page => <a key={page.slug} href={`/${page.slug}`} aria-current={active === page.slug ? 'page' : undefined}>{page.title.replace(' Nam Bộ', '')}</a>)}<a href="/ban-do">Bản đồ di sản</a><a href="/hanh-trinh">Hành trình</a></nav>;
}
export async function KnowledgeDomainCards() {
  const domains = await knowledgeCounts();
  return <div className="kn-domains">{domains.map((domain, index) => <a key={domain.id} href={`/chuyen-de/${domain.id}`} className="kn-domain"><span className="kn-number">{String(index + 1).padStart(2, '0')}</span><h2>{domain.name}</h2><p>{domain.description}</p><span className="kn-count">{domain.count ? `${domain.count} hồ sơ đã công bố` : 'Đang nghiên cứu nguồn'}</span></a>)}</div>;
}
function Filters({ params, domain, dictionary = false }: { params: Params; domain?: string; dictionary?: boolean }) {
  return <form className="kn-filters" method="get" role="search">
    <label className="kn-query">{dictionary ? 'Tìm từ, nghĩa hoặc ngữ cảnh' : 'Tìm hồ sơ, tên gọi khác, địa danh cũ'}<input name="q" defaultValue={params.q} maxLength={160} placeholder="Gõ có dấu hoặc không dấu" /></label>
    {!domain && !dictionary && <label>Lĩnh vực<select name="domain" defaultValue={params.domain ?? ''}><option value="">Tất cả lĩnh vực</option>{knowledgeDomains.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
    {!dictionary && <><label>Địa bàn tư liệu<select name="region" defaultValue={params.region ?? ''}><option value="">Tất cả địa bàn</option>{knowledgeRegions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Cộng đồng theo nguồn<select name="community" defaultValue={params.community ?? ''}><option value="">Tất cả cộng đồng</option>{knowledgeCommunities.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></>}
    <button className="button" type="submit">Tra cứu</button><a className="kn-clear" href={domain ? `/chuyen-de/${domain}` : dictionary ? '/tu-dien' : '/tri-thuc'}>Xóa bộ lọc</a>
  </form>;
}
export async function KnowledgePage({ params, domainId }: { params: Params; domainId?: string }) {
  const domain = domainId ? domainById(domainId) : undefined;
  if (domainId && !domain) notFound();
  const items = await knowledgeItems({ ...params, domain: domain?.id ?? params.domain });
  return <main id="main" className="wrap page kn-page"><Breadcrumb items={domain ? [{ label: 'Kho tri thức', href: '/tri-thuc' }, { label: domain.name }] : [{ label: 'Kho tri thức' }]} />
    <PageTitle eyebrow="Bảo tàng số · Từ điển văn hóa" title={domain?.name ?? 'Kho tri thức Nam Bộ'} description={domain?.description ?? 'Lần theo nguồn, tên đất và thực hành văn hóa qua 12 lĩnh vực. Kho hiện có tập trung ở Tây Nam Bộ; những khoảng trống được giữ lại để tiếp tục nghiên cứu.'} />
    <KnowledgeNav active="tri-thuc" />
    {!domain && <KnowledgeDomainCards />}
    <section className="kn-section" aria-labelledby="kn-results"><h2 id="kn-results">{domain ? 'Hồ sơ trong chuyên đề' : 'Tra cứu hồ sơ'}</h2><Filters params={params} domain={domain?.id} />
      <p className="kn-result" role="status">{items.length} hồ sơ đã công bố{params.q ? ` cho “${params.q}”` : ''}.</p>
      {items.length ? <DossierCards items={items} /> : <div className="kn-empty"><h3>Chưa có hồ sơ phù hợp</h3><p>Thử bỏ bớt bộ lọc. Chuyên đề chưa có bài sẽ mở khi có đủ nguồn và được duyệt biên tập.</p></div>}
    </section>
    {domain && <section className="kn-research"><p className="eyebrow">Hướng nghiên cứu · Chưa phải dữ kiện đã xác minh</p><h2>Những câu hỏi đang mở</h2><ul>{domain.topics.map(topic => <li key={topic}>{topic}</li>)}</ul></section>}
    <p className="kn-note">Một hồ sơ có thể thuộc nhiều lĩnh vực. Cộng đồng và địa bàn chỉ được gắn khi nguồn hỗ trợ; để trống không có nghĩa là cộng đồng ấy vắng mặt. Tên địa bàn theo tư liệu được giữ riêng với đơn vị hành chính hiện hành.</p>
  </main>;
}
export async function DictionaryPage({ params }: { params: Params }) {
  const items = await knowledgeItems({ q: params.q, type: 'dialect' });
  return <main id="main" className="wrap page kn-page"><Breadcrumb items={[{ label: 'Kho tri thức', href: '/tri-thuc' }, { label: 'Từ điển' }]} /><PageTitle title="Từ điển phương ngữ" description="Tra nghĩa, ngữ cảnh, ví dụ biên soạn và nguồn của từng mục từ. Chưa có bản thu được cấp quyền thì trường phát âm được để trống." /><KnowledgeNav active="tu-dien" /><Filters params={params} dictionary /><p className="kn-result" role="status">{items.length} mục từ đã công bố.</p>{items.length ? <DossierCards items={items} /> : <div className="kn-empty"><h2>Chưa tìm thấy từ phù hợp</h2><p>Thử một cách viết khác hoặc xóa từ khóa.</p></div>}</main>;
}
export async function TimelinePage({ params }: { params: Params }) {
  const events = (await publicKnowledgeEvents()).filter(event => !params.domain || [event.article.knowledge.primary_domain, ...event.article.knowledge.secondary_domains].includes(params.domain as never));
  const sources = await all('SELECT * FROM source_registry ORDER BY id');
  const kinds = { publication: 'Mốc xuất bản tư liệu', register: 'Mốc ghi danh trong danh mục', observed_event: 'Một kỳ thực hành được ghi nhận' };
  return <main id="main" className="wrap page kn-page"><Breadcrumb items={[{ label: 'Kho tri thức', href: '/tri-thuc' }, { label: 'Dòng thời gian' }]} /><PageTitle title="Dòng thời gian tư liệu" description="Mỗi mốc nói rõ nó ghi nhận điều gì. Ngày ghi danh di sản, ngày xuất bản sách và thời điểm một sự kiện không được dùng thay cho niên đại ra đời của thực hành." /><KnowledgeNav active="dong-thoi-gian" />
    <form className="kn-filters" method="get"><label>Lĩnh vực<select name="domain" defaultValue={params.domain ?? ''}><option value="">Tất cả lĩnh vực</option>{knowledgeDomains.map(domain => <option key={domain.id} value={domain.id}>{domain.name}</option>)}</select></label><button className="button">Lọc mốc</button></form>
    <ol className="kn-timeline">{events.map(event => <li key={event.id}><time dateTime={event.value}>{event.precision === 'year' ? event.value : event.value.split('-').reverse().join('/')}</time><div><p className="eyebrow">{kinds[event.kind]}</p><h2>{event.title}</h2><p>{event.source_as_written}</p><a className="text-link" href={`/ho-so/${event.article.slug}`}>Đọc hồ sơ</a> · <a href={sources.find(source => source.id === event.source_id)?.url ?? '/nguon-tu-lieu'} target="_blank" rel="noreferrer">Nguồn {event.source_id}</a><details><summary>Vị trí đối chiếu</summary><p>{event.locator}</p></details></div></li>)}</ol>{!events.length && <p>Chưa có mốc đã đối chiếu trong lĩnh vực này.</p>}
  </main>;
}
export async function KnowledgeLinksPage({ params }: { params: Params }) {
  const items = await knowledgeItems();
  const selected = items.find(item => item.id === params.id) ?? items.find(item => item.id === 'NBS-CHO-NOI') ?? items[0];
  const links = selected ? await knowledgeRelated(selected.id, 6) : [];
  return <main id="main" className="wrap page kn-page"><Breadcrumb items={[{ label: 'Kho tri thức', href: '/tri-thuc' }, { label: 'Liên kết hồ sơ' }]} /><PageTitle title="Liên kết tri thức" description="Chọn một hồ sơ để xem các nhánh đọc tiếp. Liên kết dưới đây dựa trên cùng lĩnh vực hoặc chung nguồn tham khảo; chưa khẳng định quan hệ nguồn gốc hay ảnh hưởng lịch sử." /><KnowledgeNav active="lien-ket-tri-thuc" /><form className="kn-filters" method="get"><label>Hồ sơ trung tâm<select name="id" defaultValue={selected?.id}>{items.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><button className="button">Xem liên kết</button></form>
    {selected && <div className="kn-graph"><article className="kn-center"><p className="eyebrow">Hồ sơ trung tâm</p><h2><a href={`/ho-so/${selected.slug}`}>{selected.title}</a></h2><p>{selected.summary}</p></article><ul>{links.map(link => <li key={link.item.id}><span className="kn-edge">{link.reason}</span><h3><a href={`/ho-so/${link.item.slug}`}>{link.item.title}</a></h3>{link.source_ids.length > 0 && <p>Nguồn chung: {link.source_ids.join(', ')}</p>}<a className="text-link" href={`/lien-ket-tri-thuc?id=${encodeURIComponent(link.item.id)}`}>Lấy làm trung tâm →</a></li>)}</ul></div>}{!links.length && <p>Chưa có nhánh liên quan đủ cơ sở trong kho hiện tại.</p>}
  </main>;
}
export async function WhyPage() {
  const items = await knowledgeItems();
  return <main id="main" className="wrap page kn-page"><Breadcrumb items={[{ label: 'Kho tri thức', href: '/tri-thuc' }, { label: 'Vì sao lại thế?' }]} /><PageTitle title="Vì sao lại thế?" description="Bắt đầu từ một câu hỏi, đọc lời giải thích trong hồ sơ và lần về nguồn. Giả thuyết được giữ là giả thuyết; điều chưa đủ chứng cứ vẫn để ngỏ." /><KnowledgeNav active="vi-sao-lai-the" /><div className="kn-questions">{knowledgeMetadata.questions.map(question => {
    const item = items.find(item => item.id === question.content_id); if (!item) return null;
    const section = parseSections(item.sections_json ?? '[]')[question.section_index ?? 0];
    return <article key={question.id}><h2>{question.question}</h2><p>{question.use === 'scope_note' ? item.scope_note : section?.text}</p><a className="text-link" href={`/ho-so/${item.slug}${question.use === 'section' ? `#muc-${(question.section_index ?? 0) + 1}` : '#nguon-tham-khao'}`}>Đọc hồ sơ và nguồn đối chiếu →</a></article>;
  })}</div></main>;
}
export function MemoriesPage() {
  return <main id="main" className="wrap page kn-page"><Breadcrumb items={[{ label: 'Kho tri thức', href: '/tri-thuc' }, { label: 'Ông bà kể chuyện' }]} /><PageTitle title="Ông bà kể chuyện" description="Mỗi lời kể mang một góc nhìn, thời điểm và xuất xứ riêng. Ký ức cộng đồng cần sự đồng ý của người kể và tài liệu đối chiếu trước khi xuất bản." /><KnowledgeNav active="ong-ba-ke-chuyen" /><div className="kn-empty"><h2>Đang chuẩn bị những lời kể đầu tiên</h2><p>Chưa có hồ sơ ký ức đã hoàn tất thẩm định và quyền công bố trong kho này.</p></div><MemoryDraft /></main>;
}
