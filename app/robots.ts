import type { MetadataRoute } from 'next';
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:'*',allow:'/',disallow:['/quan-tri','/api/','/so-tay']},sitemap:'https://nam-bo-ky-su.gladmouse16.chatgpt.site/sitemap.xml'};}
