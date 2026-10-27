import { fold, similarity } from './catalog';

export type Matchable = { title: string; hay: string };

/** Xếp hạng theo: khớp đầu tiêu đề > tiêu đề chứa > mọi từ có trong nội dung > gần đúng tiêu đề. */
export function rankEntries<T extends Matchable>(entries: T[], query: string, limit = 30): T[] {
  const q = fold(query);
  if (!q) return [];
  const tokens = q.split(' ').filter(Boolean);
  const scored: { e: T; s: number }[] = [];
  for (const e of entries) {
    const title = fold(e.title);
    let s = 0;
    if (title.startsWith(q)) s = 5;
    else if (title.includes(q)) s = 4;
    else if (e.hay.includes(q)) s = 3;
    else if (tokens.length > 1 && tokens.every(t => e.hay.includes(t))) s = 2;
    else {
      const sim = similarity(title, q);
      if (sim >= 0.6) s = sim;
    }
    if (s > 0) scored.push({ e, s });
  }
  return scored.sort((a, b) => b.s - a.s).slice(0, limit).map(x => x.e);
}
