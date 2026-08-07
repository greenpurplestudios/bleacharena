
create table if not exists public.duel_matches (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id) on delete cascade,
  guest_id uuid references auth.users(id) on delete cascade,
  status text not null default 'queued',
  state jsonb,
  guest_moves jsonb,
  host_ready boolean not null default false,
  guest_ready boolean not null default false,
  winner text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.duel_matches to authenticated;
grant all on public.duel_matches to service_role;
alter table public.duel_matches enable row level security;

create policy "participants read matches" on public.duel_matches
  for select to authenticated
  using (auth.uid() = host_id or auth.uid() = guest_id or (status = 'queued' and guest_id is null));

create policy "participants update matches" on public.duel_matches
  for update to authenticated
  using (auth.uid() = host_id or auth.uid() = guest_id)
  with check (auth.uid() = host_id or auth.uid() = guest_id);

create policy "host deletes match" on public.duel_matches
  for delete to authenticated
  using (auth.uid() = host_id);

create table if not exists public.duel_ranks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rating integer not null default 1000,
  wins integer not null default 0,
  losses integer not null default 0,
  draws integer not null default 0,
  week_start date not null default ((now() at time zone 'Asia/Riyadh')::date - ((extract(dow from (now() at time zone 'Asia/Riyadh'))::int)) ),
  updated_at timestamptz not null default now()
);

grant select on public.duel_ranks to authenticated;
grant all on public.duel_ranks to service_role;
alter table public.duel_ranks enable row level security;

create policy "ranks readable" on public.duel_ranks
  for select to authenticated using (true);

create or replace function public.duel_week_start()
returns date language sql stable as $$
  select ((now() at time zone 'Asia/Riyadh')::date
    - (extract(dow from (now() at time zone 'Asia/Riyadh'))::int))
$$;

-- Matchmaking: join a waiting match or open one.
create or replace function public.duel_find_match()
returns public.duel_matches
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  m public.duel_matches;
begin
  if me is null then raise exception 'auth required'; end if;

  -- Already waiting or playing? return it.
  select * into m from public.duel_matches
   where status in ('queued','active') and (host_id = me or guest_id = me)
   order by created_at desc limit 1;
  if found then return m; end if;

  update public.duel_matches d
     set guest_id = me, status = 'active', updated_at = now()
   where d.id = (
     select id from public.duel_matches
      where status = 'queued' and guest_id is null and host_id <> me
        and created_at > now() - interval '3 minutes'
      order by created_at asc
      for update skip locked
      limit 1)
  returning * into m;
  if found then return m; end if;

  insert into public.duel_matches (host_id) values (me) returning * into m;
  return m;
end;
$$;

create or replace function public.duel_leave_match(p_match uuid)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  update public.duel_matches
     set status = 'ended', updated_at = now()
   where id = p_match and (host_id = me or guest_id = me);
end;
$$;

-- Result reporting with a simple Elo-style adjustment and weekly reset.
create or replace function public.duel_report_result(p_match uuid, p_winner text)
returns void language plpgsql security definer set search_path = public as $$
declare
  m public.duel_matches;
  wk date := public.duel_week_start();
  w uuid; l uuid;
begin
  select * into m from public.duel_matches where id = p_match;
  if not found or m.guest_id is null then return; end if;
  if auth.uid() <> m.host_id then return; end if;
  if m.winner is not null then return; end if;

  update public.duel_matches
     set winner = p_winner, status = 'ended', updated_at = now()
   where id = p_match;

  insert into public.duel_ranks (user_id, week_start) values (m.host_id, wk)
    on conflict (user_id) do nothing;
  insert into public.duel_ranks (user_id, week_start) values (m.guest_id, wk)
    on conflict (user_id) do nothing;

  update public.duel_ranks
     set rating = 1000, wins = 0, losses = 0, draws = 0, week_start = wk
   where user_id in (m.host_id, m.guest_id) and week_start < wk;

  if p_winner = 'tie' then
    update public.duel_ranks set draws = draws + 1, rating = rating + 5, updated_at = now()
     where user_id in (m.host_id, m.guest_id);
    return;
  end if;

  if p_winner = 'host' then w := m.host_id; l := m.guest_id;
  else w := m.guest_id; l := m.host_id; end if;

  update public.duel_ranks set wins = wins + 1, rating = rating + 25, updated_at = now() where user_id = w;
  update public.duel_ranks set losses = losses + 1, rating = greatest(0, rating - 18), updated_at = now() where user_id = l;
end;
$$;

create or replace function public.duel_leaderboard(p_limit integer default 50)
returns table (user_id uuid, username text, name_frame text, username_color text,
               avatar_character_id text, rating integer, wins integer, losses integer, draws integer)
language sql stable security definer set search_path = public as $$
  select r.user_id, p.username, p.name_frame, p.username_color,
         p.avatar_character_id, r.rating, r.wins, r.losses, r.draws
    from public.duel_ranks r
    join public.profiles p on p.user_id = r.user_id
   where r.week_start >= public.duel_week_start()
   order by r.rating desc, r.wins desc
   limit coalesce(p_limit, 50)
$$;

alter publication supabase_realtime add table public.duel_matches;
