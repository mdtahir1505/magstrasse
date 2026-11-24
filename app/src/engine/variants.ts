// Pack-driven helpers: article regex and regional variants (es: Latin America / Spain).
import type { Fill, Lang, Pack, Variant } from '../types';

/** Leading article of a noun target, built from pack.articles + pluralArticles (null: language has none). */
export const articleRe = (p: Pack) => {
  const w = [...new Set([...Object.values(p.articles ?? {}), ...(p.pluralArticles ?? [])])];
  return w.length ? new RegExp(`^(${w.join('|')})\\s+`, 'i') : null;
};

export const regionOf = (p: Pack, id: string) => p.regions?.find((r) => r.id === id) ?? p.regions?.[0];
export const altLabel = (x: Variant) => (x.alt ? `${x.altFlag} ${x.alt}` : undefined);

/**
 * Make the chosen region's form the main `target` and the other the `alt` hint.
 * regions[0] is the base (the plain `target`); regions[1] names the content field (item.spain) holding the other form.
 * ponytail: two regions only; a third would need a pick of which one to show as the hint.
 */
export function localize(lang: Lang, regionId: string): Lang {
  const rs = lang.pack.regions, r = regionOf(lang.pack, regionId);
  if (!rs || rs.length < 2 || !r) return lang;
  const [base, other] = rs, onBase = r === base;
  const v = <T extends { target: string } & Variant>(x: T): T => {
    const o = x.spain; // `spain` is the only variant field
    if (!o) return x;
    return onBase ? { ...x, alt: o, altFlag: other.flag } : { ...x, target: o, alt: x.target, altFlag: base.flag };
  };
  const fill = (f: Fill): Fill => {
    if (!f.spain) return f;
    const sp = { ...f, ...f.spain };
    const [a, b] = onBase ? [f, sp] : [sp, f];
    const i = a.options.indexOf(b.options[b.answer]);
    return { ...a, alt: i >= 0 && i !== a.answer ? i : undefined };
  };
  return { ...lang, stages: lang.stages.map((s) => ({ ...s, units: s.units.map((u) => ({ ...u, lessons: u.lessons.map((l) => ({ ...l,
    items: l.items.map((i) => ({ ...v(i), example: i.example && v(i.example) })),
    sentences: l.sentences.map(v), fills: l.fills.map(fill) })) })) })) };
}
