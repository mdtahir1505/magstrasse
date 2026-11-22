// Run: npx tsx src/engine/check.test.ts
import { check, checkTokens, norm } from './check';

let n = 0;
const t = (cond: boolean, msg: string) => { n++; if (!cond) throw new Error('FAIL: ' + msg); };

t(norm('  Ich  hätte, gern!? ') === 'ich hätte gern', 'norm strips punctuation + spaces');
t(check('Ich hätte gern einen Kaffee', 'Ich hätte gern einen Kaffee.').ok, 'exact, punctuation ignored');
t(check('ich haette gern einen kaffee', 'Ich hätte gern einen Kaffee.').ok, 'ae -> ä accepted');
t(!check('ich haette gern einen kaffee', 'Ich hätte gern einen Kaffee.').umlaut, 'ae is not flagged');
t(check('Strasse', 'Straße').ok, 'ss -> ß accepted');
t(check('Kase', 'Käse').ok && check('Kase', 'Käse').umlaut, 'missing umlaut accepted but flagged');
t(check('Kaese', 'Käse').ok && !check('Kaese', 'Käse').umlaut, 'oe/ae digraph not flagged');
t(!check('Ich habe gern einen Kaffee', 'Ich hätte gern einen Kaffee').ok, 'wrong word rejected');
t(!check('Ich hätte gern Kaffee', 'Ich hätte gern einen Kaffee').ok, 'missing word rejected');
t(!check('', 'Kaffee').ok, 'empty rejected');
t(check('der Kaffee', 'Kaffee', ['der Kaffee']).ok, 'alt accepted');
t(check('KAFFEE', 'Kaffee').ok, 'case ignored');
t(checkTokens(['Ich', 'hätte', 'gern'], ['Ich', 'hätte', 'gern']), 'tokens equal');
t(!checkTokens(['hätte', 'Ich', 'gern'], ['Ich', 'hätte', 'gern']), 'tokens order matters');
console.log(`check.test.ts: ${n} assertions passed`);
