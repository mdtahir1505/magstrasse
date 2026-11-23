# MAG STRASSE: Phase 2 spec (Russian support + engagement features)

Read `BUILD_SPEC.md` first (the stack, rules, and folder layout still apply). Everything that exists stays. These are additions only.
The style comes only from `src/strasse.css` + `src/screens.css` classes (paper, sticker, tilt, tape, halftone, btn, chip, card, display, marker …). New screens must look like the existing ones: same Street/graffiti look, same type scale, 390×844 first, and scroll on small phones.

## A. Russian support (language-agnostic, driven by pack.json)
Content types gain **optional** fields (German simply doesn't set them):
```ts
type Item     = { …existing, translit?: string };            // "privet"
type Sentence = { …existing, translit?: string };
type Pack     = { …existing, genderLabels?: Record<"m"|"f"|"n", string>, // ru: {m:"м", f:"ж", n:"ср"}
                  translitUntilStage?: number,                 // ru: 2 → auto-show Latin spelling in stages 1–2
                  displayFontNeedsFallback?: boolean };
```
- **Gender tag**: when `pack.articles` is null and `genderLabels` exists, show the label in the same colour-coded tag. No articles get stripped for ru.
- **Transliteration**: shown in small dim text under the target word/sentence (intro card, listenPick feedback, say/shadow, word bank, story popover) when the setting allows. Settings → "Latin spelling": Auto (= stages ≤ translitUntilStage) / Always / Never. Hidden entirely for packs without translit.
- **Type it in ru**: accept the correct Cyrillic, OR a Latin transliteration of it (build a simple ru→latin map and compare with `norm`, tolerating common variants: y/j for й, sh/š, ch/č, zh/ž, ts/c, ya/ja, yu/ju, e/ye, ' or nothing for ь/ъ). When the Latin answer is accepted, feedback says "Correct! Next time try the Russian keyboard: Settings → General → Keyboard → Add → Russian." Umlaut helper keys are hidden for ru.
- **Speech**: voice/recognition lang = `pack.voice` (ru-RU). Already generic; make sure nothing hard-codes de-DE.
- **Fonts**: Anton and Permanent Marker have no Cyrillic. Self-host **Oswald** (cyrillic + cyrillic-ext subsets, weights 500–700) and **Caveat** (cyrillic) the same way the existing fonts are: woff2 under `src/fonts/` with `@font-face` in `src/fonts.css` (unicode-range for cyrillic only). Append them as fallbacks in the font stacks in a **screens.css override**, not in strasse.css: display → `Anton, Oswald, …`; marker → `"Permanent Marker", Caveat, …`. A download script already exists as a pattern in git history; a small node script fetching from Google Fonts CSS2 with a Chrome UA is fine. Keep the CSP font-src 'self' (the fonts are bundled).
- **Onboarding/Settings**: any pack that has ≥1 stage is selectable. Remove "coming soon" for ru once `content/ru/pack.json` + a stage exist. Settings language switch keeps progress per language (already per-language storage). Switching language mid-day keeps the streak (the streak is per profile, not per language).

## B. Streak rule + 1-minute mode
- A day counts for the streak if **any session is completed** that day (1-min, 5-min, full, speed round, boss). The daily goal minutes bar stays as it is (it just fills).
- Today screen: under "Only got 5 minutes?" add "Just 1 minute" (3 quick review cards; on day 1 the first 3 intro cards). Same session player.

## C. Speed round
- 60-second rapid-fire game from learned items (needs ≥8 learned, otherwise it's hidden). Each card shows a target word big (gender tag, translit if on) with 4 English options. +1 per correct, a combo counter (x2 at 5 in a row, x3 at 10), a wrong answer resets the combo and shakes. Audio plays each word (toggleable).
- Big countdown ring/bar, then a results screen: score, best, new-record sticker moment. High score stored per language. Grades the SRS lightly (correct = Good only if the card is due, wrong = Again).
- Entry points: Today ("Speed round" chip/card), Session Complete bonus options, Me.

## D. Boss fights
- When all 5 lessons of a unit are done, that unit's Course-map station gets a "BOSS" sticker and Today shows a "Boss fight ready: <unit title>" card (above Start, dismissible for the day).
- Boss = 15 mixed exercises (listenPick, type, build, fill, say) drawn from all the unit's items/sentences/fills, **3 lives** (hearts in the session-top bar). 0 lives = "Knocked out. Retry anytime", no penalty. Win = unit cleared: a confetti-free CSS stamp animation "BOSS DOWN", plus a sticker unlock.
- Track in progress: `bossesBeaten: string[]` (unit ids).

## E. Sticker wall
- Me → new "Stickers" pane (add to the Me sub-nav). Grid of stickers using the existing `.sticker` styles: German/Russian slang word + emoji, rotated, colour per rarity (cyan common, yellow rare, pink epic). Locked = dark silhouette with "?" + an unlock hint.
- Defined in code (`src/engine/stickers.ts`), language-aware text pulled from pack (fallback to a generic set):
  - per boss beaten (one per unit)
  - streak 3, 7, 14, 30, 60, 100, 365
  - words known 50, 100, 250, 500, 1000, 1500, 2000
  - first speed round, speed records 20/40/60
  - serial episodes 1, 10, 25, 50
- New unlocks are queued and shown on Session Complete / the boss win / the speed results as a "peel" animation card ("New sticker!"), then land on the wall. Stored as `stickers: {id, at}[]` in the profile (not per language), included in export/import.

## F. Daily story serial "Kiez Chronicles"
- Content: `content/<lang>/serial.json`: `Episode[]`:
  ```ts
  type Episode = { id: string; n: number; title: string; minLesson: string /* lesson id that must be done */;
    panels: { speaker?: string; emoji?: string; target: string; english: string; translit?: string }[];
    cliffhanger: string /* English teaser line for the next episode */ };
  ```
- Unlocking: **one new episode per day** in which a session was completed, and only if `minLesson` is done. Track `serialSeen: number` (highest episode read) and `serialUnlockedOn: date` per language.
- Session Complete: if a new episode unlocked, show a "New episode: <title>" card (comic panel thumbnail) with "Read now" as the primary bonus action.
- Stories tab: a "Kiez Chronicles" header card at the top (current episode, a "next one tomorrow" countdown, and the list of read episodes). The existing stories list stays below.
- Reader: comic layout. Each panel is a `paper` card with a slight alternating tilt, the speaker name in marker font, the emoji as the avatar, a speech bubble with the target line (tap a word → translation popover, the same as the story reader), the English toggle, and 🔊 per line plus play-all. It ends with a halftone "TO BE CONTINUED…" panel showing the cliffhanger.

## Done =
- `npx tsc --noEmit` clean, `npm run build` passes, all `src/engine/*.test.ts` pass (add tests for: ru translit acceptance, the streak rule with a 1-min session, sticker unlock conditions, episode unlock rule).
- Browser smoke test at 390×844 (Browser pane `preview_start` name `strasse-app`): speed round plays and saves the best score; 1-minute mode completes and counts the streak; force a unit's lessons done via localStorage → boss card → win/lose paths; sticker wall shows locked/unlocked; with a stub serial.json **in your scratchpad** (never write into `content/`), the episode reader renders. With a stub ru pack in the scratchpad, confirm Cyrillic renders in Oswald/Caveat fallbacks: point a temporary vite alias at it, or test the components directly. Don't write into content/.
- No console errors. Screenshots of: speed round, boss fight, sticker wall, episode reader.
