import { useState } from 'react';
import { checkTokens } from '../engine/check';
import { explainDiff, relevantTip } from '../engine/explain';
import type { ExProps } from '../types';

export default function Build({ ex, pack, done }: ExProps<'build'>) {
  const [placed, setPlaced] = useState<number[]>([]);
  const words = placed.map((i) => ex.tiles[i]);
  const submit = () => {
    if (!placed.length) return;
    const ok = checkTokens(words, ex.answer), answer = ex.answer.join(' '), given = words.join(' ');
    done({ correct: ok, answer, given, why: ok ? relevantTip(ex.why, answer) : explainDiff(given, answer) });
  };
  return <>
    <h1 className="instruction pad" style={{ marginTop: 18 }}>Build it</h1>
    <div className="pad" style={{ marginTop: 14 }}>
      <div className="paper tilt" style={{ ['--rot' as string]: '-1deg', padding: '14px 16px' }}>
        <p className="eyebrow">Say this in {pack.name}</p>
        <p className="prompt" style={{ marginTop: 4 }}>{ex.prompt}</p>
      </div>
    </div>
    <div className="pad" style={{ marginTop: 26 }}>
      <div className="ruled" lang={pack.voice} aria-label="Your sentence" style={{ minHeight: 120, display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start', gap: '10px 8px', paddingTop: 6 }}>
        {placed.map((i) => <button key={i} type="button" className="tile" onClick={() => setPlaced(placed.filter((x) => x !== i))} style={{ animation: 'pop 240ms var(--ease-snap)' }}>{ex.tiles[i]}</button>)}
      </div>
    </div>
    <div className="pad" lang={pack.voice} style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px 8px' }}>
      {ex.tiles.map((text, i) => {
        const used = placed.includes(i);
        return <button key={i} type="button" className={'tile' + (used ? ' ghost' : '')} disabled={used} aria-hidden={used} onClick={() => setPlaced([...placed, i])}>{text}</button>;
      })}
    </div>
    <div className="foot" style={{ marginTop: 22 }}>
      <button type="button" className={'btn block' + (placed.length ? '' : ' off')} disabled={!placed.length} onClick={submit}>Check</button>
    </div>
  </>;
}
