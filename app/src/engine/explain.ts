// Feedback text built from the actual mistake (not the lesson's generic tip).
import { check, norm } from './check';

const toks = (s: string) => s.replace(/[.,!?¿¡"„“”…]/g, ' ').split(/\s+/).filter(Boolean);
const same = (a: string, b: string) => check(a, b).ok;
const q = (s: string) => `"${s}"`;
const list = (xs: string[]) => xs.map(q).join(', ');
const SUBJECTS = new Set(['ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'man']);

/** The lesson tip, only if it mentions a word from this answer (otherwise it's noise). */
export function relevantTip(tip: string | undefined, answer: string): string | undefined {
  if (!tip) return undefined;
  const t = norm(tip);
  return toks(answer).some((w) => w.length >= 3 && new RegExp(`(^|[^\\p{L}])${norm(w)}($|[^\\p{L}])`, 'u').test(t)) ? tip : undefined;
}

/** Typed / built sentence vs answer: wrong order, wrong word, missing, extra. */
export function explainDiff(given: string, answer: string): string {
  const g = toks(given), a = toks(answer);
  const missing = a.filter((w) => !g.some((x) => same(x, w)));
  const extra = g.filter((x) => !a.some((w) => same(x, w)));
  if (!missing.length && !extra.length) return 'Right words, wrong order. Read the answer once out loud.';
  if (missing.length === 1 && extra.length === 1) return `You wrote ${q(extra[0])}, but here it's ${q(missing[0])}.`;
  const parts = [];
  if (missing.length) parts.push(`Missing: ${list(missing)}.`);
  if (extra.length) parts.push(`Not needed: ${list(extra)}.`);
  return parts.join(' ');
}

/** Fill the gap: same word with the wrong ending, or just the wrong word. */
export function explainFill(before: string, after: string, picked: string, right: string, english: string): string {
  const full = (before + right + after).trim();
  let p = 0;
  while (p < picked.length && p < right.length && picked[p].toLowerCase() === right[p].toLowerCase()) p++;
  if (p >= 3) {
    const subj = toks(before).map((w) => w.toLowerCase()).reverse().find((w) => SUBJECTS.has(w));
    return `Same word, wrong ending. ${subj ? `With ${q(subj)} it's` : 'Here it needs'} ${q(right)}: ${q(full)} = ${q(english)}.`;
  }
  return `${q(picked)} doesn't fit here. ${q(full)} means ${q(english)}.`;
}

/** Dialogue: what they said, and why the picked reply doesn't answer it. */
export function explainDialogue(lastThem: { target: string; english: string } | undefined, picked: string, right: string): string {
  const said = lastThem ? `They said ${q(lastThem.target)} (${lastThem.english}). ` : '';
  return `${said}${q(right)} answers that. ${q(picked)} doesn't.`;
}

/** Speech: which target words were heard, in order, allowing misses in between. */
export function spokenMatch(words: string[], transcript: string): boolean[] {
  const heard = toks(transcript);
  let i = 0;
  return words.map((w) => {
    if (!norm(w)) return true; // a lone dash or ellipsis
    for (let j = i; j < heard.length; j++) if (same(heard[j], norm(w))) { i = j + 1; return true; }
    return false;
  });
}
