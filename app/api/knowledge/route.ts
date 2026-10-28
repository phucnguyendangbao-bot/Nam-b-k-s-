import { knowledgeItems, publicKnowledgeEvents } from '@/lib/knowledge';
import { knowledgeDomains } from '@/lib/knowledge-taxonomy';

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const filter = Object.fromEntries(['q', 'domain', 'region', 'community', 'type'].map(key => [key, query.get(key)?.slice(0, 160) ?? '']));
  const items = await knowledgeItems(filter);
  const events = (await publicKnowledgeEvents()).filter(event => items.some(item => item.id === event.content_id)).map(event => ({ id: event.id, content_id: event.content_id, title: event.title, value: event.value, year: event.year, precision: event.precision, kind: event.kind, source_id: event.source_id, locator: event.locator, source_as_written: event.source_as_written }));
  return Response.json({ domains: knowledgeDomains.map(({ id, name, description }) => ({ id, name, description })), count: items.length, items: items.map(item => ({ id: item.id, title: item.title, slug: item.slug, summary: item.summary, status: item.status, knowledge: item.knowledge })), events }, { headers: { 'Cache-Control': 'public, max-age=60' } });
}
