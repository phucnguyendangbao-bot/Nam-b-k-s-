import rawMetadata from '@/data/knowledge/metadata.json';
import { publicContents, type Row } from './static-data';
import { filterKnowledge, knowledgeSearchText, relatedKnowledge } from './knowledge-core';
import type { KnowledgeMetadata, KnowledgeFilter, KnowledgeItem, KnowledgeBinding } from './knowledge-core';
import { knowledgeDomains } from './knowledge-taxonomy';

export const knowledgeMetadata = rawMetadata as unknown as KnowledgeMetadata;
export function bindingFor(id: string): KnowledgeBinding | undefined { return knowledgeMetadata.bindings[id]; }
export function knowledgeSearchTerms(id: string) { const binding = bindingFor(id); return binding ? knowledgeSearchText(binding) : ''; }

export async function knowledgeItems(filter: KnowledgeFilter = {}): Promise<(Row & KnowledgeItem)[]> {
  const rows = (await publicContents()).filter(row => bindingFor(row.id));
  const items = rows.map(row => ({ ...row, knowledge: bindingFor(row.id)! })) as (Row & KnowledgeItem)[];
  return filterKnowledge(items, filter);
}

export async function knowledgeCounts() {
  const items = await knowledgeItems();
  return knowledgeDomains.map(domain => ({ ...domain, count: items.filter(item => [item.knowledge.primary_domain, ...item.knowledge.secondary_domains].includes(domain.id)).length }));
}

export async function knowledgeRelated(id: string, limit = 5) {
  const items = await knowledgeItems();
  const item = items.find(item => item.id === id);
  return item ? relatedKnowledge(item, items, limit) : [];
}

export async function publicKnowledgeEvents() {
  const items = await knowledgeItems();
  const byId = new Map(items.map(item => [item.id, item]));
  return knowledgeMetadata.events.filter(event => event.review_status === 'source_checked' && byId.has(event.content_id))
    .map(event => ({ ...event, article: byId.get(event.content_id)! }))
    .sort((a, b) => a.year - b.year || a.value.localeCompare(b.value));
}
