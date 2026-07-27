This is a massive, multi-week feature set — roughly the size of everything already built on top of the current app. I'll break it into a phased plan so we ship real, working systems instead of half of everything. Please confirm the phasing (or reorder), and I'll start Phase 1.

## Phase 0 — Foundation (blocking prerequisite)

**Auth migration: anonymous → permanent accounts**
- Enable Email/Password + Google in Cloud Auth (verification on, HIBP on, no auto-confirm).
- New `/auth` route: sign in, sign up, password reset, "resend verification", Remember Me (persistSession).
- Move all app routes except `/`, `/auth`, `/follow` under `_authenticated/`.
- One-time migration: on first login, if the user previously had anonymous data (same device), offer to link username + leaderboard row to the new account. After that, anonymous auth is disabled.
- Extend `profiles` with: `souls int`, `title text`, `username_color text`, `email` (mirror), timestamps.

Nothing else works until this lands, so it ships alone.

## Phase 1 — Collection + Packs + Souls + Duplicates

Data model (one migration, RLS + GRANTs per rules):
- `character_ownership(user_id, character_id, count, first_obtained_at)` — PK (user_id, character_id).
- `packs_inventory(user_id, pack_type, count)` — pack_type enum: bronze/silver/gold/ultra/legend.
- `soul_transactions(id, user_id, delta, reason, meta jsonb, created_at)` — append-only ledger; `profiles.souls` is the cached balance updated by RPC.
- RPCs (SECURITY DEFINER):
  - `grant_pack_for_score(p_score)` — called by `submit_score`; maps score→pack via the table you specified.
  - `open_pack(p_pack_type)` — atomic: decrement pack, roll character weighted by rarity, insert/increment ownership, if duplicate credit souls (Common 5 / Uncommon 15 / Rare 40 / Epic 100 / Legendary 250 / Mythic 600 — tunable), return `{character_id, duplicate, souls_awarded}`.
  - `spend_souls(p_amount, p_reason, p_meta)` — guarded debit.
- Client:
  - `/collection` — grid of all 60+ characters, owned in color, missing as silhouette, % complete, search/filter/sort (reuses characters page filters).
  - `/packs` — inventory + open flow with per-tier artwork, animation, sound (reuse `sound.ts`, add tier-specific reveal). Rare pulls: screen flash + slow reveal + `play("rare")`.
  - Draft result: instead of just "score submitted", show pack earned + CTA "Open now".
  - Souls balance chip in header + mobile nav.

## Phase 2 — Store + Cosmetics

- `store_items(id, kind, payload jsonb, price_souls int, active bool)` — kinds: `character`, `title`, `username_color`, (future: frame, background).
- `store_purchases(id, user_id, item_id, price_paid, purchased_at)`.
- RPC `purchase_item(p_item_id)` — checks souls, applies effect (character → ownership +1; cosmetic → `user_cosmetics` row + set active).
- `user_cosmetics(user_id, kind, value, active)` — active title / color rendered on leaderboards & profile.
- Character prices by rarity (souls): Common 200, Uncommon 500, Rare 1200, Epic 3000, Legendary 8000; **Mythic not listable**.
- `/store` page: tabs (Characters / Titles / Colors), price, own/locked state, buy modal.

## Phase 3 — Rivals

Data:
- `rival_teams(user_id pk, slot_1..slot_5 text, updated_at)` — validated: 5 owned characters.
- `rival_matches(id, attacker_id, defender_id, attacker_team jsonb, defender_team jsonb, result, points_delta, souls_awarded, created_at, day_key)`.
- `rival_points(user_id, season_key, points int)`.
- Unique index `(attacker_id, defender_id, day_key)` enforces "no repeat opponent same day".
- Trigger/RPC enforces 5 attacks/day per attacker.

Logic:
- Battle resolution: deterministic seeded compare of team scores (reuse `scoreTeam`) + small RNG for excitement; server-side in RPC so it's cheat-proof.
- Win +3, Loss −1, floor at 0. Small soul reward per win.
- `find_opponents()` RPC returns 3–5 candidates near your rank with saved teams.

UI:
- `/rivals` — set team (drag from collection), find opponents, battle animation (reuse card reveals), result screen.
- `/rivals/leaderboard` — same shape as draft leaderboard, shows title + colored username + team preview, weekly reset via `season_key`.
- Offline Battle Report modal on login: query matches where you were defender since last login, show W/L/points/souls/attacker list.

## Phase 4 — Daily Missions

- `daily_missions(user_id, day_key, m1_target int, m1_progress, m1_claimed, m2_progress, m2_claimed, m3_progress, m3_claimed, all_claimed)`.
- `get_or_create_today_missions()` RPC generates M1 target (random 78–92, based on player's recent avg), returns state.
- Progress hooks: after `submit_score` → update M1; after `open_pack` → M2; after rival win → M3.
- `claim_mission(n)` RPC awards souls + completion bonus when all three claimed.
- `/missions` page: 3 cards, progress bars, countdown to UTC midnight, claim buttons, animated completion.

## Phase 5 — Weekly Rewards

- `weekly_rewards(user_id, season_key, board, rank, souls, delivered, claimed_at)`.
- pg_cron on Monday 00:00 UTC calls `/api/public/hooks/weekly-reset`:
  - Snapshot draft + rivals top 50, insert weekly_rewards rows, no auto-credit — credit on next login claim so popup feels rewarding.
- Animated reward popup on login when unclaimed rewards exist.
- Reward curve (souls): #1 5000, #2 3500, #3 2500, #4–5 1800, #6–10 1200, #11–25 700, #26–50 300.

## Phase 6 — Architecture polish

- `src/lib/game/` module per system (packs, souls, rivals, missions, store) with typed client + server RPC wrappers.
- All content (packs, rarity tables, reward curves, mission templates, store items) in `src/data/*.ts` OR the `store_items` table — additions are data-only.
- React Query keys namespaced per system; single `useSouls()` hook subscribes to profile changes.
- Reusable `<AnimatedReward>`, `<PackOpenSequence>`, `<BattleAnimation>` components.
- Bilingual strings added phase-by-phase in `i18n.tsx`.

## Notes / decisions I'll default to unless you say otherwise

- Souls values, pack odds, prices, mission targets, reward curve: numbers above are starting values, easy to tune later.
- Rivals battles are server-computed deterministic (no live combat) — matches your "attack offline teams" spec.
- Weekly reset uses existing ISO-week `season_key`.
- Anonymous → account migration is one-shot per device; new users go straight to email/password + Google.
- Mythic exclusion from store enforced in RPC, not just UI.

## Scope check

Phase 0 alone is a real chunk (auth rewrite + route gating + linking existing scores). Phases 1–5 each add a table set + RPCs + a page + integrations into draft/results. Realistically this is 6 iterations, not one message.

**Reply "start phase 0"** (or reorder / cut anything) and I'll implement Phase 0 end-to-end, then check in before Phase 1.