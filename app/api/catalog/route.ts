import { NextResponse } from 'next/server';
import { ensureSeed,publicContents,stats } from '@/lib/static-data';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{await ensureSeed();const q=new URL(request.url).searchParams;const rows=await publicContents(q.get('q')??'',q.get('category')??'');const items=rows.map(c=>({id:c.id,slug:c.slug,title:c.title,category:c.category,historical_area:c.historical_area,community:c.community,classification:c.classification,summary:c.summary,body:c.body,latitude:c.latitude,longitude:c.longitude}));return NextResponse.json({items,stats:await stats()},{headers:{'Cache-Control':'no-store'}});}catch{return NextResponse.json({error:'Không thể đọc cơ sở dữ liệu.'},{status:503});}}
