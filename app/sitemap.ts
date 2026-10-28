import type { MetadataRoute } from 'next';
import { categories } from '@/lib/catalog';
import { ensureSeed,publicContents,publicTours } from '@/lib/static-data';
import { siteUrl } from '@/lib/site-url';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{await ensureSeed();const paths=['','/kham-pha','/ban-do','/hanh-trinh','/nguon-tu-lieu','/ve-du-an',...categories.map(c=>'/chuyen-muc/'+c.slug),...(await publicContents()).map(c=>'/ho-so/'+c.slug),...(await publicTours()).map(t=>'/hanh-trinh/'+t.slug)];return paths.map(p=>({url:siteUrl+p,changeFrequency:'weekly'}));}
