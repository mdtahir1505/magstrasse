import type { Episode } from '../types';
import type { Stats } from './Player';
import { Screen } from '../ui';

export default function Complete({ stats, streak, freezesLeft, done, bonus, episode, read, speed, voice }: {
  stats: Stats; streak: number; freezesLeft: number; done: () => void; bonus: (() => void) | null;
  episode: Episode | null; read: () => void; speed: (() => void) | null; voice: string;
}) {
  const up = streak > stats.streakBefore;
  return <Screen>
    <div className="pad" style={{ paddingTop: 8 }}>
      <div className="bar" role="progressbar" aria-label="Session progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={100}><i style={{ width: '100%' }} /></div>
    </div>

    <section className="pad" style={{ marginTop: 34, position: 'relative' }}>
      <h1 className="display" style={{ fontSize: 120, lineHeight: 0.82, color: 'var(--c-yellow)', textShadow: '6px 6px 0 var(--c-pink)' }}>Fertig.</h1>
      <span className="marker" style={{ position: 'absolute', right: 34, top: -10, fontSize: 30, color: 'var(--c-cyan)', transform: 'rotate(-10deg)' }}>done!</span>
      <p style={{ marginTop: 14, fontSize: 19, fontWeight: 700 }}>That's today. The rest of the day is yours.</p>
    </section>

    <section className="pad" style={{ marginTop: 30, display: 'flex', alignItems: 'center', gap: 18 }}>
      <div style={{ position: 'relative', width: 104, height: 124, flex: 'none' }}>
        <svg viewBox="0 0 30 36" aria-hidden="true" style={{ width: 104, height: 124, transformOrigin: '50% 90%', animation: 'flicker 1.8s ease-in-out infinite' }}>
          <path d="M15 1c3 7 11 11 11 21a11 11 0 0 1-22 0c0-6 3-9 5-13 1.5 3.5 3.5 5 4.5 5 0-5 .5-9 1.5-13z" style={{ fill: 'var(--c-pink)', stroke: 'var(--c-ink)', strokeWidth: 1.4, strokeLinejoin: 'round' }} />
          <path d="M15 18c2 3 5 5 5 9a5 5 0 0 1-10 0c0-3 2-4.5 3-6.5.6 1.4 1.4 2 2 2z" style={{ fill: 'var(--c-yellow)' }} />
        </svg>
        {up && <span className="sticker y" style={{ position: 'absolute', right: -16, top: 4, fontSize: 20, padding: '4px 10px', animation: 'plus-one 700ms var(--ease-snap) 300ms both' }}>+1</span>}
      </div>
      <div>
        <p className="eyebrow">Streak</p>
        <p className="display" style={{ fontSize: 64 }}>{streak} {streak === 1 ? 'day' : 'days'}</p>
        <p className="small dim">{up ? `was ${stats.streakBefore} · ` : ''}🧊 {freezesLeft} freeze in the bank</p>
      </div>
    </section>

    <ul className="pad" style={{ marginTop: 26, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
      <li className="paper tilt rise" style={{ ['--rot' as string]: '-3deg', padding: '12px 10px', textAlign: 'center', animationDelay: '100ms' }}><p className="display" style={{ fontSize: 40 }}>{stats.minutes}</p><p className="small" style={{ fontWeight: 700 }}>minutes</p></li>
      <li className="paper tilt rise" style={{ ['--rot' as string]: '2deg', padding: '12px 10px', textAlign: 'center', background: 'var(--c-cyan)', animationDelay: '200ms' }}><p className="display" style={{ fontSize: 40 }}>{stats.newWords}</p><p className="small" style={{ fontWeight: 700 }}>new words</p></li>
      <li className="paper tilt rise" style={{ ['--rot' as string]: '-1deg', padding: '12px 10px', textAlign: 'center', background: 'var(--c-yellow)', animationDelay: '300ms' }}><p className="display" style={{ fontSize: 40 }}>{stats.reviewed}</p><p className="small" style={{ fontWeight: 700 }}>reviewed</p></li>
    </ul>

    {episode && <section className="pad" style={{ marginTop: 22 }}>
      <div className="paper tilt rise" style={{ ['--rot' as string]: '1.2deg', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--c-cyan)', animationDelay: '400ms' }}>
        <span aria-hidden="true" style={{ display: 'grid', placeItems: 'center', width: 56, height: 56, flex: 'none', fontSize: 32, background: 'var(--c-paper)', border: '3px solid var(--c-ink)', borderRadius: 4 }}>{episode.panels[0]?.emoji ?? '📖'}</span>
        <div style={{ minWidth: 0 }}>
          <p className="eyebrow">Kiez Chronicles · Ep. {episode.n}</p>
          <p lang={voice} style={{ fontWeight: 800 }}>New episode: {episode.title}</p>
        </div>
      </div>
    </section>}

    <div className="foot" style={{ marginTop: 'auto' }}>
      {episode && <button type="button" className="btn block" onClick={read}>Read now</button>}
      <button type="button" className={'btn block' + (episode ? ' ghost' : '')} onClick={done}>Done</button>
      {(bonus || speed) && <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        {bonus && <button type="button" className="link" onClick={bonus}>Bonus story</button>}
        {speed && <button type="button" className="link" onClick={speed}>Speed round</button>}
      </div>}
    </div>
  </Screen>;
}
