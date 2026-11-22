import { useEffect, useState } from 'react';
import { speak } from '../engine/speech';
import type { ExProps } from '../types';
import { Ico, SPEAKER } from '../ui';

export default function ListenPick({ ex, done }: ExProps<'listenPick'>) {
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  useEffect(() => { speak(ex.audioText); }, [ex.audioText]);
  const submit = () => {
    if (picked === null) return;
    setChecked(true);
    done({ correct: picked === ex.answer, answer: `${ex.audioText} · ${ex.english}`, why: ex.why });
  };
  return <>
    <h1 className="instruction pad" style={{ marginTop: 18 }}>What did you hear?</h1>
    <div style={{ marginTop: 26, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 18 }}>
      <button type="button" className="play" aria-label="Play audio" onClick={() => speak(ex.audioText)}><Ico d={SPEAKER} /></button>
      <button type="button" className="audio" aria-label="Play slowly" onClick={() => speak(ex.audioText, { slow: true })} style={{ width: 60, height: 60, background: 'var(--c-paper)', fontSize: 30 }}><span aria-hidden="true">🐢</span></button>
    </div>
    <ul className="pad" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {ex.options.map((text, i) => {
        let cls = 'opt';
        if (checked && i === ex.answer) cls += ' right'; else if (checked && i === picked) cls += ' wrong'; else if (i === picked) cls += ' sel';
        return <li key={i}><button type="button" className={cls} aria-pressed={i === picked} onClick={() => !checked && setPicked(i)}><span className="key" aria-hidden="true">{'ABCD'[i]}</span>{text}</button></li>;
      })}
    </ul>
    <div className="foot">
      <button type="button" className={'btn block' + (picked === null ? ' off' : '')} disabled={picked === null || checked} onClick={submit}>Check</button>
    </div>
  </>;
}
