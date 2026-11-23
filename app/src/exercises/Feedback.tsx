import { useState } from 'react';
import { norm } from '../engine/check';
import { speak } from '../engine/speech';
import type { Pack, Result } from '../types';
import { A, CHECK, CLOSE, Ico, SPEAKER } from '../ui';

const PRAISE = ['Sauber!', 'Krass gut!', 'Läuft!'];

/** Scrim + bottom sheet. Render inside the session screen. */
export default function Feedback({ res, pack, requeued, onContinue }: { res: Result; pack: Pack; requeued: boolean; onContinue: () => void }) {
  const [praise] = useState(() => PRAISE[Math.floor(Math.random() * PRAISE.length)]);
  const ok = res.correct;
  const heardText = res.answer.split(' · ')[0];
  const given = new Set((res.given ?? '').split(/\s+/).map(norm));
  const parts = res.answer.split(' ').map((text) => ({ text, hl: !!res.given && !res.answer.includes(' · ') && !given.has(norm(text)) }));
  const audio = <button type="button" className="audio" aria-label="Hear it" onClick={() => speak(heardText)} style={{ background: 'var(--c-paper)' }}><Ico d={SPEAKER} /></button>;
  return <>
    <div className="scrim" />
    <section className={'sheet ' + (ok ? 'ok' : 'bad')} role="alertdialog" aria-labelledby="verdict" aria-describedby="answer">
      {ok ? <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 id="verdict" className="verdict"><Ico d={CHECK} style={{ width: 48, height: 48, strokeWidth: 3.4 }} />{praise}</h2>
          {audio}
        </div>
        <p id="answer" lang={pack.voice} className="answer">{res.answer}{res.translit && <span className="small dim translit" style={{ display: 'block', fontWeight: 500 }}>{res.translit}</span>}</p>
      </> : <>
        <h2 id="verdict" className="verdict"><Ico d={CLOSE} style={{ width: 44, height: 44, strokeWidth: 3.4 }} />Not quite</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p className="eyebrow" style={{ color: 'var(--c-ink)' }}>Correct answer</p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <p id="answer" lang={pack.voice} className="answer" style={{ flex: 1 }}>
              {parts.map((p, i) => <span key={i} className={p.hl ? 'hl' : ''}>{p.text} </span>)}
              {res.translit && <span className="small dim translit" style={{ display: 'block', fontWeight: 500 }}>{res.translit}</span>}
            </p>
            {audio}
          </div>
        </div>
      </>}
      {res.why && <p className="why"><span aria-hidden="true">💡</span><span>{res.why}</span></p>}
      {!ok && requeued && <p className="small" style={{ fontWeight: 600 }}>No stress. It comes back later this session.</p>}
      <A className="btn ink block" style={ok ? undefined : { color: 'var(--c-pink)' }} onClick={onContinue}>Continue</A>
    </section>
  </>;
}
