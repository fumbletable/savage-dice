# Savage Dice

A Savage Worlds (SWADE) dice roller extension for [Owlbear Rodeo](https://www.owlbear.rodeo). Built to handle the mechanics generic dice tools miss — **exploding Aces**, the **Wild Die**, **raises**, and **Critical Failures** — without fighting the rules.

**Version 0.4.0** — ready for play at the table.

## Install

In any Owlbear Rodeo room:

1. Click the **Extensions** icon in the toolbar
2. Click **Add Custom Extension**
3. Paste this URL:

   ```
   https://fumbletable.github.io/savage-dice/manifest.json
   ```

4. Click **Add** and confirm. The dice icon appears in your toolbar.

Every player in the room can install it independently. Rolls broadcast to everyone automatically.

## What it does

### Trait rolls
- Pick your die (d4 / d6 / d8 / d10 / d12)
- Set a modifier, TN, and Multi-Action Penalty if any
- **`Roll Wild`** — trait die + d6 Wild Die, keep the highest total. For Wild Card characters (PCs and major NPCs).
- **`Roll Extra`** — trait die only, no Wild Die. For Extras (minions, mooks, most creatures).
- **Aces** (exploding dice) handled automatically — max on any die rolls again and adds.
- **Raises** calculated automatically — every 4 over TN = 1 raise.
- **Critical Failures** detected — both trait and Wild Die showing a natural 1.

### Damage rolls
- Switch to **Damage** mode for a different layout (all dice **add** together, no "best of").
- Add up to 4 dice (Str die + weapon die + any bonuses)
- **+d6 bonus** checkbox if the attack got a raise
- Modifier field for any flat bonuses
- Each die aces independently and all results sum to a single total

### Party features
- **Every roll broadcasts to the whole room** with your name and player colour
- **GM private roll toggle** — when on, that roll stays on your panel only (nobody else sees it)
- Shared Recent Rolls log shows the last 20 rolls across everyone

### Other
- **Sound effects** for rolls and outcomes — toggle in header (🔊/🔇). Preference saved per-browser.
- **Polyhedral dice icons** with shake animation on every roll

## SWADE rules reference

All math is verified against the Savage Worlds Adventure Edition core rulebook (v4.2, pp. 87–90, 101, 104):

| Mechanic | How it works here |
|----------|-------------------|
| Trait roll | Roll trait die (+ Wild d6 if Wild Card). Each die aces independently. Take best total. Apply modifier. Compare to TN. |
| Aces | Rolling max (4 on d4, 6 on d6, 8 on d8, 10 on d10, 12 on d12) rolls that die again and adds. Chains. |
| Raises | Every 4 points over TN (after modifiers) = 1 raise. |
| Critical Failure | Wild Cards: natural 1 on both trait and Wild Die. Auto-fail. |
| Multi-Action Penalty | Buttons apply -2 or -4 to the modifier for that roll. |
| Damage | All dice add together. No Wild Die. +d6 bonus if the attack got a raise (any amount). Each die aces independently. |

## Roadmap

Shipped:
- ✅ Trait rolls with Wild/Extra buttons
- ✅ Damage rolls
- ✅ Aces, raises, crit failures
- ✅ Multi-Action Penalty
- ✅ Party broadcast with names + colours
- ✅ GM private roll toggle
- ✅ Sound effects (toggle)
- ✅ Polyhedral dice with shake animation

Planned:
- Better sound design (current tones are synthesised — may replace with recorded samples)
- Integration with [Savage Deck](https://github.com/fumbletable/savage-deck) (click combatant → roll their trait)
- GM session-long modifier presets (weather, cover, illumination)

## Local development

```bash
cd app
npm install
npm run dev
```

Pushes to `main` auto-deploy to GitHub Pages in ~30 seconds via the workflow in `.github/workflows/deploy.yml`.

## License

GPL-3.0 — see [LICENSE](LICENSE). Use freely, modify freely, redistribute freely — keep it free and share-alike.

## Related

- [Savage Deck](https://github.com/fumbletable/savage-deck) — sibling extension. Initiative tracker for Savage Worlds (also by Fumble Table).

---

Built by [Fumble Table](https://fumbletable.com) for our own table. Shared in case it's useful to yours.
