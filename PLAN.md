# Savage Dice — OBR Extension for Savage Worlds Dice Rolling

**Status:** v0.5.0 stable — shipped, working, in active use by Scott
**Repo:** https://github.com/fumbletable/savage-dice
**Live:** https://fumbletable.github.io/savage-dice/manifest.json

## What this is

SWADE-aware dice roller for Owlbear Rodeo. Handles Wild Die, aces (exploding dice), raises, critical failures, MAP, damage rolls, party broadcast, GM private rolls, sound.

**This extension is stable. No active development planned here.**
3D dice work is in `feature/3d-dice-rapier` and will be a separate new extension (Savage Dice 3D). See `../savage-dice-3d/` when that project starts.

## Current state — v0.5.0

- Trait rolls: die picker, Wild Card toggle, modifier, TN, MAP buttons
- Damage rolls: multi-die, modifier, bonus d6 for raise
- Aces: full exploding dice chains displayed
- Results: bigger text (improved v0.5.0), outcome banner, raises count
- Party broadcast: everyone sees rolls in their log
- GM private rolls: hidden from players
- Sound: toggleable dice shake sound

## SWADE Rules Reference

### Trait rolls
- Roll trait die. TN 4 = success.
- Wild Cards roll extra d6, take the higher of the two totals.
- Both dice ace independently.
- Critical failure: natural 1 on BOTH trait and wild die.
- Raises: every 4 over TN = 1 raise. Calculated after modifiers.

### Aces (exploding dice)
- Max roll on any die → roll that die again and add. Chains indefinitely.
- 4 on d4, 6 on d6, 8 on d8, 10 on d10, 12 on d12.

### Damage
- No Wild Die. Sum all damage dice. Each aces independently.
- Raise on attack = +1d6 bonus damage die (can also ace).

### Multi-action penalty
- 2 actions = -2 to all. 3 actions = -4 to all.

## Architecture

**Stack:** Vite + React + TypeScript + OBR SDK v3
**Key files:**
- `app/src/lib/dice.ts` — pure SWADE math (rollTraitCheck, rollDamage)
- `app/src/App.tsx` — UI, all state, OBR broadcast
- `app/public/manifest.json` — OBR extension manifest

**No overlay, no workers, no WASM.** Dice rolled via Math.random() directly in App.tsx. Results broadcast via OBR.broadcast.

## Deploy pattern

1. Push to main → GitHub Actions builds `app/dist` → GitHub Pages deploys
2. SSH alias: `git@github-fumbletable:fumbletable/savage-dice.git`
3. Per-repo git config: `user.email "fumbletable@gmail.com"`, `user.name "Fumble Table"`
4. After manifest changes: reinstall in OBR with `?v=N` on the URL to bust cache

## 3D dice — NOT in this repo

All 3D dice work (dice-box attempt, Rapier plan) is in `feature/3d-dice-rapier`.
The plan is a **new repo: savage-dice-3d**, built from scratch using:
- `owlbear-rodeo/dice` as the reference implementation
- Three.js + Rapier physics (single-threaded, no WASM worker issues)
- Deterministic rolls (all clients animate from the same seed)

When savage-dice-3d is stable and tested with Scott, it replaces this extension.

## Links
- SWADE core rulebook: `D:\RPG - Archive\04-Other-Systems\savage worlds\Savage Worlds - Core Rulebook (Adventure Edition - v4.2).pdf`
- OBR dice reference: https://github.com/owlbear-rodeo/dice
- Savage Deck (sibling): https://github.com/fumbletable/savage-deck
- Savage Dice 3D (future): https://github.com/fumbletable/savage-dice-3d (not created yet)
