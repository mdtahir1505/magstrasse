import { explainDiff, explainFill, relevantTip, spokenMatch } from './explain';

let n = 0;
const ok = (c: unknown, m: string) => { if (!c) throw new Error('FAIL: ' + m); n++; };

ok(explainDiff('Kaffee ich trinke', 'Ich trinke Kaffee.').startsWith('Right words, wrong order'), 'order');
ok(explainDiff('Ich habe gern Kaffee', 'Ich hätte gern Kaffee') === 'You wrote "habe", but here it\'s "hätte".', 'one swap');
ok(explainDiff('Ich Kaffee', 'Ich trinke Kaffee').includes('Missing: "trinke"'), 'missing');
ok(explainFill('Ich ', ' Wasser.', 'trinkst', 'trinke', 'I drink water.').includes('With "ich" it\'s "trinke"'), 'ending + subject');
ok(explainFill('Ich ', ' Wasser.', 'hätte', 'trinke', 'I drink water.').startsWith('"hätte" doesn\'t fit'), 'wrong word');
ok(relevantTip('ich trinke / du trinkst: endings change', 'Ich trinke Wasser') !== undefined, 'tip relevant');
ok(relevantTip('ich trinke / du trinkst: endings change', 'Wie heißt du?') === undefined, 'tip irrelevant');
ok(spokenMatch(['Ich', 'hätte', 'gern', 'Kaffee.'], 'ich hatte gern kaffee').every(Boolean), 'spoken all (umlaut ok)');
ok(JSON.stringify(spokenMatch(['Ich', 'hätte', 'gern', 'Kaffee.'], 'ich habe gern kaffee')) === '[true,false,true,true]', 'one miss mid-sentence keeps counting');
console.log(`explain.test.ts: ${n} assertions passed`);
