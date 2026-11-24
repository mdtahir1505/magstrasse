// Run: npx tsx src/engine/check.test.ts
import { check, checkTokens, norm } from './check';

let n = 0;
const t = (cond: boolean, msg: string) => { n++; if (!cond) throw new Error('FAIL: ' + msg); };

t(norm('  Ich  hätte, gern!? ') === 'ich hätte gern', 'norm strips punctuation + spaces');
t(check('Ich hätte gern einen Kaffee', 'Ich hätte gern einen Kaffee.').ok, 'exact, punctuation ignored');
t(check('ich haette gern einen kaffee', 'Ich hätte gern einen Kaffee.').ok, 'ae -> ä accepted');
t(!check('ich haette gern einen kaffee', 'Ich hätte gern einen Kaffee.').accent, 'ae is not flagged');
t(check('Strasse', 'Straße').ok, 'ss -> ß accepted');
t(check('Kase', 'Käse').ok && check('Kase', 'Käse').accent, 'missing umlaut accepted but flagged');
t(check('Kaese', 'Käse').ok && !check('Kaese', 'Käse').accent, 'oe/ae digraph not flagged');
t(!check('Ich habe gern einen Kaffee', 'Ich hätte gern einen Kaffee').ok, 'wrong word rejected');
t(!check('Ich hätte gern Kaffee', 'Ich hätte gern einen Kaffee').ok, 'missing word rejected');
t(!check('', 'Kaffee').ok, 'empty rejected');
t(check('der Kaffee', 'Kaffee', ['der Kaffee']).ok, 'alt accepted');
t(check('KAFFEE', 'Kaffee').ok, 'case ignored');
t(checkTokens(['Ich', 'hätte', 'gern'], ['Ich', 'hätte', 'gern']), 'tokens equal');
t(!checkTokens(['hätte', 'Ich', 'gern'], ['Ich', 'hätte', 'gern']), 'tokens order matters');
// Spanish accents: dropped diacritics accepted + flagged; never for Cyrillic
t(check('cafe', 'café').ok && check('cafe', 'café').accent, 'cafe -> café accepted, flagged');
t(check('manana', 'mañana').ok && check('manana', 'mañana').accent, 'manana -> mañana accepted, flagged');
t(check('que', '¿Qué?').ok && check('que', '¿Qué?').accent, 'que -> qué accepted, flagged');
t(check('café', 'café').ok && !check('café', 'café').accent, 'exact accent not flagged');
t(!check('cafe', 'cafes').ok, 'wrong word still rejected');
t(!check('и', 'й').ok && !check('привет', 'привёт').ok, 'Cyrillic й/ё are not accent variants');
t(check('Tomamos el carro', 'Tomamos el coche', ['Tomamos el carro']).ok, 'spain alt accepted');
t(checkTokens(['el', 'coche'], ['el', 'carro'], ['el', 'coche']), 'build accepts the other variant');
console.log(`check.test.ts: ${n} assertions passed`);
