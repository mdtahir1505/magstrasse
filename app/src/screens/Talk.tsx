import { Screen, Tab, TabBar } from '../ui';

export default function Talk({ go, practise }: { go: (t: Tab) => void; practise: () => void }) {
  return <Screen>
    <section className="pad" style={{ marginTop: 14, position: 'relative' }}>
      <div className="paper torn tilt" style={{ ['--rot' as string]: '1.5deg', padding: '20px 20px 36px', background: 'var(--c-pink)', position: 'relative', overflow: 'hidden' }}>
        <div className="halftone" aria-hidden="true" style={{ position: 'absolute', inset: 0, color: 'var(--c-ink)', opacity: 0.18 }} />
        <p className="eyebrow" style={{ position: 'relative', color: 'var(--c-ink)' }}>Talk · AI conversation partner</p>
        <h1 className="display" style={{ position: 'relative', fontSize: 104, lineHeight: 0.82, marginTop: 8 }}>Bald.</h1>
        <p style={{ position: 'relative', marginTop: 10, fontSize: 18, fontWeight: 700 }}>Coming soon. Real back-and-forth with a partner who never sighs at your grammar.</p>
      </div>
      <span className="sticker y" style={{ position: 'absolute', left: 30, bottom: -12, ['--rot' as string]: '-5deg' }}>Not open yet</span>
    </section>

    <section className="pad" style={{ marginTop: 34 }} aria-label="Preview: café role-play, locked">
      <div className="card" style={{ position: 'relative', padding: 16, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ fontWeight: 800 }}>Role-play: Café Kotti</p>
          <span className="sticker c" style={{ ['--rot' as string]: '3deg' }}>A1</span>
        </div>
        <div className="chat" lang="de" aria-hidden="true" style={{ filter: 'blur(3px)', opacity: 0.7 }}>
          <div className="bubble-row them"><div className="bubble them"><p className="t">Na, was darf's sein?</p></div></div>
          <div className="bubble-row me"><div className="bubble me"><p className="t">Einen Flat White, bitte.</p></div></div>
          <div className="bubble-row them"><div className="bubble them"><p className="t">Hafermilch oder normal?</p></div></div>
        </div>
        <div style={{ position: 'absolute', inset: '44px 0 0', display: 'grid', placeItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'grid', placeItems: 'center', width: 60, height: 60, borderRadius: '50%', border: '3px solid var(--c-ink)', background: 'var(--c-paper)', color: 'var(--c-ink)', boxShadow: 'var(--shadow-sm)' }}>
              <svg className="ico" viewBox="0 0 24 24" aria-hidden="true" style={{ width: 28, height: 28 }}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
            </span>
            <span className="small" style={{ fontWeight: 800, background: 'var(--c-ink)', padding: '2px 8px', borderRadius: 4 }}>Locked</span>
          </div>
        </div>
      </div>
    </section>

    <div className="foot" style={{ marginTop: 'auto', paddingBottom: 16 }}>
      <button type="button" className="btn block" onClick={practise}>Practise dialogues now</button>
    </div>
    <TabBar tab="talk" go={go} />
  </Screen>;
}
