# Spike: 3D Dice Integration for Savage Dice

**Date:** 2026-04-16
**Packages researched:** `@3d-dice/dice-box@1.1.4`, `@3d-dice/dice-parser-interface`, `@3d-dice/dice-roller-parser`
**Sources:** GitHub repos (direct source read), fantasticdice.games docs, OBR official dice extension source

---

## 1. Package API — Init in Vite/React

### Install

```bash
npm install @3d-dice/dice-box
```

The postinstall script (`copyAssets.js`) runs automatically and prompts you for your public folder path. It defaults to `/public/assets` with a 10-second timeout. It copies everything from `dist/assets/` into your chosen path. **You must have these files served statically** — they include WASM (AmmoJS physics), web workers, and 3D theme assets.

### Assets that must be in public/

After install, the asset tree under your public folder looks like:

```
public/
  assets/
    dice-box/
      ammo/           ← AmmoJS physics WASM + JS
      themes/
        default/      ← Default dice models + theme.config.json
      offscreen.worker.js
      physics.worker.js
```

The workers and WASM are fetched at runtime via `fetch()` using the `assetPath` you provide. If those fetches 404, you get the classic `wasm streaming compile failed` error. In a Vite project the files just need to live in `public/` and be served at the path you declare.

**Critical: set `assetPath` to match exactly where the files are served from.** If you put them in `public/assets/dice-box/`, set `assetPath: '/assets/dice-box/'`.

### Init

```typescript
import DiceBox from "@3d-dice/dice-box";

// Create OUTSIDE React component — not inside useEffect, not inside render
const diceBox = new DiceBox({
  assetPath: "/assets/",   // required — path to the assets folder
  theme: "default",
  scale: 6,
  offscreen: true,          // uses OffscreenCanvas when available (default true)
  enableShadows: true,
  onRollComplete: (results) => {
    console.log(results);
  }
});

// Inside component, init once
const initialized = useRef(false);
useEffect(() => {
  if (!initialized.current) {
    initialized.current = true;
    diceBox.init();  // returns Promise<DiceBox>
  }
}, []);
```

**Why outside the component:** dice-box creates its canvas at construction time using `createCanvas()`. React re-renders re-run the constructor if it's inside the component, creating duplicate canvases. The official React demo does exactly this — module-level singleton.

### Config options reference

| Option | Default | Notes |
|--------|---------|-------|
| `assetPath` | `/assets/` | Required. Must point to the static assets. |
| `container` | `document.body` | DOM selector for where to append canvas. |
| `offscreen` | `true` | Uses OffscreenCanvas + workers when available. Falls back gracefully. |
| `scale` | 6 | Die size. 2–9 recommended. |
| `delay` | 10 | ms between dice spawning. 0 causes physics popping. |
| `settleTimeout` | 5000 | ms before declaring roll complete. |
| `suspendSimulation` | `false` | **Disables 3D physics entirely and uses RNG fallback.** Results fire instantly. |
| `theme` | `"default"` | Theme name or hex colour. |
| `themeColor` | `"#2e8555"` | Used by colour-type themes. |

### Key callbacks

```typescript
diceBox.onRollComplete = (results: RollGroup[]) => { ... };
diceBox.onDieComplete = (die: DieResult) => { ... };
diceBox.onBeforeRoll = (parsedNotation) => { ... };
```

Callbacks can be set either in the constructor config object or by direct assignment after init. The React demo sets them by direct assignment — that works fine.

### Methods

```typescript
// Start a new roll (clears existing dice first)
const results = await diceBox.roll("2d6");
const results = await diceBox.roll([{qty:2, sides:6}]);

// Add dice to an existing roll (separate group)
await diceBox.add("1d6");

// Reroll specific dice
await diceBox.reroll(dieObjects, { remove: true });

// Remove dice from scene
await diceBox.remove(dieObjects);

// Clear all dice
diceBox.clear();

// Show/hide the canvas
diceBox.hide();
diceBox.show();
```

All roll methods return a Promise that resolves when the dice stop moving.

---

## 2. dice-roller-parser — Notation and API

**Package:** `@3d-dice/dice-roller-parser` (fork of BTMorton/dice_roller, uses PEG.js grammar)
**Note:** This is NOT the same as `@3d-dice/dice-parser-interface`. They have different roles (see below).

### Supported notation

The parser implements the full [Roll20 dice spec](https://roll20.zendesk.com/hc/en-us/articles/360037773133-Dice-Reference):

```
2d6             basic
2d20kh1         keep highest 1
4d6dl1          drop lowest 1
2d6+4           modifier
2d6!            exploding (keep rolling on max, each explosion is a separate die)
2d6!!           compound exploding (keep rolling on max, sum into one die)
2d6!p           penetrating (explode but -1 on each subsequent roll)
2d6r<3          reroll while less than 3
2d6ro1          reroll once on result of 1
2d6>3           success count (count dice >= 3)
3d6+2d8         expression
{2d6+3d8}kh1    grouped roll, keep highest
floor(2d6/2)    math functions
```

### Exploding dice notation — exactly what `!` means

`!` = explode: when the die rolls its max value, roll it again and add as a separate die. Chains indefinitely. The default target is `= max`. You can specify a different target:

```
2d8!            explode on 8 (max)
2d8!=8          same, explicit
2d8!>6          explode on 7 or 8
```

**SWADE acing is exactly `!` — default behaviour, no custom target needed.** `d8!` = "explode on 8", `d4!` = "explode on 4".

### Can you pass predetermined results?

**Yes — via the `DiceRoller` constructor's random function parameter:**

```typescript
import { DiceRoller } from "@3d-dice/dice-roller-parser";

// Custom RNG — always returns 0.5 (midpoint)
const roller = new DiceRoller(() => 0.5);

// The function must return a float 0–1 (exclusive)
// To produce a known result N on a dN:
// (N - 1) / sides  →  e.g. result 6 on d8: (6-1)/8 = 0.625
const roller = new DiceRoller(() => 0.625);
```

The `dice-parser-interface` package exploits this exactly — it injects the actual dice-box physics results back into the parser as floats to get the final computed value (keeps/drops/explosions) from the string notation.

### Return object shape

```typescript
// rollValue() — just the number
const total: number = roller.rollValue("2d6");

// roll() — full result tree
const result = roller.roll("2d6kh1");
// result.value = final numeric value
// result.type = "diceexpressionroll" | "expressionroll" | "die" | etc.
// result.dice = array of sub-rolls
// Each die: { type: "roll", value: number, valid: boolean, ... }
```

---

## 3. dice-parser-interface — The Glue Layer

**Package:** `@3d-dice/dice-parser-interface`

This is the bridge between dice-box (physics results as integers) and dice-roller-parser (string notation → final value with modifiers like keep/drop/explode). It works by:

1. Parsing the notation string to extract which dice need to be rolled
2. Sending those dice to dice-box for physical rolling
3. Taking dice-box's integer results, converting them to floats (0–1), and injecting them into dice-roller-parser's custom RNG
4. Calling `rollParsed()` which replays the roll using the injected results to compute the final value

```typescript
import DiceParser from "@3d-dice/dice-parser-interface";

const DP = new DiceParser();

// Step 1: Parse notation — returns array of die groups for dice-box
const dieGroups = DP.parseNotation("4d6dl1");
// → [{qty: 4, sides: 6, mods: [...]}]

// Step 2: Pass to dice-box
const rollResults = await diceBox.roll(dieGroups);

// Step 3: Check if rerolls needed (for exploding dice)
const rerolls = DP.handleRerolls(rollResults);
if (rerolls.length > 0) {
  const rerollResults = await diceBox.add(rerolls);
  // merge results back into rollResults manually
}

// Step 4: Get final parsed value
const finalResults = DP.parseFinalResults(rollResults);
// finalResults.value = computed total respecting drops/keeps/explosions
```

### handleRerolls and exploding dice — what actually happens

`handleRerolls` checks the mods array on each group. For `explode` type mods: if any die result equals (or meets) the explode target, it adds that die to the reroll array with `rollId: "0.1"` (incrementing the fractional part). You call `diceBox.add()` with the rerolls, which physically rolls new dice on screen. Then you call `parseFinalResults` with the merged results.

**What you see on screen:** A new die physically appears and rolls when you call `diceBox.add()`. It is a visually separate die rolling again — not the original die physically "jumping". So an aced d8 shows as: the first d8 stops, then a second d8 appears and rolls.

This is the closest to visual acing that's achievable. The physics engine cannot force a specific face to land up, so you cannot "make the original d8 roll again" without just spawning a second physical die.

---

## 4. OBR Map Overlay — Architecture

### What an OBR extension can render

An OBR extension has three possible entry points:

1. **Action** (`index.html`) — the sidebar panel. Small, constrained width. What Savage Dice currently is.
2. **Popover** (`popover.html`) — a floating element positioned relative to the viewport. **Can be positioned and sized with `OBR.popover.setWidth/setHeight`.** Width=0 / Height=0 makes it invisible but it stays open.
3. **Background** (`background.html`) — loads silently on OBR startup. No visible UI. Used for sync/broadcast logic.

### The official OBR dice extension's overlay architecture

The OBR team's own dice extension (`github.com/owlbear-rodeo/dice`) uses a **three-entry-point pattern**:

```
background.html → background.ts
  └── OBR.onReady → OBR.popover.open({
        id: "plugin/popover",
        url: "/popover.html",
        width: 0,       ← starts invisible
        height: 0,
        anchorOrigin: { horizontal: "RIGHT", vertical: "BOTTOM" },
        transformOrigin: { horizontal: "RIGHT", vertical: "BOTTOM" },
        disableClickAway: true,
        hidePaper: true,    ← no card/border chrome
        marginThreshold: 0,
      })

popover.html → PopoverTrays.tsx
  └── Renders player dice trays
  └── Resizes itself: OBR.popover.setHeight(id, 298) when dice roll
  └── Uses @react-three/fiber Canvas for 3D rendering
```

The action panel (`index.html`) handles user interaction (choosing dice, clicking roll). The popover renders the 3D dice floating over the map. They communicate via `BroadcastChannel`.

**Key insight:** The popover is opened at `width:0, height:0` from the background script on OBR ready. It resizes itself when there's something to show. `hidePaper:true` removes the popover card chrome, so it's just a transparent floating container.

**This is exactly the pattern needed for a dice-box overlay.**

### Sizing constraint

`OBR.popover.setWidth/setHeight` takes pixel values. To cover the full viewport you'd need to know the viewport size. The OBR team's implementation uses a fixed size (266×298px) for dice trays. For a full-screen dice-box canvas, you'd size it via CSS inside the popover (`position:fixed; width:100vw; height:100vh; pointer-events:none`) rather than relying on OBR's popover size constraints — same as the React demo's CSS pattern.

### CSS pattern for fullscreen canvas (from official React demo)

```css
canvas {
  position: fixed;
  pointer-events: none;  /* crucial — let clicks pass through to OBR */
  z-index: 100;
  width: 100%;
  height: 100%;
  inset: 0;
}
```

The popover itself gets opened large enough to fill the viewport, with `hidePaper:true` so there's no visible frame.

---

## 5. SWADE Translation — Two Approaches

### Approach A: dice-box only (bypass parser entirely)

Roll the dice via `diceBox.roll()` using object notation, and keep `dice.ts` doing all the math.

```typescript
// Trait roll: d8 + d6 Wild Die
const results = await diceBox.roll([
  { qty: 1, sides: 8, groupId: 0 },   // trait die
  { qty: 1, sides: 6, groupId: 1 }    // wild die
]);
// results[0].rolls[0].value = trait die result
// results[1].rolls[0].value = wild die result
// Feed both into existing rollTraitCheck() logic
```

For acing, you'd need to check if result === sides and call `diceBox.add()` manually, merging results:

```typescript
async function rollWithAcing(sides: number): Promise<number[]> {
  const chain: number[] = [];
  let result = await diceBox.roll([{ qty: 1, sides }]);
  let val = result[0].rolls[0].value;
  chain.push(val);
  while (val === sides) {
    result = await diceBox.add([{ qty: 1, sides }]);
    val = result[0].rolls[0].value;
    chain.push(val);
  }
  return chain;
}
```

**Verdict on Approach A:** Clean for SWADE but you're manually implementing what `dice-parser-interface` does. The visual difference is that acing dice physically reroll on screen — one die per ace, same as Approach B.

### Approach B: dice-parser-interface for exploding, dice.ts for Wild Die logic

```typescript
const DP = new DiceParser();

// For trait roll: two independent dice, SWADE take-best (not sum)
// The parser can't express "take-best of d8 and d6" natively
// So: roll both physically via dice-box directly, use dice.ts for result
const traitResult = await diceBox.roll([
  { qty: 1, sides: traitDie, groupId: 0, mods: [{ type: 'explode' }] },
  { qty: 1, sides: 6, groupId: 1, mods: [{ type: 'explode' }] }
]);

// Handle acing rerolls
let rerolls = DP.handleRerolls(traitResult);
// loop until no rerolls...

// Then use dice.ts for take-best + raises + crit fail logic
// (dice-roller-parser has no take-best mode for two separate dice groups)
```

### Recommendation: Approach A — dice.ts stays in charge

dice-roller-parser is optimised for standard roll notation. SWADE's Wild Die (take-best of two independent dice chains) does not map cleanly to any Roll20 notation. The closest would be a group roll `{1d8!, 1d6!}kh1` but this sums within each group differently than SWADE (it's "keep the highest group total", which works, but acing inside a group notation interacts with the keep modifier in ways that need testing).

**The clean split:**
- `dice.ts` stays as the math authority for all SWADE logic (take-best, raises, crit fail)
- dice-box handles the 3D animation only
- You call `diceBox.roll()` with object notation (no string parsing needed)
- You manually chain `diceBox.add()` calls for acing dice
- `onRollComplete` fires after each physical roll; you drive the sequence

This is less code than wiring up the parser interface for SWADE's unusual semantics, and dice.ts already handles everything correctly.

---

## 6. Known Issues / Gotchas

### React StrictMode double-init

React 18 StrictMode runs effects twice in development. If `new DiceBox()` runs twice, you get two canvases. The fix (per official demo): create the DiceBox instance at **module level** (outside any component), and use a `useRef(false)` guard on the `init()` call.

```typescript
// CORRECT — module level
const Dice = new DiceBox({ assetPath: "/assets/" });

function App() {
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      Dice.init();
    }
  }, []);
}
```

### WASM files must be served as correct MIME type

The AmmoJS WASM is fetched at runtime. If your server returns it as `text/html` (e.g., a catch-all SPA redirect is intercepting the path), you get `expected magic word 00 61 73 6d` errors. In Vite dev this isn't a problem. For GitHub Pages, the WASM + worker files in `public/` are served correctly by default.

### No predetermined results via physics

You cannot tell the physics engine "land on face 6". The physics is genuinely random. `dice-parser-interface` works around this by: (1) roll physically, (2) take the integer results, (3) replay through the parser's RNG. The parser computes the final value from those results. You cannot force a specific visual outcome.

If you want "the 3D animation shows the correct result" you'd need to use `suspendSimulation: true` (no 3D physics, instant RNG result) or accept that the 3D roll is purely visual and the displayed number comes from wherever the physics lands.

**This is a fundamental design constraint.** See issue #29 on the dice-box repo — the maintainer confirmed this is not feasible with physics-based dice.

### OffscreenCanvas in iframe/popover

OBR extension panels run in iframes. `OffscreenCanvas` is available in modern browsers including in iframes, so `offscreen: true` should work. Fallback to `world.onscreen.js` is automatic. No issues reported in the dice-box issues around iframe contexts specifically.

### TypeScript types

No official `@types/` package. The source exports a single default class with no bundled types. Several community issues open requesting TypeScript support (#59, #60). Workaround: declare the module yourself:

```typescript
// src/types/dice-box.d.ts
declare module "@3d-dice/dice-box" {
  export default class DiceBox {
    constructor(options: Record<string, unknown>);
    init(): Promise<DiceBox>;
    roll(notation: string | object | Array<object>): Promise<any[]>;
    add(notation: string | object | Array<object>): Promise<any[]>;
    reroll(notation: any[], options?: {remove?: boolean}): Promise<any[]>;
    clear(): DiceBox;
    hide(className?: string): DiceBox;
    show(): DiceBox;
    onRollComplete: (results: any[]) => void;
    onDieComplete: (die: any) => void;
    onBeforeRoll: (notation: any) => void;
  }
}
```

### Vite build — the ?worker&inline import

dice-box imports its physics worker as `physics.worker.js?worker&inline` (Vite worker syntax). This is inside the dice-box package itself. When you build your project with Vite, this should be handled transparently since you're importing the compiled `dist/dice-box.es.js`. The Remix/SSR issue (#112) was environment-specific, not a standard Vite project problem — it resolved to a server config issue.

### Dice-box vs dice-box-threejs

There is also `@3d-dice/dice-box-threejs` (66 stars, separate repo). It uses Three.js + Cannon ES instead of BabylonJS + AmmoJS. Lighter weight, no WASM dependency. Less mature, fewer dice types. Worth knowing it exists but dice-box (BabylonJS) is the primary package.

### OBR popover `container` targeting

When using dice-box inside an OBR popover, set `container` to point to a specific div inside your popover rather than relying on `document.body`. In iframes, `document.body` is the iframe body, which is correct — but being explicit avoids confusion:

```typescript
const diceBox = new DiceBox({
  assetPath: "/assets/",
  container: "#dice-canvas-container",  // a div in your popover HTML
});
```

---

## Verdict Summary

| Question | Answer |
|----------|--------|
| Init in Vite/React | Module-level singleton + `useRef` guard. Standard Vite, no special config. |
| Assets needed | `public/assets/dice-box/` with ammo/, themes/default/, two worker .js files. |
| Exploding notation | `d8!` — explodes on max by default. `d4!` aces on 4. |
| Predetermined results | Not via physics. Via `DiceRoller(() => customFloat)` in dice-roller-parser only. |
| Explode visual | Second die physically spawned and rolled when ace occurs. |
| OBR overlay approach | Background script opens `width:0 height:0` popover. Popover resizes when rolling. `hidePaper:true` removes chrome. Canvas inside popover with `position:fixed; pointer-events:none`. |
| SWADE Wild Die | dice.ts stays in charge. dice-box handles visuals. Manually chain `add()` for aces. dice-parser-interface not worth wiring up for SWADE's take-best semantic. |
| TypeScript | No official types. Declare the module manually. |
| React StrictMode | Module-level singleton avoids double-init. |
| Vite compatibility | Confirmed working — official React demo uses Vite 5. |
