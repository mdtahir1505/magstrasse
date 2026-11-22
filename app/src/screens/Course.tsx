import { flatLessons } from '../content';
import type { Progress } from '../engine/storage';
import type { Lang } from '../types';
import { Screen, Tab, TabBar } from '../ui';

const COLORS = ['var(--c-yellow)', 'var(--c-cyan)', 'var(--c-pink)'];
type St = 'locked' | 'current' | 'done';

export default function Course({ lang, progress, go }: { lang: Lang; progress: Progress; go: (t: Tab) => void }) {
  // first lesson not done is current; everything after is locked
  const firstOpen = flatLessons(lang).find((f) => !progress.lessonsDone.includes(f.lesson.id))?.lesson.id;
  const state = (id: string): St => {
    if (progress.lessonsDone.includes(id)) return 'done';
    if (id === firstOpen) { return 'current'; }
    return 'locked';
  };
  let nextStop = '';
  const stages = lang.stages.map((st, si) => {
    const units = st.units.map((u) => {
      const ls = u.lessons.map((l) => state(l.id));
      const s: St = ls.includes('current') ? 'current' : ls.length && ls.every((x) => x === 'done') ? 'done' : 'locked';
      if (s === 'current') nextStop = u.title;
      return { u, ls, s };
    });
    const all = units.flatMap((x) => x.ls);
    return { st, si, units, total: all.length, doneCount: all.filter((x) => x === 'done').length };
  });

  return <Screen>
    <header className="pad" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 14, borderBottom: '2px solid var(--c-surface-2)' }}>
      <div>
        <p className="eyebrow">Linienplan</p>
        <h1 className="display" style={{ fontSize: 48 }}>Course</h1>
      </div>
      {nextStop && <div style={{ textAlign: 'right' }}>
        <p className="small dim" style={{ fontWeight: 700 }}>Next stop</p>
        <p style={{ fontWeight: 800 }}>{nextStop}</p>
      </div>}
    </header>

    <div className="grow scroll pad" style={{ paddingTop: 18 }}>
      {stages.map(({ st, si, units, total, doneCount }) =>
        <section key={st.id} style={{ ['--line' as string]: COLORS[si % 3], marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <span className="line-badge" style={{ background: COLORS[si % 3] }}>L{si + 1}</span>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>{st.title}</h2>
              <p className="small dim">{st.level} · {doneCount}/{total} lessons</p>
            </div>
          </div>
          <ol>
            {units.map(({ u, ls, s }) =>
              <li key={u.id} className={'station ' + s}>
                <div className="rail"><span className="stop" aria-hidden="true"></span></div>
                <div className="sign">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <p lang={lang.pack.voice} style={{ fontWeight: 800, fontSize: 17 }}>{u.title}</p>
                    {s === 'current' && <span className="sticker y" style={{ ['--rot' as string]: '4deg' }}>You're here</span>}
                    {s === 'locked' && <svg className="ico" viewBox="0 0 24 24" aria-label="Locked" role="img" style={{ width: 18, height: 18 }}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>}
                  </div>
                  <div className="dots" role="img" aria-label={`${ls.filter((x) => x === 'done').length} of ${ls.length} lessons done`}>
                    {ls.map((x, i) => <span key={i} className={'dot ' + x}></span>)}
                  </div>
                </div>
              </li>)}
          </ol>
        </section>)}
      {!stages.length && <p className="dim">No lessons yet.</p>}
    </div>
    <TabBar tab="course" go={go} />
  </Screen>;
}
