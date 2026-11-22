import { useState } from 'react';
import { allItems } from '../content';
import { speak } from '../engine/speech';
import { strength } from '../engine/srs';
import type { Gender } from '../types';
import { Ico, nounOnly, Tag } from '../ui';
import type { MeProps } from './Me';

export default function WordBank({ lang, progress }: MeProps) {
  const [q, setQ] = useState('');
  const [gender, setGender] = useState<Gender>(null);
  const [weak, setWeak] = useState(false);
  const [stage, setStage] = useState<number | null>(null);

  const learned = allItems(lang).filter((i) => progress.cards[i.id]).map((i) => ({ ...i, strength: strength(progress.cards[i.id]) }));
  const shown = learned.filter((it) =>
    (!q || (it.target + ' ' + it.english).toLowerCase().includes(q.toLowerCase())) &&
    (!gender || it.gender === gender) && (!weak || it.strength <= 2) && (stage === null || it.stageIdx === stage));

  return <>
    <div className="pad" style={{ marginTop: 12 }}>
      <label className="search">
        <svg className="ico" viewBox="0 0 24 24" aria-hidden="true" style={{ color: 'var(--c-text-dim)' }}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
        <input type="search" placeholder={`Search ${learned.length} words`} aria-label="Search words" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 4 }} role="group" aria-label="Filters">
        <button type="button" className={'chip dark' + (stage !== null ? ' sel' : '')} onClick={() => setStage(stage === null ? 0 : stage + 1 < lang.stages.length ? stage + 1 : null)}>{stage === null ? 'All stages' : `Stage ${stage + 1}`} ▾</button>
        {(['m', 'f', 'n'] as const).map((g) =>
          <button key={g} type="button" className={'chip dark' + (gender === g ? ' sel' : '')} aria-pressed={gender === g} onClick={() => setGender(gender === g ? null : g)}>
            <span className={'tag ' + g} style={{ fontSize: 13 }}>{lang.pack.articles?.[g]}</span>
          </button>)}
        <button type="button" className={'chip dark' + (weak ? ' sel' : '')} aria-pressed={weak} onClick={() => setWeak(!weak)}>Weak only</button>
      </div>
    </div>

    <ul className="grow scroll pad" style={{ paddingTop: 6 }}>
      {shown.map((it) =>
        <li key={it.id}>
          <button type="button" className="wrow row" onClick={() => speak(it.target)} aria-label={`Hear ${it.target}, ${it.english}, strength ${it.strength} of 5`}>
            <span aria-hidden="true" style={{ fontSize: 26, width: 34, textAlign: 'center' }}>{it.emoji}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span lang={lang.pack.voice} style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 18 }}>
                <Tag g={it.gender} articles={lang.pack.articles} size={14} />{nounOnly(it)}
              </span>
              <span className="small dim" style={{ display: 'block' }}>{it.english}</span>
            </span>
            <span className="meter" aria-hidden="true">{[1, 2, 3, 4, 5].map((n) => <i key={n} className={n <= it.strength ? 'on' : ''}></i>)}</span>
            <Ico d={['M4 9h4l5-4v14l-5-4H4z', 'M16.5 8.5a5 5 0 0 1 0 7']} style={{ width: 20, height: 20, color: 'var(--c-cyan)' }} />
          </button>
        </li>)}
      {!shown.length && <li className="dim" style={{ padding: '40px 0', textAlign: 'center' }}>{learned.length ? 'Nothing here. Try a different filter.' : 'Words you learn show up here.'}</li>}
    </ul>
  </>;
}
