// Run: npx tsx src/engine/translit.test.ts
import { checkLatin, toLatin } from './translit';

let n = 0;
const t = (cond: boolean, msg: string) => { n++; if (!cond) throw new Error('FAIL: ' + msg); };

t(toLatin('Привет') === 'privet', 'toLatin');
t(checkLatin('privet', 'Привет'), 'plain');
t(checkLatin('Spasibo', 'Спасибо'), 'case');
t(checkLatin('khorosho', 'Хорошо') && checkLatin('horosho', 'Хорошо'), 'kh / h');
t(checkLatin('zdravstvuyte', 'Здравствуйте') && checkLatin('zdravstvujte', 'Здравствуйте'), 'y / j for й');
t(checkLatin('ya lyublyu tebya', 'Я люблю тебя') && checkLatin('ja ljublju tebja', 'Я люблю тебя'), 'ya/ja yu/ju');
t(checkLatin('moy', 'мой') && checkLatin('moi', 'мой') && checkLatin('moj', 'мой'), 'oy / oi / oj');
t(checkLatin('chai', 'Чай') && checkLatin('čaj', 'Чай'), 'ch / č');
t(checkLatin('zhizn', 'Жизнь') && checkLatin('žizn', 'Жизнь') && checkLatin("zhizn'", 'Жизнь'), 'zh / ž / soft sign');
t(checkLatin('tsentr', 'Центр') && checkLatin('centr', 'Центр'), 'ts / c');
t(checkLatin('shchi', 'Щи') && checkLatin('schi', 'Щи'), 'shch / sch');
t(checkLatin('yest', 'Есть') && checkLatin('est', 'Есть'), 'ye / e');
t(checkLatin('obyom', 'объём') && checkLatin('obem', 'объём'), 'hard sign / ё');
t(checkLatin('dobryy den', 'Добрый день') && checkLatin('dobriy den', 'Добрый день'), 'multi-word, -iy / -yy');
t(checkLatin('russkiy', 'русский') && checkLatin('ruskiy', 'русский'), 'double s');
t(!checkLatin('privet', 'Пока'), 'wrong word rejected');
t(!checkLatin('привет', 'Привет'), 'Cyrillic input is not handled here (check() does that)');
t(!checkLatin('', 'Привет'), 'empty rejected');
console.log(`translit.test.ts: ${n} assertions passed`);
