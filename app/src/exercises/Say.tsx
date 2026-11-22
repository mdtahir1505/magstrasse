import { useRef, useState } from 'react';
import { check, norm } from '../engine/check';
import { listen, record, speak } from '../engine/speech';
import type { ExProps } from '../types';
import { Ico, SPEAKER_SM } from '../ui';

type Rec = Awaited<ReturnType<typeof record>>;
type Lis = ReturnType<typeof listen>;
const H = [40, 70, 55, 90, 35, 80, 60, 100, 45, 75, 30, 85, 50, 95, 40, 65, 80, 35, 70, 55, 90, 45, 60, 30];

/** How many target words appear, in order, in the transcript. */
const heardCount = (words: string[], transcript: string) => {
  let n = 0;
  for (const t of norm(transcript).split(' ')) if (n < words.length && check(t, norm(words[n])).ok) n++;
  return n;
};

export default function Say({ ex, pack, done }: ExProps<'say'>) {
  const words = ex.target.split(/\s+/);
  const [phase, setPhase] = useState<'idle' | 'live' | 'ok' | 'fallback'>('idle');
  const [heard, setHeard] = useState(0);
  const [mine, setMine] = useState<string | null>(null);
  const rec = useRef<Rec>(null);
  const lis = useRef<Lis>(null);
  const ended = useRef(false);

  const finish = async (h: number) => {
    if (ended.current) return;
    ended.current = true;
    const r = await rec.current?.stop();
    rec.current = null;
    if (r) setMine(r.url);
    setHeard(Math.max(h, 0));
    setPhase(h >= Math.ceil(words.length * 0.7) ? 'ok' : 'fallback');
  };

  const start = async () => {
    ended.current = false; setHeard(0); setMine(null); setPhase('live');
    lis.current = listen((t) => setHeard(heardCount(words, t)));
    lis.current?.done.then((t) => finish(heardCount(words, t)), () => finish(-1));
    rec.current = await record();
    if (!lis.current && !rec.current) finish(-1); // nothing can listen: self-grade
  };
  const stop = () => (lis.current ? lis.current.stop() : finish(-1));
  const pass = () => done({ correct: true, answer: ex.target, silent: true });

  return <>
    <h1 className="instruction pad" style={{ marginTop: 18 }}>Say it out loud</h1>

    <section className="pad" style={{ marginTop: 22 }}>
      <div className="card" style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p lang={pack.voice} aria-live="polite" style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.25, display: 'flex', flexWrap: 'wrap', gap: '4px 8px' }}>
          {words.map((w, i) => <span key={i} className={'w' + (i < heard ? ' heard' : phase === 'live' && i === heard ? ' now' : '')}>{w}</span>)}
        </p>
        <p className="dim" style={{ fontSize: 17 }}>{ex.english}</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button type="button" className="audio sm" aria-label="Hear it first" onClick={() => speak(ex.target)}><Ico d={SPEAKER_SM} /></button>
          <button type="button" className="audio sm" aria-label="Hear it slowly" onClick={() => speak(ex.target, { slow: true })} style={{ background: 'var(--c-paper)', fontSize: 18 }}><span aria-hidden="true">🐢</span></button>
        </div>
      </div>
    </section>

    <section style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {phase === 'live' && <div className="wave" aria-hidden="true" style={{ width: 220, height: 40, color: 'var(--c-pink)' }}>
        {H.map((h, i) => <i key={i} style={{ height: `${h}%`, animation: 'eq 900ms ease-in-out infinite', animationDelay: `${-i * 70}ms` }} />)}
      </div>}
      {(phase === 'idle' || phase === 'live') && <button type="button" className={'mic' + (phase === 'live' ? ' live' : '')} aria-label={phase === 'live' ? 'Stop recording' : 'Start speaking'} onClick={phase === 'live' ? stop : start}>
        <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
      </button>}
      <p style={{ fontWeight: 800, color: 'var(--c-pink)' }}>
        {phase === 'idle' && 'Tap the mic and say it'}
        {phase === 'live' && `Listening… ${heard}/${words.length} words`}
        {phase === 'ok' && 'Sauber! Heard it.'}
        {phase === 'fallback' && `Heard ${heard}/${words.length} words. Close enough?`}
      </p>
    </section>

    <div className="foot" style={{ alignItems: 'center', paddingTop: 8 }}>
      {phase === 'ok' && <button type="button" className="btn block" onClick={pass}>Continue</button>}
      {phase === 'fallback' && <>
        {mine && <button type="button" className="btn ghost block" onClick={() => new Audio(mine).play()}>Play mine</button>}
        <button type="button" className="btn block" onClick={pass}>I said it ✓</button>
        <button type="button" className="link" onClick={() => { ended.current = false; setPhase('idle'); }}>Try again</button>
      </>}
      {(phase === 'idle' || phase === 'live') && <button type="button" className="link" onClick={() => done(null)}>Can't talk right now</button>}
    </div>
  </>;
}
