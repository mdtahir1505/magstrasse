import { stickerDefs, type Sticker } from '../engine/stickers';
import type { MeProps } from './Me';

const ROT = ['-4deg', '3deg', '-2deg', '5deg', '-5deg', '2deg'];
const Big = ({ s, i, locked }: { s: Sticker; i: number; locked?: boolean }) =>
  <span className={`sticker big ${locked ? 'locked' : s.rarity}`} style={{ ['--rot' as string]: ROT[i % ROT.length] }}>
    <span className="em" aria-hidden="true">{locked ? '?' : s.emoji}</span>
    <span className="word">{locked ? '???' : s.text}</span>
  </span>;

/** Me → Stickers: the wall. Locked ones are dark silhouettes with a hint. */
export default function Stickers({ lang, stored }: MeProps) {
  const defs = stickerDefs(lang);
  const have = new Map(stored.stickers.map((s) => [s.id, s.at]));
  const n = defs.filter((d) => have.has(d.id)).length;
  return <div className="grow scroll pad" style={{ paddingTop: 14, paddingBottom: 28 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
      <p className="marker" style={{ fontSize: 34, lineHeight: 1, color: 'var(--c-cyan)', transform: 'rotate(-3deg)' }}>Sticker wall</p>
      <p className="small dim" aria-label={`${n} of ${defs.length} stickers`}><b style={{ color: 'var(--c-yellow)' }}>{n}</b> / {defs.length}</p>
    </div>
    <ul className="wall">
      {defs.map((d, i) => {
        const at = have.get(d.id);
        return <li key={d.id} className="slot">
          <Big s={d} i={i} locked={!at} />
          <p className="small dim" style={{ fontWeight: 600 }}>{at ? <><span className="legend">{{ c: 'Common', y: 'Rare', p: 'Epic' }[d.rarity]}</span> · {d.hint}</> : d.hint}</p>
        </li>;
      })}
    </ul>
  </div>;
}

/** "New sticker!" peel-off card, shown over the end-of-session screens. Handles a queue. */
export function Peel({ list, close }: { list: Sticker[]; close: () => void }) {
  const s = list[0];
  return <div className="peel-scrim" role="alertdialog" aria-label="New sticker">
    <div className="peel-card paper rise">
      <p className="marker" style={{ fontSize: 30, color: 'var(--c-pink)', transform: 'rotate(-4deg)' }}>New sticker!</p>
      <div key={s.id} className="peel" style={{ margin: '18px 0 10px' }}><Big s={s} i={list.length} /></div>
      <p style={{ fontWeight: 700 }}>{s.hint}</p>
      <button type="button" className="btn block" style={{ marginTop: 18 }} onClick={close} autoFocus>{list.length > 1 ? `Stick it (${list.length - 1} more)` : 'Stick it'}</button>
    </div>
  </div>;
}
