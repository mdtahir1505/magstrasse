// Answer normalising + checking.
export const norm = (s: string) =>
  s.toLowerCase().replace(/[.,!?¿¡"'„“”‚‘’]/g, '').replace(/\s+/g, ' ').trim();

const ascii = (s: string) => s.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
const bare = (s: string) => s.replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss');

/** 'exact' | 'translit' (ae/oe/ue/ss typed for ä/ö/ü/ß: fine) | 'umlaut' (umlaut dropped: accepted, flag it) | null */
function tokenMatch(inp: string, ans: string): 'exact' | 'translit' | 'umlaut' | null {
  if (inp === ans) return 'exact';
  if (ascii(inp) === ascii(ans)) return 'translit';
  if (bare(inp) === bare(ans)) return 'umlaut';
  return null;
}

export function check(input: string, answer: string, alts: string[] = []): { ok: boolean; umlaut: boolean } {
  const a = norm(input).split(' ');
  let best: { ok: boolean; umlaut: boolean } = { ok: false, umlaut: false };
  for (const cand of [answer, ...alts]) {
    const b = norm(cand).split(' ');
    if (a.length !== b.length || !a[0]) continue;
    const ms = a.map((t, i) => tokenMatch(t, b[i]));
    if (ms.some((m) => m === null)) continue;
    const r = { ok: true, umlaut: ms.includes('umlaut') };
    if (!best.ok || (best.umlaut && !r.umlaut)) best = r;
  }
  return best;
}

/** Build tiles: same rules, token by token. */
export const checkTokens = (placed: string[], answer: string[]) => check(placed.join(' '), answer.join(' ')).ok;
