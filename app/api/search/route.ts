import { NextResponse } from 'next/server';
import { ensureSeed } from '@/lib/data';
import { buildSearchIndex } from '@/lib/search-index';

export const dynamic = 'force-dynamic';

/** Chỉ mục tìm kiếm công khai: chỉ gồm hồ sơ và hành trình đã công bố, cùng các trang tĩnh. */
export async function GET() {
  try {
    await ensureSeed();
    const entries = await buildSearchIndex();
    return NextResponse.json({ entries }, { headers: { 'Cache-Control': 'public, max-age=60' } });
  } catch {
    return NextResponse.json({ error: 'Chưa đọc được dữ liệu tìm kiếm.' }, { status: 503 });
  }
}
