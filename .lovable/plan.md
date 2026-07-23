This is a large change set. Here's the plan before I start.

## 1. Rebrand — "Bleach Arena"
- Rename the site everywhere to **Bleach Arena** (header, footer, page titles, meta, i18n EN+AR).
- "Bleach Draft" becomes the name of the draft mode only.
- New **Home hub** at `/` with 4 mode cards: Bleach Draft, Who Said That?, Leaderboard, Follow Us. The current landing hero moves into the Draft page intro.

## 2. Navigation — mobile-friendly corner button
- Add a floating menu button (bottom-right corner, respects RTL) that opens a sheet/drawer with links to: Home, Bleach Draft, Who Said That?, Leaderboard, Follow Us, plus language toggle.
- Existing desktop header links stay; the drawer is the mobile nav so the new "Who Said That?" tab is always reachable.

## 3. Follow Us page
- Add link card for **https://greenpurplestudios.github.io** alongside the existing Instagram + email cards.

## 4. Easter egg
- Clicking the Bleach logo 21 times shows a big purple+green gradient heart fullscreen overlay for 10 seconds with a soft pulse animation, then fades out. Counter resets after each trigger.

## 5. Roster — 3 new characters + 10 images
- New: Senjumaru Shutara (ultra→legendary, OVR 93), Soi Fon (epic, OVR 86), Baraggan Louisenbairn (legendary, OVR 87 — Segunda Espada).
- Wire uploaded images to: Baraggan, Don Kanonji, Jinta, Mizuiro, Ururu, Yumichika, Rangiku, Senjumaru, Soi Fon, Tatsuki.

## 6. Leaderboard (Lovable Cloud / Supabase)

**Data model** (single migration with GRANTs + RLS):
```
profiles(user_id pk, username unique citext, created_at, updated_at)
leaderboard_scores(
  id, user_id fk, season_key text, score numeric(5,2),
  submitted_at, unique(user_id, season_key)
)
seasons view: current ISO week key computed via SQL function week_key(now())
```
- **has_username()** helper + RLS: profiles readable by all authenticated; each user updates only own row. Scores readable by all authenticated; insert/update only own row via RPC.
- **`submit_score(p_score numeric)` SECURITY DEFINER RPC**:
  - clamps score to `[0, 100]`, rejects if not finite
  - computes current `season_key` server-side (never trusts client)
  - upserts: only writes if `p_score > existing.score` for `(user_id, current_season)`
  - requires a username set; returns `{ needs_username: true }` if not
- **`get_leaderboard(p_season text default null, p_limit int default 100)`**: returns rank, username, score for the requested (default current) season. Uses `RANK() OVER (ORDER BY score DESC)`.
- Weekly reset is implicit: `season_key` changes automatically each ISO week — no cron needed, all history preserved.

**Client flow**:
- On first visit, call `supabase.auth.signInAnonymously()` if no session (silent).
- After a completed draft, submit score via RPC. If it returns `needs_username`, show the bilingual popup (exact copy from the request). Save username → resubmit once.
- Debounce/guard the submit button to prevent duplicate submissions.
- Username editable from a small "Profile" section on the Leaderboard page.

**Leaderboard page** `/leaderboard`:
- Header with current week label ("Week of Mon DD").
- List: `#Rank  Username  Score` (score to 1 decimal, /100).
- Highlight current user's row.
- Skeleton loader while fetching; empty state ("Be the first to claim the top spot").
- Fully responsive; RTL-aware.
- React Query with 30s stale time.

## 7. Files touched
- Migrations: 1 new (profiles, scores, RPCs, RLS, GRANTs).
- New: `src/routes/leaderboard.tsx`, `src/routes/home.tsx` (or repurpose `index.tsx`), `src/components/MobileNavButton.tsx`, `src/components/UsernamePrompt.tsx`, `src/lib/leaderboard.ts`, `src/lib/anon-auth.ts`, `src/lib/easter-egg.tsx`.
- Edits: `characters.ts` (+3, +10 images), `SiteHeader.tsx`, `SiteFooter.tsx`, `follow.tsx`, `draft.tsx` (submit on complete), `i18n.tsx` (all new strings EN+AR), `__root.tsx` (mount mobile nav + anon-auth boot + easter egg listener).

## Technical notes
- Anonymous auth uses Supabase's built-in `signInAnonymously()`; profile row auto-created via trigger on `auth.users` insert.
- Username uniqueness enforced by unique index on `lower(username)`.
- Score clamped and validated server-side; client value never trusted.
- Score is stored per `(user_id, season_key)` so history for monthly/all-time views is a query change, not a schema change.

Confirm and I'll implement end-to-end.