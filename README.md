# Savage Dice

A SWADE-aware dice roller for Owlbear Rodeo. Handles exploding aces, Wild Die, raises, and critical failures — all the Savage Worlds mechanics that generic dice tools don't.

**Status:** scaffold only (v0.0.1 — no UI yet). See [PLAN.md](PLAN.md).

## Install (once deployed)

In any OBR room → Settings → Extensions → Add Extension:

`https://fumbletable.github.io/savage-dice/manifest.json`

## Plan

Full planning doc in [PLAN.md](PLAN.md), including verified SWADE rules (from Adventure Edition v4.2 core rulebook), tiered feature scope, and the architectural approach.

## Local development

```bash
cd app
npm install
npm run dev
```

Pushes to `main` auto-deploy to GitHub Pages in ~30 seconds.

## License

MIT. See [LICENSE](LICENSE).

## Related

- [Savage Deck](https://github.com/fumbletable/savage-deck) — sibling extension. Initiative tracker for Savage Worlds. Future integration planned (click a combatant → roll their trait).

Built by [Fumble Table](https://fumbletable.com).
