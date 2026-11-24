// Answer normalising + checking.
export const norm = (s: string) =>
  s.toLowerCase().replace(/[.,!?¿¡"'„“”‚‘’]/g, '').replace(/\s+/g, ' ').trim();

const ascii = (s: string) => s.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
// Latin diacritics dropped (café→cafe, Käse→Kase, mañana→manana). Cyrillic is left alone: й ≠ и.
const bare = (s: string) => /\p{Script=Cyrillic}/u.test(s) ? s : s.replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');

/** 'exact' | 'translit' (ae/oe/ue/ss typed for ä/ö/ü/ß: fine) | 'accent' (accents/umlauts dropped: accepted, flag it) | null */
function tokenMatch(inp: string, ans: string): 'exact' | 'translit' | 'accent' | null {
  if (inp === ans) return 'exact';
  if (ascii(inp) === ascii(ans)) return 'translit';
  if (bare(inp) === bare(ans)) return 'accent';
  return null;
}

export function check(input: string, answer: string, alts: string[] = []): { ok: boolean; accent: boolean } {
  const a = norm(input).split(' ');
  let best: { ok: boolean; accent: boolean } = { ok: false, accent: false };
  for (const cand of [answer, ...alts]) {
    const b = norm(cand).split(' ');
    if (a.length !== b.length || !a[0]) continue;
    const ms = a.map((t, i) => tokenMatch(t, b[i]));
    if (ms.some((m) => m === null)) continue;
    const r = { ok: true, accent: ms.includes('accent') };
    if (!best.ok || (best.accent && !r.accent)) best = r;
  }
  return best;
}

/** Build tiles: same rules, token by token. */
export const checkTokens = (placed: string[], answer: string[], alt?: string[]) => check(placed.join(' '), answer.join(' '), alt && [alt.join(' ')]).ok;
