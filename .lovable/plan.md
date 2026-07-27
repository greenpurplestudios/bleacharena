# Long-Term Progression System

Ship Profiles, Levels + Rewards, Daily Login, and Achievements as one integrated system on top of the existing account, Collection, Draft, Rivals, Bleachdle and Store.

## Scope

All four systems land together, fully bilingual (EN/AR), responsive, animated, and wired into every existing game mode via a single XP/achievement tracker so future modes plug in with one call.

## Database (single migration)

New tables (all with GRANTs + RLS + own-row policies):

- `player_levels` — `user_id`, `level`, `xp`, `total_xp`, `updated_at`
- `level_rewards_claimed` — `user_id`, `level` (PK pair)
- `daily_login` — `user_id`, `streak`, `last_claim_day`, `total_claims`
- `achievements_catalog` — `id`, `category`, `rarity`, `target`, `xp_reward`, `soul_reward`, `title_reward`, `sort_order`, `name_en/ar`, `desc_en/ar`
- `user_achievements` — `user_id`, `achievement_id`, `progress`, `unlocked_at`
- Extend `profiles` with: `avatar_character_id text`, `favorite_character_id text`, `profile_frame text`, `profile_border text`, `total_souls_earned int`, `packs_opened int`, `drafts_played int`, `best_draft_score numeric`, `highest_rival_rating int`, `play_seconds int`

Seed `achievements_catalog` and cosmetic `store_items` for level-unlock titles/colors/frames (marked non-purchasable, granted by `equip_item` after level unlock).

Extend cosmetic kinds: add `frame` and `border` alongside existing `title`/`username_color`; `equip_item` handles them and `profiles` stores the equipped IDs.

## RPCs

- `add_xp(p_amount int, p_source text)` — adds XP, handles level-up loop, returns `{ new_level, xp, xp_to_next, leveled_up, unlocks[] }`. Auto-inserts level reward entries.
- `claim_level_reward(p_level int)` — grants souls/title/color/frame from a config table lookup, marks claimed
- `claim_daily_login()` — computes streak from `last_claim_day` vs `current_day_key`, grants day-N reward (souls/pack), triggers XP, returns full state
- `get_daily_login_state()` — streak, day index, next-claim countdown seconds, calendar
- `track_achievement(p_id text, p_progress int)` — increments, unlocks when target hit, grants XP+souls+title, returns unlock info
- `set_avatar(p_character_id text)` / `set_favorite(p_character_id text)` — validates ownership via `user_collection`
- `get_public_profile(p_user_id uuid)` — returns full profile card data (safe fields only)
- `get_my_profile_full()` — same for own profile including private counters
- `get_my_achievements()` — catalog + progress joined
- `get_level_rewards_state()` — list of milestones with claimed flag

Extend existing RPCs to call `add_xp` and `track_achievement` internally:
- `submit_score` → XP + draft achievements + updates best_draft_score/drafts_played
- `open_pack` → XP + pack achievements + packs_opened
- `battle_rival` → XP + rivals achievements + highest_rival_rating
- `submit_bleachdle` → XP + bleachdle achievements
- `claim_mission` → XP
- `purchase_item` → economy achievements

## Frontend

New routes under `_authenticated/`:
- `profile.$userId.tsx` — public profile card
- `profile.index.tsx` — own profile (edit avatar/favorite, quick stats, recent achievements)
- `achievements.tsx` — grouped by category with rarity chips, progress bars, unlock animation
- `daily.tsx` — 7-day calendar, streak counter, animated claim
- `levels.tsx` — level track with milestone rewards, claim buttons

New components:
- `AvatarPicker` — modal with search / rarity filter / owned-only grid + live preview
- `PlayerAvatar` — reusable circular avatar using character artwork with frame overlay
- `XPBar` — animated progress bar, used in header + profile
- `LevelUpOverlay` — full-screen confetti + glow + sound, triggered via context
- `AchievementToast` — celebration on unlock
- `UsernameBadge` — renders username with color + title + frame; used across leaderboards, rivals, battle reports

Global `ProgressionProvider` in `__root.tsx`:
- Listens for XP/achievement RPC results via a small event bus (`emitXp`, `emitUnlock`)
- Shows `LevelUpOverlay` / `AchievementToast` from anywhere
- Refreshes souls + level in header

Header additions: level badge + XP mini-bar next to souls, avatar next to menu.
MobileNav + hub: links to Profile / Daily / Achievements / Levels.

Leaderboard, Rivals list, and battle report render `PlayerAvatar` + `UsernameBadge`; clicking a name navigates to `/profile/$userId`.

## i18n

Add EN/AR strings for every new label, milestone name, achievement name/description, and toast copy.

## Config

`src/lib/progression.ts`:
- `xpForLevel(n)` — soft curve, e.g. `50 * n * (n + 1)`
- `LEVEL_REWARDS` — milestone table (level → souls/title/color/frame/border)
- `DAILY_REWARDS` — 7-day cycle
- Achievement id constants + tracker helpers so every game mode calls `track('draft_score_90')` etc.

## Technical notes

```text
Game mode action
  └─► existing RPC (submit_score / open_pack / battle_rival / submit_bleachdle / …)
        ├─► existing gameplay logic
        ├─► add_xp(N)          ── returns level-up info
        └─► track_achievement()── returns unlock info
              │
              ▼
        Client receives {xp, level_up, unlocks[]}
              │
              ▼
        ProgressionProvider fires overlays + refreshes header
```

Missing a day resets `streak` to 1 on next claim; already-claimed rewards remain in inventory. Level reward cosmetics use the same `store_items` + `user_inventory` pipeline so they equip through existing Settings UI.

Public profile fetched via `get_public_profile` returns only safe fields (no email, no private counters exposed for other users beyond those listed in the spec).
