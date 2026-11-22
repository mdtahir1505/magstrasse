import { useState } from 'react';
import { explainDialogue } from '../engine/explain';
import { speak } from '../engine/speech';
import type { ExProps } from '../types';
import { Ico, SPEAKER_SM } from '../ui';

export default function Dialogue({ ex, pack, done }: ExProps<'dialogue'>) {
  const [r, setR] = useState<number | null>(null);
  const lines = [...ex.lines];
  if (r !== null) lines.push({ who: 'me', target: ex.replyOptions[r], english: '' });
  return <>
    <div className="pad grow scroll chat" lang={pack.voice} aria-live="polite" style={{ marginTop: 18, paddingBottom: 12 }}>
      {lines.map((l, i) =>
        <div key={i} className={'bubble-row ' + l.who}>
          <button type="button" className="audio sm" aria-label="Play line" onClick={() => speak(l.target)}><Ico d={SPEAKER_SM} /></button>
          <div className={'bubble ' + l.who}>
            <p className="t">{l.target}</p>
            {l.english && <p className="en" lang="en">{l.english}</p>}
          </div>
        </div>)}
    </div>
    {r === null && <div className="pad" lang={pack.voice} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p className="eyebrow">Your reply</p>
      {ex.replyOptions.map((text, i) => <button key={i} type="button" className="opt" onClick={() => { setR(i); speak(text); }}>{text}</button>)}
    </div>}
    <div className="foot">
      {r !== null && <button type="button" className="btn block" onClick={() => done({ correct: r === ex.answer, answer: ex.replyOptions[ex.answer], given: ex.replyOptions[r], silent: r === ex.answer,
        why: r === ex.answer ? undefined : explainDialogue([...ex.lines].reverse().find((l) => l.who === 'them'), ex.replyOptions[r], ex.replyOptions[ex.answer]) })}>Continue</button>}
    </div>
  </>;
}
