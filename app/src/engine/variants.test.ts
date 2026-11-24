// Run: npx tsx src/engine/variants.test.ts  (article regex, regional localize)
import type { Lang } from '../types';
import { altLabel, articleRe, localize } from './variants';

let n = 0;
const t = (cond: boolean, msg: string) => { n++; if (!cond) throw new Error('FAIL: ' + msg); };

const de = { id: 'de', articles: { m: 'der', f: 'die', n: 'das' } } as never;
const es = { id: 'es', articles: { m: 'el', f: 'la', n: 'el' }, pluralArticles: ['los', 'las'],
  regions: [{ id: 'latam', label: 'Latin America', flag: '🌎', voice: 'es-MX' }, { id: 'spain', label: 'España', flag: '🇪🇸', voice: 'es-ES' }] } as never;
t(articleRe(de)!.test('Die Katze') && !articleRe(de)!.test('Dienst'), 'de articles, whole word');
t(articleRe(es)!.test('las casas') && articleRe(es)!.test('el carro'), 'es articles + plurals');
t(articleRe({ id: 'ru', articles: null } as never) === null, 'no articles, no regex');

const lang = { pack: es, stories: [], street: [], stages: [{ id: 's', title: '', level: 'A1', units: [{ id: 'u', title: '', lessons: [{ id: 'l', title: '', dialogue: undefined as never,
  items: [{ id: 'a', target: 'el carro', spain: 'el coche', english: 'car', gender: 'm', kind: 'word', example: { target: 'Tengo un carro.', spain: 'Tengo un coche.', english: 'I have a car.' } },
    { id: 'b', target: 'la casa', english: 'house', gender: 'f', kind: 'word' }],
  sentences: [{ target: '¿Tomamos el carro?', spain: '¿Cogemos el coche?', english: 'Shall we take the car?' }],
  fills: [{ before: '¿', after: ' el carro?', options: ['Tomamos', 'Cogemos', 'Comemos'], answer: 0, english: '', spain: { options: ['Cogemos', 'Tomamos', 'Comemos'], answer: 0, after: ' el coche?' } }] }] }] }] } as Lang;
const la = localize(lang, 'latam').stages[0].units[0].lessons[0], sp = localize(lang, 'spain').stages[0].units[0].lessons[0];
t(la.items[0].target === 'el carro' && altLabel(la.items[0]) === '🇪🇸 el coche', 'latam shows spain as hint');
t(sp.items[0].target === 'el coche' && altLabel(sp.items[0]) === '🌎 el carro', 'spain primary, latam hint');
t(sp.items[0].example!.target === 'Tengo un coche.' && sp.items[0].example!.alt === 'Tengo un carro.', 'example localized');
t(sp.sentences[0].target === '¿Cogemos el coche?' && sp.sentences[0].alt === '¿Tomamos el carro?', 'sentence localized');
t(altLabel(sp.items[1]) === undefined && sp.items[1].target === 'la casa', 'no spain form: unchanged, no hint');
t(la.fills[0].alt === 1 && sp.fills[0].answer === 0 && sp.fills[0].alt === 1 && sp.fills[0].after === ' el coche?', 'fill accepts the other variant');
console.log(`variants.test.ts: ${n} assertions passed`);
