import { useState } from 'react';
import { check } from '../engine/check';
import { explainDiff, relevantTip } from '../engine/explain';
import { checkLatin } from '../engine/translit';
import type { ExProps } from '../types';

const ART = /^(der|die|das)\s+/i;
const KEYS: Record<string, string[]> = { de: ['ä', 'ö', 'ü', 'ß'] };

export default function TypeIt({ ex, pack, done }: ExProps<'type'>) {
  const [text, setText] = useState('');
  const submit = () => {
    if (!text.trim()) return;
    const r = check(text, ex.answer, ex.alts);
    const latin = !r.ok && pack.id === 'ru' && checkLatin(text, ex.answer, ex.alts); // typed the Latin spelling: accepted, with a nudge
    if (latin) return done({ correct: true, answer: ex.answer, given: text, why: 'Correct! Next time try the Russian keyboard: Settings → General → Keyboard → Add → Russian.' });
    const wrongArticle = !r.ok && ART.test(ex.answer) && check(text.replace(ART, ''), ex.answer.replace(ART, '')).ok;
    done({ correct: r.ok, answer: ex.answer, given: text,
      why: wrongArticle ? `Right word, wrong article: ${ex.answer}.`
        : r.ok && r.umlaut ? `Watch the umlaut. It's spelled "${ex.answer}".`
        : r.ok ? relevantTip(ex.why, ex.answer)
        : explainDiff(text, ex.answer) });
  };
  return <>
    <h1 className="instruction pad" style={{ marginTop: 18 }}>Type it</h1>
    <div className="pad" style={{ marginTop: 14 }}>
      <div className="paper tilt" style={{ ['--rot' as string]: '1deg', padding: '14px 16px' }}>
        <p className="eyebrow">In {pack.name}, please</p>
        <p className="prompt" style={{ marginTop: 4 }}>{ex.prompt}</p>
      </div>
    </div>
    <div className="pad" style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label htmlFor="answer" className="eyebrow">Your answer</label>
      <input id="answer" className="field" lang={pack.voice} type="text" autoComplete="off" autoCapitalize="sentences" spellCheck={false}
        placeholder={pack.id in KEYS ? 'Tippen…' : 'Type here…'} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
      <div className="keys" role="group" aria-label="Special characters">
        {(KEYS[pack.id] ?? []).map((c) => <button key={c} type="button" className="char-key" aria-label={`Insert ${c}`} onClick={() => setText(text + c)}>{c}</button>)}
      </div>
      <p className="small dim">{pack.id === 'ru' ? 'No Russian keyboard? Type it in Latin letters (privet) and it still counts.' : "Typos in umlauts? Close enough counts. We'll show you the fix."}</p>
    </div>
    <div className="foot" style={{ marginTop: 'auto' }}>
      <button type="button" className={'btn block' + (text.trim() ? '' : ' off')} disabled={!text.trim()} onClick={submit}>Check</button>
    </div>
  </>;
}
