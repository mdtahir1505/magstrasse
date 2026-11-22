import { useState } from 'react';
import { explainFill, relevantTip } from '../engine/explain';
import type { ExProps } from '../types';

export default function Fill({ ex, pack, done }: ExProps<'fill'>) {
  const [p, setP] = useState<number | null>(null);
  const submit = () => {
    if (p === null) return;
    const answer = ex.before + ex.options[ex.answer] + ex.after;
    done({ correct: p === ex.answer, answer, given: ex.options[p],
      why: p === ex.answer ? relevantTip(ex.why, answer) : explainFill(ex.before, ex.after, ex.options[p], ex.options[ex.answer], ex.english) });
  };
  return <>
    <h1 className="instruction pad" style={{ marginTop: 18 }}>Fill the gap</h1>
    <section className="pad" style={{ marginTop: 60 }}>
      <div className="paper tape tilt" style={{ ['--rot' as string]: '-1deg', padding: '34px 20px 28px', textAlign: 'center' }}>
        <p lang={pack.voice} style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.35 }}>
          {ex.before}{p !== null ? <span className="blank filled">{ex.options[p]}</span> : <span className="blank" aria-label="blank" />}{ex.after}
        </p>
      </div>
    </section>
    <div className="pad" lang={pack.voice} role="radiogroup" aria-label="Options" style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
      {ex.options.map((text, i) =>
        <button key={i} type="button" role="radio" aria-checked={i === p} className={'chip' + (i === p ? ' sel' : '')} onClick={() => setP(i === p ? null : i)} style={{ minHeight: 60 }}>{text}</button>)}
    </div>
    <div className="foot" style={{ marginTop: 22 }}>
      <button type="button" className={'btn block' + (p === null ? ' off' : '')} disabled={p === null} onClick={submit}>Check</button>
    </div>
  </>;
}
