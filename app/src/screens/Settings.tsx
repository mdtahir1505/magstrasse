import { useRef } from 'react';
import { exportJson, importJson, reset } from '../engine/storage';
import { packs } from '../content';
import type { MeProps } from './Me';

export default function Settings({ lang, stored, profile, progress, update, replace }: MeProps) {
  const file = useRef<HTMLInputElement>(null);
  const set = (p: Partial<typeof stored>) => update((s) => { Object.assign(s.profile, p); });
  const langs = [...packs().map((p) => ({ code: p.id, label: p.nativeName, available: true })), { code: 'ru', label: 'Русский · soon', available: false }];

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

  return <div className="grow scroll pad" style={{ paddingTop: 14, paddingBottom: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
    <section>
      <p className="eyebrow" style={{ marginBottom: 8 }}>Learning</p>
      <div className="card group">
        <div className="set">
          <span className="lbl">Language</span>
          <div className="seg" role="radiogroup" aria-label="Active language">
            {langs.map((l) => <button key={l.code} type="button" role="radio" aria-checked={l.code === stored.language} className={'chip dark' + (l.code === stored.language ? ' sel' : '')} disabled={!l.available} onClick={() => set({ language: l.code })}>{l.label}</button>)}
          </div>
        </div>
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
