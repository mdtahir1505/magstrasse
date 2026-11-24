import { useState } from 'react';
import { check } from '../engine/check';
import { explainDiff, relevantTip } from '../engine/explain';
import { checkLatin } from '../engine/translit';
import { articleRe } from '../engine/variants';
import type { ExProps } from '../types';

const DE_KEYS = ['ä', 'ö', 'ü', 'ß']; // fallback while de/pack.json has no `keys`

export default function TypeIt({ ex, pack, done }: ExProps<'type'>) {
  const [text, setText] = useState('');
  const art = articleRe(pack), keys = pack.keys ?? (pack.id === 'de' ? DE_KEYS : []);
  const submit = () => {
    if (!text.trim()) return;
    const r = check(text, ex.answer, ex.alts);
    const latin = !r.ok && pack.id === 'ru' && checkLatin(text, ex.answer, ex.alts); // typed the Latin spelling: accepted, with a nudge
    if (latin) return done({ correct: true, answer: ex.answer, given: text, why: 'Correct! Next time try the Russian keyboard: Settings → General → Keyboard → Add → Russian.' });
    const wrongArticle = !r.ok && !!art && art.test(ex.answer) && check(text.replace(art, ''), ex.answer.replace(art, '')).ok;
    done({ correct: r.ok, answer: ex.answer, given: text, hint: ex.hint,
      why: wrongArticle ? `Right word, wrong article: ${ex.answer}.`
        : r.ok && r.accent ? `Watch the ${/[äöüß]/i.test(ex.answer) ? 'umlaut' : 'accents'}. It's spelled "${ex.answer}".`
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
        placeholder={pack.id === 'de' ? 'Tippen…' : 'Type here…'} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
      <div className="keys" role="group" aria-label="Special characters">
        {keys.map((c) => <button key={c} type="button" className="char-key" aria-label={`Insert ${c}`} onClick={() => setText(text + c)}>{c}</button>)}
      </div>
      <p className="small dim">{pack.id === 'ru' ? 'No Russian keyboard? Type it in Latin letters (privet) and it still counts.' : "Missed an accent? Close enough counts. We'll show you the fix."}</p>
    </div>
    <div className="foot" style={{ marginTop: 'auto' }}>
      <button type="button" className={'btn block' + (text.trim() ? '' : ' off')} disabled={!text.trim()} onClick={submit}>Check</button>
    </div>
  </>;
}
