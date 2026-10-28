import type { MetadataRoute } from 'next';
import { categories } from '@/lib/catalog';
import { ensureSeed,publicContents,publicTours } from '@/lib/static-data';
import { siteUrl } from '@/lib/site-url';
import { mapTours } from '@/lib/map-tours';
import { guidePages } from '@/lib/reading-guides';
import { knowledgePages, knowledgeDomains } from '@/lib/knowledge-taxonomy';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{await ensureSeed();const paths=['','/kham-pha','/ban-do','/hanh-trinh','/nguon-tu-lieu','/ve-du-an',...knowledgePages.map(p=>'/'+p.slug),...knowledgeDomains.map(d=>'/chuyen-de/'+d.id),...guidePages.map(p=>'/'+p.slug),...categories.map(c=>'/chuyen-muc/'+c.slug),...(await publicContents()).map(c=>'/ho-so/'+c.slug),...mapTours.map(t=>'/hanh-trinh/'+t.slug),...(await publicTours()).map(t=>'/hanh-trinh/'+t.slug)];return paths.map(p=>({url:siteUrl+p,changeFrequency:'weekly'}));}
