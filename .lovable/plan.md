## Images to wire in

Map each uploaded file to its character in `src/data/characters.ts` by setting the `image` field. Upload each via `lovable-assets` from `/mnt/user-uploads/` to a `.asset.json` pointer in `src/assets/characters/`, then import and reference `asset.url`.

| Character | File |
|---|---|
| Ichigo Kurosaki (c-001) | ichigo.jpeg |
| Kisuke Urahara (c-009) | urahara.jpeg |
| Shunsui Kyōraku (c-010) | kyoraku.jpeg |
| Ulquiorra Cifer (c-012) | ulquiorra.jpeg |
| Hanatarō Yamada (c-013) | yamada.jpeg |
| Ikkaku Madarame (c-014) | ikkaku.jpeg |
| Orihime Inoue (c-015) | orihime.jpeg |
| Yasutora Sado (c-016) | sado.jpeg |
| Yhwach (c-017) | yhwach.jpeg |
| Sōsuke Aizen (c-018) | aizen.jpeg |

`CharacterCard.tsx` already renders `c.image` when present (object-cover in the 4/5 aspect frame) and falls back to initials otherwise — no component changes needed.

## Stat edits

I still need the specific values before I can plan them. Please tell me, per character, which of `attack / defense / speed / reiatsu / intelligence / technique / potential` to change and to what number (0–99). I'll recompute `overall` as the average unless you want to override it too.

## Technical notes

- Assets stored as `src/assets/characters/<slug>.jpeg.asset.json` pointers (binaries stay on CDN, not in repo).
- Import each pointer at the top of `characters.ts` and set `image: ichigoAsset.url` etc.
- No changes to types, scoring, rarity, or routes.
