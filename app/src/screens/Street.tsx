import { speak } from '../engine/speech';
import { Ico, SPEAKER_SM } from '../ui';
import type { MeProps } from './Me';

const ROT = ['-1.2deg', '1deg', '-0.6deg', '1.4deg', '-1deg'];
const LABEL = { 1: 'mild', 2: 'spicy', 3: 'never at work' } as const;

export default function Street({ lang, profile }: MeProps) {
  const lock = !profile.streetEnabled;
  return <div className="grow scroll pad" style={{ paddingTop: 14, paddingBottom: 28, display: 'flex', flexDirection: 'column', gap: 22 }}>
    <div style={{ position: 'relative', padding: '6px 0 2px' }}>
      <p className="marker" style={{ fontSize: 40, lineHeight: 1, color: 'var(--c-pink)', transform: 'rotate(-4deg)', textShadow: '3px 3px 0 var(--c-ink)' }}>Street {lang.pack.nativeName}</p>
      <span className="sticker y" style={{ position: 'absolute', right: 4, top: 4, ['--rot' as string]: '8deg' }}>18+</span>
      <p className="small dim" style={{ marginTop: 10 }}>What people actually say. Know it before you use it.</p>
    </div>
    {lock && <div className="card" style={{ padding: 18, textAlign: 'center' }}><p style={{ fontWeight: 800 }}>Switched off</p><p className="small dim">Turn it on in Settings.</p></div>}
    {!lock && lang.street.map((s, i) =>
      <article key={s.id} className="paper tilt" style={{ ['--rot' as string]: ROT[i % 5], padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <h2 lang={lang.pack.voice} style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.15 }}>{s.target}</h2>
            <p style={{ fontWeight: 600, color: 'var(--c-ink-dim)' }}>{s.english}</p>
          </div>
          <button type="button" className="audio sm" aria-label={`Hear ${s.target}`} onClick={() => speak(s.target)}><Ico d={SPEAKER_SM} /></button>
        </div>
        <div className="rude" role="img" aria-label={`Rudeness ${s.rudeness} of 3: ${LABEL[s.rudeness]}`} style={{ marginTop: 12 }}>
          <span className={'l1' + (s.rudeness >= 1 ? ' on' : '')}><span aria-hidden="true">😏</span>mild</span>
          <span className={'l2' + (s.rudeness >= 2 ? ' on' : '')}><span aria-hidden="true">🌶️</span>spicy</span>
          <span className={'l3' + (s.rudeness >= 3 ? ' on' : '')}><span aria-hidden="true">🔥</span>never at work</span>
        </div>
        <p style={{ marginTop: 12, fontSize: 15 }}><b>When:</b> {s.whenToUse}</p>
        <p lang={lang.pack.voice} style={{ marginTop: 6, fontSize: 15, fontStyle: 'italic', paddingLeft: 10, borderLeft: '4px solid var(--c-ink)' }}>„{s.example}“</p>
      </article>)}
  </div>;
}
