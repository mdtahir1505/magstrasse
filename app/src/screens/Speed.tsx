import { useEffect, useMemo, useRef, useState } from 'react';
import { allItems } from '../content';
import { finishSession } from '../engine/serial';
import { listenPick } from '../engine/session';
import { speak, stopSpeaking } from '../engine/speech';
import { grade } from '../engine/srs';
import type { Progress, State } from '../engine/storage';
import type { Episode, Item, Lang } from '../types';
import { A, CLOSE, genderTags, Ico, nounOnly, Screen, Tag } from '../ui';

const ROUND_MS = 60_000;
export const SPEED_MIN_WORDS = 8;
const mult = (combo: number) => (combo >= 10 ? 3 : combo >= 5 ? 2 : 1);
type Props = { lang: Lang; progress: Progress; tr: boolean; eps: Episode[]; update: (fn: (s: State) => void) => void; exit: () => void; onEnd: () => void };

/** 60-second rapid fire over learned words. Remounts per run so each round starts clean. */
export default function Speed(p: Props) {
  const [run, setRun] = useState(0);
  return <Round key={run} {...p} again={() => setRun(run + 1)} />;
}

function Round({ lang, progress, tr, eps, update, exit, onEnd, again }: Props & { again: () => void }) {
  const pool = useMemo(() => { const by = new Map(allItems(lang).map((i) => [i.id, i])); return Object.keys(progress.cards).map((id) => by.get(id)).filter((i) => !!i) as Item[]; }, []);
  const prevBest = useRef(progress.speedBest).current;
  const [phase, setPhase] = useState<'ready' | 'play' | 'done'>('ready');
  const [sound, setSound] = useState(true);
  const [left, setLeft] = useState(ROUND_MS);
  const [q, setQ] = useState<{ item: Item; ex: ReturnType<typeof listenPick> } | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const run = useRef({ right: 0, bestCombo: 0, last: '', grades: [] as [string, boolean][] });
  const endAt = useRef(0);
  const wait = useRef(0);

  const next = () => {
    let item = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && item.id === run.current.last) item = pool[(pool.indexOf(item) + 1) % pool.length];
    run.current.last = item.id;
    setPicked(null); setQ({ item, ex: listenPick(item, pool) });
    if (sound) speak(item.target, { rate: 1.15 });
  };

  const finish = (sc: number) => {
    clearTimeout(wait.current); stopSpeaking();
    setPhase('done');
    update((s) => {
      const pr = s.progress, now = new Date();
      for (const [id, ok] of run.current.grades) if (pr.cards[id] && (!ok || pr.cards[id].due <= now)) grade(pr.cards, id, ok); // correct counts only when the card was due
      pr.speedPlays++; pr.speedBest = Math.max(pr.speedBest, sc);
      finishSession(pr, eps, 1);
    });
    onEnd();
  };

  const scoreRef = useRef(0); scoreRef.current = score;
  const start = () => { endAt.current = Date.now() + ROUND_MS; setPhase('play'); next(); };
  useEffect(() => {
    if (phase !== 'play') return;
    const id = setInterval(() => { // the deadline lives in a ref, so a re-run of this effect keeps the same clock
      const l = endAt.current - Date.now(); setLeft(Math.max(l, 0));
      if (l <= 0) { clearInterval(id); finish(scoreRef.current); }
    }, 100);
    return () => clearInterval(id);
  }, [phase]); // eslint-disable-line
  useEffect(() => () => { clearTimeout(wait.current); stopSpeaking(); }, []);

  const tap = (i: number) => {
    if (!q || picked !== null) return;
    const ok = i === q.ex.answer;
    setPicked(i);
    run.current.grades.push([q.item.id, ok]);
    if (ok) { const c = combo + 1; run.current.right++; run.current.bestCombo = Math.max(run.current.bestCombo, c); setCombo(c); setScore(score + mult(c)); }
    else setCombo(0);
    wait.current = window.setTimeout(next, ok ? 280 : 650);
  };

  const secs = Math.ceil(left / 1000);
  const m = mult(combo);
  const top = <div className="pad session-top">
    <A className="icon-btn" aria-label="Quit speed round" onClick={() => { stopSpeaking(); exit(); }}><Ico d={CLOSE} /></A>
    <span className="eyebrow" style={{ flex: 1, textAlign: 'center' }}>Speed round</span>
    <button type="button" className={'chip dark' + (sound ? ' sel' : '')} aria-pressed={sound} aria-label="Sound" onClick={() => { setSound(!sound); stopSpeaking(); }}>{sound ? '🔊' : '🔇'}</button>
  </div>;

  if (phase === 'ready') return <Screen>
    {top}
    <section className="pad" style={{ marginTop: 26, position: 'relative' }}>
      <span className="marker" style={{ position: 'absolute', left: 26, top: -10, color: 'var(--c-pink)', fontSize: 26, transform: 'rotate(-8deg)' }}>go go go</span>
      <h1 className="display" style={{ fontSize: 150, lineHeight: 0.85, marginTop: 22, color: 'var(--c-yellow)', textShadow: '6px 6px 0 var(--c-pink)' }}>0:60</h1>
      <p style={{ marginTop: 18, fontSize: 20, fontWeight: 700, lineHeight: 1.3 }}>Pick the English for each word. Five in a row is x2, ten is x3. A miss resets the combo.</p>
    </section>
    <ul className="pad" style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <li className="card" style={{ padding: '10px 14px' }}>Best so far: <b style={{ color: 'var(--c-yellow)' }}>{prevBest}</b></li>
      <li className="card small dim" style={{ padding: '10px 14px' }}>Counts as a session for your streak.</li>
    </ul>
    <div className="foot" style={{ marginTop: 'auto' }}><button type="button" className="btn giant block" onClick={start}>Go</button></div>
  </Screen>;

  if (phase === 'done') {
    const record = score > prevBest && score > 0;
    return <Screen>
      {top}
      <section className="pad" style={{ marginTop: 20, position: 'relative', textAlign: 'center' }}>
        <p className="eyebrow">Time</p>
        <h1 className="display" role="status" aria-label={`Score ${score}`} style={{ fontSize: 150, lineHeight: 0.9, color: 'var(--c-yellow)', textShadow: '6px 6px 0 var(--c-pink)' }}>{score}</h1>
        {record && <span className="sticker y record" style={{ marginTop: 10, fontSize: 18, padding: '6px 14px' }}>New record!</span>}
        <p style={{ marginTop: 18, fontSize: 19, fontWeight: 700 }}>{record ? `Old best was ${prevBest}.` : `Best: ${Math.max(prevBest, score)}`}</p>
      </section>
      <ul className="pad" style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
        <li className="paper tilt" style={{ ['--rot' as string]: '-2deg', padding: '12px 10px', textAlign: 'center' }}><p className="display" style={{ fontSize: 40 }}>{run.current.right}</p><p className="small" style={{ fontWeight: 700 }}>right</p></li>
        <li className="paper tilt" style={{ ['--rot' as string]: '2deg', padding: '12px 10px', textAlign: 'center', background: 'var(--c-cyan)' }}><p className="display" style={{ fontSize: 40 }}>{run.current.bestCombo}</p><p className="small" style={{ fontWeight: 700 }}>best combo</p></li>
      </ul>
      <div className="foot" style={{ marginTop: 'auto' }}>
        <button type="button" className="btn block" onClick={again}>Go again</button>
        <button type="button" className="btn ghost block" onClick={exit}>Done</button>
      </div>
    </Screen>;
  }

  return <Screen>
    {top}
    <section className="pad" style={{ marginTop: 4 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <p className="display" aria-live="off" style={{ fontSize: 64, color: secs <= 10 ? 'var(--c-pink)' : 'var(--c-text)' }}>{secs}<span style={{ fontSize: 24 }}>s</span></p>
        <p className="display" aria-label={`Score ${score}`} style={{ fontSize: 64, color: 'var(--c-yellow)' }}>{score}</p>
      </div>
      <div className="bar" role="progressbar" aria-label="Time left" aria-valuemin={0} aria-valuemax={60} aria-valuenow={secs} style={{ height: 16 }}>
        <i style={{ width: `${(left / ROUND_MS) * 100}%`, transition: 'none', background: secs <= 10 ? 'var(--c-pink)' : undefined }} />
      </div>
      <div style={{ minHeight: 34, marginTop: 10 }}>
        {combo >= 2 && <span key={combo} className="sticker y" style={{ ['--rot' as string]: '-3deg', animation: 'pop 240ms var(--ease-snap)' }}>{combo} in a row{m > 1 ? ` · x${m}` : ''}</span>}
      </div>
    </section>
    {q && <>
      <section className="pad" style={{ marginTop: 6 }}>
        <div key={q.item.id + picked} className={'paper tilt' + (picked !== null && picked !== q.ex.answer ? ' shaky' : '')} style={{ ['--rot' as string]: '-1deg', padding: '22px 18px', textAlign: 'center' }}>
          <h1 lang={lang.pack.voice} className="target" style={{ fontSize: 46, lineHeight: 1.1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Tag g={q.item.gender} articles={genderTags(lang.pack)} size={22} />{nounOnly(q.item)}
          </h1>
          {tr && q.item.translit && <p className="small dim translit" style={{ marginTop: 4, fontSize: 18 }}>{q.item.translit}</p>}
        </div>
      </section>
      <ul className="pad" style={{ marginTop: 'auto', paddingTop: 14, paddingBottom: 'var(--safe-bottom)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {q.ex.options.map((text, i) => {
          let cls = 'opt';
          if (picked !== null && i === q.ex.answer) cls += ' right'; else if (i === picked) cls += ' wrong';
          return <li key={i}><button type="button" className={cls} onClick={() => tap(i)}><span className="key" aria-hidden="true">{'ABCD'[i]}</span>{text}</button></li>;
        })}
      </ul>
    </>}
  </Screen>;
}
