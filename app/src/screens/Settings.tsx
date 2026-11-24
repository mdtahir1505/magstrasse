import { useRef, useState } from 'react';
import { disableLock, isLockEnabled, lockAvailable } from '../engine/lock';
import { exportJson, importJson, reset, setLanguage } from '../engine/storage';
import { hasTranslit, langChoices } from '../engine/langs';
import { regionOf } from '../engine/variants';
import Lock from './Lock';
import type { MeProps } from './Me';

export default function Settings({ lang, stored, profile, progress, update, replace }: MeProps) {
  const file = useRef<HTMLInputElement>(null);
  const [lockFlow, setLockFlow] = useState<null | 'set' | 'verify-change' | 'verify-off'>(null);
  const [lockOn, setLockOn] = useState(isLockEnabled);
  const avail = lockAvailable();
  const set = (p: Partial<typeof stored>) => update((s) => { Object.assign(s.profile, p); });
  const langs = langChoices().map((l) => ({ code: l.code, label: l.native + (l.available ? '' : ' · soon'), available: l.available }));

  const doExport = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([exportJson({ profile: stored, progress })], { type: 'application/json' }));
    a.download = `strasse-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    set({ lastBackup: new Date().toLocaleDateString() });
  };
  const doImport = async (f?: File) => {
    if (!f) return;
    try {
      const s = importJson(await f.text());
      if (window.confirm('Replace everything in the app with this backup?')) replace(s);
    } catch { window.alert("That file isn't a STRASSE backup."); }
    if (file.current) file.current.value = '';
  };
  const doReset = () => {
    if (!window.confirm('Reset all progress? Words, streak and settings will be erased.')) return;
    if (window.confirm('Really? This cannot be undone.')) replace(reset(stored.language));
  };

  if (lockFlow) {
    const end = () => setLockFlow(null);
    if (lockFlow === 'set') return <Lock mode="set" onCancel={end} onDone={() => { setLockOn(true); end(); }} />;
    return <Lock mode="verify" onCancel={end} onDone={() => { if (lockFlow === 'verify-off') { disableLock(); setLockOn(false); end(); } else setLockFlow('set'); }} />;
  }

  return <div className="grow scroll pad" style={{ paddingTop: 14, paddingBottom: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
    <section>
      <p className="eyebrow" style={{ marginBottom: 8 }}>Learning</p>
      <div className="card group">
        <div className="set">
          <span className="lbl">Language</span>
          <div className="seg" role="radiogroup" aria-label="Active language">
            {langs.map((l) => <button key={l.code} type="button" role="radio" aria-checked={l.code === stored.language} className={'chip dark' + (l.code === stored.language ? ' sel' : '')} disabled={!l.available} onClick={() => update((s) => setLanguage(s, l.code))}>{l.label}</button>)}
          </div>
        </div>
        {lang.pack.regions && <div className="set" style={{ flexWrap: 'wrap' }}>
          <span className="lbl">Accent<span className="sub">Voice, and which word is the main one</span></span>
          <div className="seg" role="radiogroup" aria-label="Accent">
            {lang.pack.regions.map((r) => { const on = r.id === (regionOf(lang.pack, progress.region)?.id);
              return <button key={r.id} type="button" role="radio" aria-checked={on} className={'chip dark' + (on ? ' sel' : '')} onClick={() => update((s) => { s.progress.region = r.id; })}>{r.flag} {r.label}</button>; })}
          </div>
        </div>}
        {hasTranslit(lang.pack) && <div className="set" style={{ flexWrap: 'wrap' }}>
          <span className="lbl">Latin spelling<span className="sub">Show how it sounds in Latin letters</span></span>
          <div className="seg" role="radiogroup" aria-label="Latin spelling">
            {(['auto', 'always', 'never'] as const).map((m) => <button key={m} type="button" role="radio" aria-checked={m === stored.translit} className={'chip dark' + (m === stored.translit ? ' sel' : '')} onClick={() => set({ translit: m })}>{m[0].toUpperCase() + m.slice(1)}</button>)}
          </div>
        </div>}
        <div className="set" style={{ flexWrap: 'wrap' }}>
          <span className="lbl">Daily goal</span>
          <div className="seg" role="radiogroup" aria-label="Daily goal in minutes">
            {[5, 15, 30, 45].map((m) => <button key={m} type="button" role="radio" aria-checked={m === stored.dailyGoalMin} className={'chip dark' + (m === stored.dailyGoalMin ? ' sel' : '')} onClick={() => set({ dailyGoalMin: m })} style={{ minWidth: 44, minHeight: 44 }}>{m}</button>)}
          </div>
        </div>
        <label className="set">
          <span className="lbl">Reminder</span>
          <input className="tm" type="time" value={stored.reminder} onChange={(e) => set({ reminder: e.target.value })} />
        </label>
        <div className="set" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><label htmlFor="speed" className="lbl">Voice speed</label><b style={{ color: 'var(--c-yellow)' }}>{stored.voiceSpeed.toFixed(1)}×</b></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span aria-hidden="true">🐢</span>
            <input id="speed" className="range" type="range" min="0.6" max="1.2" step="0.1" value={stored.voiceSpeed} onChange={(e) => set({ voiceSpeed: Number(e.target.value) })} />
            <span aria-hidden="true">⚡</span>
          </div>
        </div>
        <div className="set">
          <span className="lbl">Street {lang.pack.name} <span className="sticker p" style={{ ['--rot' as string]: '-4deg', marginLeft: 4 }}>18+</span><span className="sub">Slang &amp; swearing section</span></span>
          <label className="switch"><input type="checkbox" aria-label={`Street ${lang.pack.name}`} checked={profile.streetEnabled} onChange={(e) => set({ streetEnabled: e.target.checked })} /><span></span></label>
        </div>
      </div>
    </section>

    <section>
      <p className="eyebrow" style={{ marginBottom: 8 }}>Privacy</p>
      <div className="card group">
        <div className="set">
          <span className="lbl">App lock<span className="sub">{avail ? 'Ask for a 4-digit PIN on open' : 'Needs the installed app (https)'}</span></span>
          {lockOn
            ? <div className="seg">
                <button type="button" className="chip dark" onClick={() => setLockFlow('verify-change')}>Change PIN</button>
                <button type="button" className="chip dark" onClick={() => setLockFlow('verify-off')}>Turn off</button>
              </div>
            : <label className="switch"><input type="checkbox" aria-label="App lock" disabled={!avail} checked={false} onChange={() => setLockFlow('set')} /><span></span></label>}
        </div>
      </div>
    </section>

    <section>
      <p className="eyebrow" style={{ marginBottom: 8 }}>Backup</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        <button type="button" className="btn ghost" style={{ fontSize: 18, minHeight: 52 }} onClick={doExport}>Export</button>
        <button type="button" className="btn ghost" style={{ fontSize: 18, minHeight: 52 }} onClick={() => file.current?.click()}>Import</button>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => doImport(e.target.files?.[0])} />
      </div>
      <p className="small dim" style={{ marginTop: 8 }}>Saves words, streak and settings to one file. Last backup: {stored.lastBackup || 'never'}.</p>
    </section>

    <section>
      <p className="eyebrow" style={{ marginBottom: 8 }}>Danger zone</p>
      <button type="button" className="btn ghost block" style={{ borderColor: 'var(--c-pink)', color: 'var(--c-pink)', fontSize: 18, minHeight: 52 }} onClick={doReset}>Reset all progress</button>
      <p className="small dim" style={{ marginTop: 8 }}>Asks twice. Export first if you might want it back.</p>
    </section>
  </div>;
}
