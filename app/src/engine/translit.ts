// Russian: Cyrillic -> Latin, and a forgiving Latin comparison so people without a Russian keyboard can still answer.
import { norm } from './check';

const MAP: Record<string, string> = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n',
  о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ь: '', ы: 'y', э: 'e', ю: 'yu', я: 'ya' };

export const hasCyrillic = (s: string) => /[Ѐ-ӿ]/.test(s);
export const toLatin = (s: string) => [...s.toLowerCase().normalize('NFC').replace(/́/g, '')].map((c) => MAP[c] ?? c).join('');

/** Collapse the usual spelling variants so both sides land on one skeleton (applied to the answer's Latin AND the typed text). */
export const skeleton = (s: string) => norm(s).normalize('NFC')
  .replace(/[ʹʼ`’]/g, '')
  .replace(/š/g, 'sh').replace(/č/g, 'ch').replace(/ž/g, 'zh').replace(/щ/g, 'shch')
  .replace(/shch|sch/g, 'sc').replace(/sh/g, 'S').replace(/ch/g, 'C').replace(/zh/g, 'Z').replace(/kh/g, 'K').replace(/ts/g, 'T') // protect digraphs
  .replace(/c/g, 'T').replace(/x/g, 'K').replace(/(?<![SCZKT])h/g, 'K').replace(/w/g, 'v').replace(/j/g, 'y')                         // c = ts, x/h = kh
  .replace(/y[eo]|ё/g, 'e').replace(/(?:iy|ii|yy)\b/g, 'y').replace(/([aeiou])y/g, '$1i')                                     // ye/yo/ё = e; -iy/-ii/-yy = -y; ay = ai
  .replace(/(.)\1+/g, '$1');                                                                                                      // double letters

/** Typed Latin transliteration of the Cyrillic answer (or one of its alts). */
export const checkLatin = (input: string, answer: string, alts: string[] = []) =>
  !hasCyrillic(input) && !!norm(input) && [answer, ...alts].some((a) => skeleton(toLatin(a)) === skeleton(input));
