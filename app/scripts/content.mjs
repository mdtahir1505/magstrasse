// Content tools. `node scripts/content.mjs check` validates every pack (CI runs this).
// `node scripts/content.mjs normalize` rewrites derived fields in place: Russian translit (one consistent style)
// and noun gender from the article (each pack's articles + pluralArticles, e.g. de der/die/das, es el/los = m, la/las = f).
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content');
const read = (f) => JSON.parse(readFileSync(f, 'utf8'));
const write = (f, v) => writeFileSync(f, JSON.stringify(v, null, 2) + '\n');

// ---- Russian → Latin, readable-for-speaking style (что = shto, -ого = -ovo) ----
const MAP = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:"'",э:'e',ю:'yu',я:'ya' };
const WORDS = { что:'shto', чтобы:'shtoby', чтоб:'shtob', ничего:'nichevo', сегодня:'sevodnya', конечно:'koneshno', скучно:'skushno' };
const VOWELS = 'аеёиоуыэюяъь';
const letters = (s, prev = '') => [...s].map((c, i) => {
  const before = i ? s[i - 1] : prev;
  return c === 'е' && (!before || VOWELS.includes(before)) ? 'ye' : MAP[c] ?? c;
}).join('');
// Adjective/pronoun genitive -ого/-его is said "-ovo/-evo"; these adverbs keep a real г.
const KEEP_G = /^(не)?(много|дорого|строго|долго|ого|убого|полого)$/u;
function translitWord(w) {
  const lower = w.toLowerCase();
  let out = WORDS[lower];
  if (!out) {
    const m = lower.length > 3 && !KEEP_G.test(lower) && lower.match(/^(.*)(ого|его)$/u);
    out = m ? letters(m[1]) + (m[2] === 'ого' ? 'ovo' : letters('е', m[1].at(-1)) + 'vo') : letters(lower);
    if (lower === 'его') out = 'yevo';
  }
  return w[0] !== lower[0] ? out[0].toUpperCase() + out.slice(1) : out;
}
export const ruTranslit = (s) => s.replace(/[\p{Script=Cyrillic}]+/gu, translitWord);

// ---- walking ----
const packs = () => readdirSync(ROOT).filter((d) => existsSync(join(ROOT, d, 'pack.json')));
const files = (lang) => readdirSync(join(ROOT, lang)).filter((f) => f.endsWith('.json'));

// article word -> gender. pluralArticles run parallel to the order of `articles` (m, f, n).
const genderMap = (pack) => {
  const keys = Object.keys(pack.articles ?? {});
  return { ...Object.fromEntries(Object.entries(pack.articles ?? {}).reverse().map(([g, a]) => [a, g])),
    ...Object.fromEntries((pack.pluralArticles ?? []).map((a, i) => [a, keys[i]]).filter(([, g]) => g)) };
};

function normalize() {
  for (const lang of packs()) {
    const byArticle = genderMap(read(join(ROOT, lang, 'pack.json')));
    for (const f of files(lang)) {
      if (f === 'syllabus.json' || f === 'pack.json') continue;
      const path = join(ROOT, lang, f), data = read(path);
      let n = 0;
      const visit = (o) => {
        if (Array.isArray(o)) return o.forEach(visit);
        if (!o || typeof o !== 'object') return;
        if (lang === 'ru' && typeof o.target === 'string') { o.translit = ruTranslit(o.target); n++; }
        if (typeof o.target === 'string' && 'gender' in o && o.gender === null) {
          const g = byArticle[o.target.split(' ')[0].toLowerCase()];
          if (g && o.kind === 'word') { o.gender = g; n++; }
        }
        Object.values(o).forEach(visit);
      };
      visit(data);
      if (n) { write(path, data); console.log(`${lang}/${f}: ${n} fields`); }
    }
  }
}

function check() {
  const errs = [];
  const err = (m) => errs.push(m);
  const warn = (m) => console.warn('warning: ' + m);
  for (const lang of packs()) {
    const pack = read(join(ROOT, lang, 'pack.json'));
    const ids = new Set(), lessonIds = new Set();
    let lessons = 0, items = 0;
    for (const sf of pack.stages) {
      const p = join(ROOT, lang, sf);
      if (!existsSync(p)) { err(`${lang}: missing ${sf}`); continue; }
      const st = read(p);
      for (const u of st.units) for (const l of u.lessons) {
        lessons++; lessonIds.add(l.id);
        const at = `${lang}/${sf} ${l.id}`;
        if (l.items.length < 8) err(`${at}: only ${l.items.length} items`);
        if (l.sentences.length < 3) err(`${at}: only ${l.sentences.length} sentences`);
        if (!l.dialogue?.lines?.length || l.dialogue.replyOptions?.length !== 3) err(`${at}: bad dialogue`);
        else if (!(l.dialogue.answer >= 0 && l.dialogue.answer < 3)) err(`${at}: dialogue answer out of range`);
        for (const it of l.items) {
          items++;
          if (ids.has(it.id)) err(`${at}: duplicate id ${it.id}`); ids.add(it.id);
          if (![null, 'm', 'f', 'n'].includes(it.gender)) err(`${at}: bad gender on ${it.id}`);
          if (!it.target || !it.english) err(`${at}: empty item ${it.id}`);
          if (lang === 'ru' && !it.translit) err(`${at}: no translit on ${it.id}`);
          if (it.spain && it.spain === it.target) warn(`${at}: spain equals target on ${it.id}`);
        }
        for (const s of l.sentences) if (s.spain && s.spain === s.target) warn(`${at}: spain equals target in "${s.target}"`);
        for (const f of l.fills) {
          if (!(f.answer >= 0 && f.answer < f.options.length)) err(`${at}: fill answer out of range`);
          if (new Set(f.options).size !== f.options.length) err(`${at}: duplicate fill options`);
          if (/ {2}/.test(f.before + f.options[f.answer] + f.after)) err(`${at}: double space in fill`);
        }
      }
    }
    const serialPath = join(ROOT, lang, 'serial.json');
    const eps = existsSync(serialPath) ? read(serialPath) : [];
    for (const e of eps) if (!lessonIds.has(e.minLesson)) err(`${lang} serial ${e.id}: unknown minLesson ${e.minLesson}`);
    const stories = files(lang).filter((f) => /^stories(-[\w-]+)?\.json$/.test(f)).flatMap((f) => read(join(ROOT, lang, f)));
    const street = files(lang).filter((f) => /^street(-[\w-]+)?\.json$/.test(f)).flatMap((f) => read(join(ROOT, lang, f)));
    const sids = new Set();
    for (const s of [...stories, ...street]) { if (sids.has(s.id)) err(`${lang}: duplicate story/street id ${s.id}`); sids.add(s.id); }
    console.log(`${lang}: ${pack.stages.length} stages, ${lessons} lessons, ${items} items, ${stories.length} stories, ${eps.length} episodes, ${street.length} street`);
  }
  if (errs.length) { console.error(errs.slice(0, 50).join('\n') + (errs.length > 50 ? `\n…and ${errs.length - 50} more` : '')); process.exit(1); }
  console.log('content OK');
}

const cmd = process.argv[2];
if (cmd === 'normalize') normalize();
else if (cmd === 'check') check();
else if (cmd === 'translit') console.log(process.argv.slice(3).map(ruTranslit).join(' | '));
else { console.error('usage: node scripts/content.mjs check|normalize|translit <words>'); process.exit(2); }
