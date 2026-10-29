'use client';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { SpringValue, VelocityTracker, project, springs } from '@/lib/spring';

export type Word = { id: string; headword: string; meaning: string; usage: string; example: string; pos: string; href: string };

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Một thẻ lật: mặt trước là từ, mặt sau là nghĩa và ví dụ. */
export function FlipCard({ word, flipped, onFlip }: { word: Word; flipped: boolean; onFlip: () => void }) {
  return (
    <button type="button" className={`nb-flip ${flipped ? 'is-flipped' : ''}`} onClick={onFlip} aria-pressed={flipped} aria-label={flipped ? `Nghĩa của ${word.headword}: ${word.meaning}` : `Từ ${word.headword}. Bấm để xem nghĩa`}>
      <span className="nb-flip-inner">
        <span className="nb-flip-face nb-flip-front" aria-hidden={flipped}>
          <small>{word.pos}</small>
          <strong>{word.headword}</strong>
          <em>Chạm để lật</em>
        </span>
        <span className="nb-flip-face nb-flip-back" aria-hidden={!flipped}>
          <small>{word.headword} nghĩa là</small>
          <strong>{word.meaning}</strong>
          {word.example && <span className="nb-flip-example">“{word.example}”<i>Ví dụ do ban biên soạn đặt</i></span>}
        </span>
      </span>
    </button>
  );
}

export type SwipeHandle = { exit: (dir: 1 | -1) => void };

/**
 * Thẻ kéo được theo kiểu Apple: bám ngón tay 1:1 (giữ đúng chỗ đã nắm), có ngưỡng 10px trước khi khóa hướng,
 * thả ra thì chiếu quán tính để quyết định đổi thẻ hay bật về, và nối vận tốc vào lò xo nên không có “đường nối”.
 * Thẻ đi ra theo hướng vuốt; thẻ mới vào từ phía đối diện.
 */
const SwipeCard = forwardRef<SwipeHandle, { children: React.ReactNode; enterFrom: number; onCommit: (dir: 1 | -1) => void }>(function SwipeCard({ children, enterFrom, onCommit }, handle) {
  const el = useRef<HTMLDivElement>(null);
  const spring = useRef<SpringValue | null>(null);
  const drag = useRef<{ id: number; startX: number; startY: number; origin: number; locked: 'x' | 'y' | null; moved: boolean } | null>(null);
  const tracker = useRef(new VelocityTracker());
  const suppressClick = useRef(false);
  const commit = useRef(onCommit);
  useEffect(() => { commit.current = onCommit; }, [onCommit]);

  useEffect(() => {
    const node = el.current!;
    const apply = (x: number) => {
      const w = node.offsetWidth || 1;
      node.style.transform = `translate3d(${x}px,0,0) rotate(${(x / w) * 6}deg)`;
      node.style.opacity = String(Math.max(0, 1 - Math.abs(x) / (w * 1.6)));
    };
    const s = new SpringValue(enterFrom * (node.offsetWidth || 320), apply);
    spring.current = s;
    apply(s.value);
    s.to(0, springs.ui);
    return () => s.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exit = (dir: 1 | -1, velocity = 0) => {
    const node = el.current, s = spring.current;
    if (!node || !s) return;
    s.to(dir * node.offsetWidth * 1.35, { ...springs.ui, velocity, onRest: () => commit.current(dir) });
  };
  useImperativeHandle(handle, () => ({ exit: dir => exit(-dir as 1 | -1) }));

  return (
    <div
      ref={el}
      className="nb-swipe"
      onPointerDown={e => {
        if (e.button !== 0) return;
        spring.current?.stop(); // nắm lại giữa chừng: bắt đầu từ vị trí đang hiển thị
        drag.current = { id: e.pointerId, startX: e.clientX, startY: e.clientY, origin: spring.current?.value ?? 0, locked: null, moved: false };
        tracker.current.reset();
        tracker.current.add(spring.current?.value ?? 0);
        el.current?.classList.add('is-pressed');
      }}
      onPointerMove={e => {
        const d = drag.current;
        if (!d || d.id !== e.pointerId) return;
        const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
        if (!d.locked) {
          if (Math.hypot(dx, dy) < 10) return;
          d.locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
          if (d.locked === 'y') { drag.current = null; el.current?.classList.remove('is-pressed'); spring.current?.to(0, springs.ui); return; }
          el.current?.setPointerCapture(e.pointerId);
        }
        d.moved = true;
        const x = d.origin + dx;
        spring.current?.set(x);
        tracker.current.add(x);
      }}
      onPointerUp={e => {
        const d = drag.current;
        if (d && d.id !== e.pointerId) return;
        el.current?.classList.remove('is-pressed');
        drag.current = null;
        if (!d || !d.moved) return;
        suppressClick.current = true;
        window.setTimeout(() => { suppressClick.current = false; }, 350);
        const v = tracker.current.velocity();
        const x = spring.current?.value ?? 0;
        const w = el.current?.offsetWidth ?? 320;
        const projected = x + project(v);
        // Chiều vận tốc quyết định đổi thẻ hay bật về; điểm chiếu quán tính phải vượt nửa bề rộng thẻ.
        if (Math.abs(projected) > w / 2 && (Math.abs(v) < 50 || Math.sign(v) === Math.sign(projected))) exit(Math.sign(projected) as 1 | -1, v);
        else spring.current?.to(0, { ...springs.flick, velocity: v });
      }}
      onPointerCancel={() => { drag.current = null; el.current?.classList.remove('is-pressed'); spring.current?.to(0, springs.ui); }}
      onDragStart={e => e.preventDefault()}
      onClickCapture={e => { if (suppressClick.current) { suppressClick.current = false; e.preventDefault(); e.stopPropagation(); } }}
    >
      {children}
    </div>
  );
});

export function FlashDeck({ words }: { words: Word[] }) {
  const [deck, setDeck] = useState(words);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [enterFrom, setEnterFrom] = useState(0);
  const card = useRef<SwipeHandle>(null);
  /** Vuốt sang trái (dir = -1) là sang thẻ tiếp theo, như lật trang. */
  const settle = useCallback((dir: 1 | -1) => {
    setFlipped(false);
    setEnterFrom(-dir);
    setIndex(i => (i - dir + deck.length) % deck.length);
  }, [deck.length]);
  const go = (delta: 1 | -1) => card.current?.exit(delta);
  const word = deck[index];
  if (!word) return null;
  return (
    <div className="nb-deck" onKeyDown={e => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); }}>
      <div className="nb-deck-stage">
        <span className="nb-deck-shadow" aria-hidden="true" />
        <span className="nb-deck-shadow two" aria-hidden="true" />
        <SwipeCard key={`${word.id}-${index}`} ref={card} enterFrom={enterFrom} onCommit={settle}>
          <FlipCard word={word} flipped={flipped} onFlip={() => setFlipped(f => !f)} />
        </SwipeCard>
      </div>
      <p className="nb-deck-hint">Chạm vào thẻ để lật. Vuốt sang hai bên, dùng phím mũi tên hoặc nút dưới đây để đổi thẻ.</p>
      <div className="nb-deck-controls">
        <button type="button" className="button outline" onClick={() => go(-1)} aria-label="Thẻ trước">←</button>
        <span className="nb-deck-count" aria-live="polite">{index + 1} / {deck.length}</span>
        <button type="button" className="button outline" onClick={() => go(1)} aria-label="Thẻ tiếp">→</button>
        <button type="button" className="nb-text-button" onClick={() => { setDeck(shuffle(deck)); setIndex(0); setFlipped(false); setEnterFrom(1); }}>Xáo thẻ</button>
        <a className="nb-text-button" href={word.href}>Xem nguồn của từ này</a>
      </div>
    </div>
  );
}

type Question = { word: Word; options: string[] };
/** Che chính từ đang hỏi trong lời giải nghĩa để đáp án không tự lộ. */
function mask(w: Word) {
  return w.meaning.split(`“${w.headword}”`).join('từ này').split(`"${w.headword}"`).join('từ này');
}
function makeQuiz(words: Word[]): Question[] {
  return shuffle(words).map(word => ({
    word,
    options: shuffle([mask(word), ...shuffle(words.filter(w => w.id !== word.id)).slice(0, 3).map(mask)]),
  }));
}

export function Quiz({ words }: { words: Word[] }) {
  const [questions, setQuestions] = useState<Question[]>(() => makeQuiz(words));
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  if (!questions.length) return <div className="nb-quiz" aria-busy="true" />;
  const done = step >= questions.length;
  if (done) {
    const all = score === questions.length;
    return (
      <div className="nb-quiz nb-quiz-done">
        <p className="nb-quiz-score"><strong>{score}</strong>/{questions.length}</p>
        <h3>{all ? 'Bạn trả lời đúng tất cả các câu.' : score >= questions.length / 2 ? 'Bạn đã nắm phần lớn các từ.' : 'Hãy ôn lại bằng thẻ lật rồi thử lại.'}</h3>
        <button type="button" className="button" onClick={() => { setQuestions(makeQuiz(words)); setStep(0); setScore(0); setPicked(null); }}>Chơi lại</button>
      </div>
    );
  }
  const q = questions[step];
  const answer = mask(q.word);
  const correct = picked === answer;
  return (
    <div className="nb-quiz">
      <div className="nb-quiz-progress" aria-hidden="true"><span style={{ width: `${(step / questions.length) * 100}%` }} /></div>
      <p className="nb-quiz-step">Câu {step + 1} / {questions.length}</p>
      <h3 className="nb-quiz-question">“{q.word.headword}” nghĩa là gì?</h3>
      <div className="nb-quiz-options" role="group" aria-label="Các lựa chọn">
        {q.options.map(o => {
          const state = picked ? (o === answer ? 'is-right' : o === picked ? 'is-wrong' : 'is-dim') : '';
          return <button type="button" key={o} className={`nb-quiz-option ${state}`} disabled={!!picked} onClick={() => { setPicked(o); if (o === answer) setScore(s => s + 1); }}>{o}</button>;
        })}
      </div>
      {picked && (
        <div className={`nb-quiz-feedback ${correct ? 'is-right' : 'is-wrong'}`} role="status">
          <strong>{correct ? 'Chính xác.' : `Chưa đúng. “${q.word.headword}” là: ${q.word.meaning}`}</strong>
          <p>{q.word.usage}</p>
          <button type="button" className="button" onClick={() => { setStep(s => s + 1); setPicked(null); }} autoFocus>{step + 1 < questions.length ? 'Câu tiếp' : 'Xem điểm'}</button>
        </div>
      )}
    </div>
  );
}

/** Khu chơi của chuyên mục Tiếng quê mình: chuyển giữa thẻ lật và trắc nghiệm. */
export function LexiconPlay({ words }: { words: Word[] }) {
  const [mode, setMode] = useState<'cards' | 'quiz'>('cards');
  const canQuiz = words.length >= 4;
  return (
    <section className="nb-play" id="choi" aria-labelledby="nb-play-title">
      <div className="nb-play-head">
        <h2 id="nb-play-title">Chơi với tiếng quê</h2>
        <div className="nb-segment" role="tablist" aria-label="Chế độ chơi">
          <button type="button" role="tab" aria-selected={mode === 'cards'} onClick={() => setMode('cards')}>Thẻ lật</button>
          {canQuiz && <button type="button" role="tab" aria-selected={mode === 'quiz'} onClick={() => setMode('quiz')}>Trắc nghiệm</button>}
        </div>
      </div>
      <div role="tabpanel">{mode === 'cards' ? <FlashDeck words={words} /> : <Quiz words={words} />}</div>
    </section>
  );
}

/** Thẻ lật đơn cho trang chủ. */
export function TeaserCard({ word }: { word: Word }) {
  const [flipped, setFlipped] = useState(false);
  return <FlipCard word={word} flipped={flipped} onFlip={() => setFlipped(f => !f)} />;
}
