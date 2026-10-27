'use client';
import { useCallback, useState } from 'react';

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
          <em>Bấm để lật</em>
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

export function FlashDeck({ words }: { words: Word[] }) {
  const [deck, setDeck] = useState(words);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const go = useCallback((delta: number) => { setFlipped(false); setIndex(i => (i + delta + deck.length) % deck.length); }, [deck.length]);
  const word = deck[index];
  if (!word) return null;
  return (
    <div className="nb-deck" onKeyDown={e => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); }}>
      <div className="nb-deck-stage">
        <span className="nb-deck-shadow" aria-hidden="true" />
        <span className="nb-deck-shadow two" aria-hidden="true" />
        <FlipCard key={word.id} word={word} flipped={flipped} onFlip={() => setFlipped(f => !f)} />
      </div>
      <div className="nb-deck-controls">
        <button type="button" className="button outline" onClick={() => go(-1)} aria-label="Thẻ trước">←</button>
        <span className="nb-deck-count" aria-live="polite">{index + 1} / {deck.length}</span>
        <button type="button" className="button outline" onClick={() => go(1)} aria-label="Thẻ tiếp">→</button>
        <button type="button" className="nb-text-button" onClick={() => { setDeck(shuffle(deck)); setIndex(0); setFlipped(false); }}>Xáo thẻ</button>
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
