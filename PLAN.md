# Savage Dice — OBR Extension for Savage Worlds Dice Rolling

**Status:** Planning complete, scaffolded, ready to build features
**Started:** 2026-04-12 (planning) — next session picks up feature work
**Sibling project:** [savage-deck](../savage-deck/) — ships to same Fumble Table org, same deploy pattern

## TL;DR for next session

1. Read this doc
2. `cd projects/savage-dice/app && npm install && npm run dev` — confirm build works
3. Start with `src/lib/dice.ts` — pure-function SWADE dice math (Tier 1 below)
4. Then UI wiring
5. Deploy pattern matches savage-deck exactly (GitHub Pages under Fumble Table, auto-deploy on push to main)

## Purpose

Owlbear Rodeo doesn't have a SWADE-aware dice roller. Built-in dice + extensions like dddice handle vanilla `XdY+Z` but not:
- **Wild Die** (roll extra d6, take best)
- **Aces / exploding dice** (max roll adds another roll of the same die)
- **Raises** (every 4 over TN = one raise)
- **Critical failures** (natural 1 on both trait and wild)
- **Multi-action penalty** (-2 or -4)

This extension does all of that. Designed to work standalone OR optionally alongside Savage Deck (later integration: click a combatant, roll their trait).

## Scope decisions

- **Build our own, not dddice.** User wants no third-party account friction. Visual polish = polyhedral SVG icons + CSS animation, not 3D physics.
- **Same stack as savage-deck:** Vite + React + TypeScript + OBR SDK v3. Same deploy pattern.
- **Separate repo:** `fumbletable/savage-dice`, published under Fumble Table GitHub with its own GitHub Pages URL.
- **Neutral branding**, same as savage-deck.
- **MIT license**, same as savage-deck.

## SWADE Dice Rules (verified from Core Rulebook, Adventure Edition v4.2, pp. 87-90, 101, 104)

### Trait rolls

- Roll the trait die. **TN 4** = success.
- **Modifiers** applied after any acing. Typical: ±2 easy/hard, ±4 very hard.
- **Raises:** every 4 points over TN = 1 raise. A roll of 8 vs TN 4 = 1 raise. A roll of 12 = 2 raises. Figured after modifiers.

### The Wild Die (Wild Cards only)

- Wild Cards (PCs + major NPCs) roll an extra **d6 Wild Die** alongside every trait roll.
- **Take the higher of the two totals** (trait chain vs wild chain). Not both, not sum.
- Both dice can ace.
- Wild Die can REPLACE a trait die but never ADDS another attack/action.

### Aces (exploding dice)

- When you roll max on any die (6 on d6, 8 on d8, 10 on d10, 12 on d12, **4 on d4**), it "aces" — roll that die again and add.
- Can chain indefinitely (in theory — practically usually just 1-3 aces).
- Modifiers applied AFTER aces total up.
- Both trait die and Wild Die ace independently.

### Critical Failure

- Wild Card: natural **1 on trait die AND 1 on Wild Die** = Critical Failure. Auto-fail + bad thing happens.
- Extra: natural 1 on trait die. If GM needs to know if critical, roll d6; 1 = critical fail, else normal fail.
- Multi-dice Critical Failure (Frenzy, ROF>1): more than half dice are 1s, AND Wild Die is 1 (for Wild Cards).
- Critical Failures cannot be rerolled even with Bennies.

### Damage rolls

- **No Wild Die.** Damage isn't a Trait roll.
- Weapon damage like "Str+d8" = roll Strength die + d8, **sum them** (NOT take-best). Each die aces independently.
- Fixed damage weapons (pistol "2d6"): just roll those dice and sum.
- **Bonus damage:** if the attack roll got a raise (any number), add **+1d6** to damage. Bonus d6 can also ace.
- Compared to target's **Toughness**. Equal or over = Shaken. Each 4-over-Toughness = 1 Wound (max 3 wounds + shaken before Incapacitation).

### Multi-Action penalty

- Up to 3 actions per turn.
- Each extra action inflicts **-2 to ALL actions that turn**. So 2 actions = both at -2. 3 actions = all at -4.
- Wild Die applies to each action separately.
- All actions declared at start of turn, before any rolls.

### Bennies (reroll mechanics — v2+ feature, not v1)

- Spend benny → reroll entire Trait roll (both trait + wild). Keep best total.
- **Elan edge:** +2 when rerolling with benny (only on rerolls, not damage rerolls which aren't Trait rolls).
- Critical failures cannot be rerolled.
- Damage rerolls don't add Wild Die (they're not Trait rolls).

## Tiered feature scope

### Tier 1 — v0.1 (ship this first, ~4-5 hours)

**UI:**
- Trait name field (free text, e.g. "Fighting")
- Trait die picker: d4 / d6 / d8 / d10 / d12 (buttons)
- Wild Card toggle (adds d6 wild, default on)
- Modifier ±  (numeric, default 0)
- TN picker (default 4)
- Multi-action penalty buttons (none / -2 / -4) that apply to modifier
- Big **Roll** button
- **Damage mode toggle** — swaps logic to sum (see below)

**Math (pure fns in `src/lib/dice.ts`):**
- `roll(dieType): { chain: number[], total: number, aced: boolean }`
- `rollTraitCheck({traitDie, wild, modifier, tn}): TraitResult`
- `rollDamage({strengthDie, weaponDie, bonusD6, modifier}): DamageResult`
- Critical failure detection: both trait and wild rolled 1 on their first roll
- Raise calculation: floor((total - TN) / 4) if total >= TN

**Result display:**
- Each die shown as polyhedral SVG icon with face value
- Chain shown: `d8: 8→3 = 11` with arrows between aced rolls
- Aced dice highlighted gold with "!" badge
- Best-of badge on whichever die won (trait vs wild)
- Modifier displayed separately from die total
- Final result: success / success + N raises / failed / CRITICAL FAILURE
- Colour feedback: green pulse on success, gold on raise, red on critical fail

**Recent rolls log** (session-local, not synced):
- Last 5-10 rolls in a compact list
- Each line: trait name, result summary, timestamp

### Tier 2 — v0.2 (polish, ~2-3 hours)

- Damage mode with full damage rules (sum dice, bonus +1d6 for raise, acing per die, compared to Toughness)
- Sound effects (tiny mp3s): shake, ace, success, fail, critical. Toggleable.
- Broadcast rolls to party via OBR broadcast so everyone sees the log
- GM-private rolls option (hidden from players)

### Tier 3 — v0.3 (integration with Savage Deck)

- Savage Deck adds a "Roll" button per combatant
- Clicking it opens Savage Dice panel, prefilled with combatant name as trait name
- Later: Savage Deck combatants store trait dice (requires Combat Sheet or similar data source)
- Spend benny to reroll (only relevant if bennies tracked somewhere — v3+)

### Tier 4+ (nice-to-haves, not committed)

- dddice as optional visual layer (user installs dddice extension too, gets 3D dice on the map)
- Character preset save (Fighting d8, Shooting d10, etc. saved per player)
- Macro library for common rolls
- Multi-target resolution (roll one trait die against multiple targets, damage against multiple Toughness values)

## Architecture

Same patterns as savage-deck — match the repo layout exactly so nothing new to learn.

**Stack:** Vite + React + TS + OBR SDK v3 + @owlbear-rodeo/sdk
**Persistence:** Room metadata key `com.fumbletable.savage-dice/state` — but MUCH less state than savage-deck. Only need:
- Recent rolls log (shared if we add broadcast)
- User preferences (default trait die, sound on/off)

**Sync model:** Dice results via OBR broadcast (ephemeral log), settings via player metadata (per-user).

**OBR surfaces:** Just the action popover. Probably no context menu for v1 (unlike savage-deck where right-click-token-to-add was big value).

## Visual design

- Panel background: dark (match savage-deck)
- Card faces: cream with serif font (match savage-deck)
- Dice icons: polyhedral SVGs from game-icons.net (same author aesthetic as existing icon)
- Colour feedback: green success, gold raise, red critical fail, dim for failure
- Animation: CSS shake (transform rotate + translate) for 250ms on Roll click
- Typography consistent with savage-deck

## Deploy pattern (COPY FROM SAVAGE-DECK — do not reinvent)

All three lessons from today's improve queue apply. Specifically:

1. **Use SSH alias `github-fumbletable` for git remote.** NOT `git@github.com:...` — Damien's default git credentials push as `damien-rgb` which doesn't have write access. Check `~/.ssh/config` for the alias if unsure.
2. **Per-repo git config:** `user.email "fumbletable@gmail.com"`, `user.name "Fumble Table"`.
3. **gh CLI:** has both `damien-rgb` and `fumbletable` accounts logged in. For admin operations (workflow dispatch, release creation), `gh auth switch --user fumbletable` first, then switch back.
4. **Manifest schema:** `manifest_version`, `name`, `description`, `author`, `version`, `icon`, `action: { title, icon, popover, height, width }`. Do not confuse with `manifest: 1` or `title` at top level or `url` instead of `popover`.
5. **GitHub Pages subpath hosting:** use absolute URLs in manifest (`https://fumbletable.github.io/savage-dice/icon.svg` etc.) because relative paths don't resolve correctly on subpaths.
6. **Vite base path:** `base: './'` in vite.config.ts.
7. **Deploy:** push to main → GitHub Action runs `cd app && npm ci && npm run build` → Pages deploys from `app/dist`.

## Install URL (post-deploy)

`https://fumbletable.github.io/savage-dice/manifest.json`

## Next-session kickoff checklist

```
1. Read this PLAN.md
2. cd projects/savage-dice/app
3. npm install
4. npm run dev  (confirm "Connecting to Owlbear Rodeo…" appears)
5. Start writing src/lib/dice.ts from scratch (pure functions only)
   - rollDie(type): { chain, total, aced }
   - traitCheck({ traitDie, wild, modifier, tn }): TraitResult
   - Use Math.random() seeded per roll (no need for cryptographic)
   - Test: d4 of 4 aces, d6 of 6 aces, d8 of 8 aces, etc.
6. Then App.tsx UI (copy popover scaffold from savage-deck)
7. Then dice icons (fetch from game-icons.net — delapouite/dice-d4.svg etc.)
8. Iterate in-OBR via push + hard refresh
```

## Links

- SWADE core rulebook (Damien's local copy): `D:\RPG - Archive\04-Other-Systems\savage worlds\Savage Worlds - Core Rulebook (Adventure Edition - v4.2).pdf`
- SW Pathfinder (inherits same rules): `D:\RPG - Archive\04-Other-Systems\savage worlds\SW_Pathfinder_Core.pdf`
- Savage Deck repo (patterns to copy): https://github.com/fumbletable/savage-deck
- game-icons.net (CC BY icons): https://game-icons.net
