-- Guest's equipped Ultimate Weapon, sent to the host so it can build the
-- authoritative duel with both sides' real loadouts.
alter table public.duel_matches
  add column if not exists guest_weapon_id text;
