-- ============ ROLES ============
create type public.app_role as enum ('user','creator','admin','business');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own roles readable" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "admins read roles" on public.user_roles for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key,
  username text not null unique,
  full_name text not null default '',
  email text not null default '',
  phone text,
  gender text,
  birth_date text,
  avatar text not null default '',
  banner text,
  bio text not null default '',
  is_verified boolean not null default false,
  pie_id text not null,
  role public.app_role not null default 'user',
  is_business boolean not null default false,
  business_profile jsonb,
  privacy_settings jsonb not null default '{"isPrivateAccount":false,"whoCanMessage":"everyone","whoCanComment":"everyone","whoCanMention":"everyone","allowDownload":true,"showActivityStatus":true}'::jsonb,
  is_deactivated boolean not null default false,
  created_at timestamptz not null default now()
);
create index profiles_username_idx on public.profiles (lower(username));
grant select, insert, update on public.profiles to authenticated;
grant select on public.profiles to anon;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles are public" on public.profiles for select using (true);
create policy "insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "update own profile" on public.profiles for update to authenticated using (auth.uid() = id);

-- ============ WALLETS (server-controlled) ============
create table public.wallets (
  user_id uuid primary key,
  silver_coins integer not null default 0,
  gold_coins integer not null default 0,
  signup_bonus_granted boolean not null default false,
  last_daily_claim_at timestamptz,
  updated_at timestamptz not null default now()
);
grant select on public.wallets to authenticated;
grant all on public.wallets to service_role;
alter table public.wallets enable row level security;
create policy "wallets are public read" on public.wallets for select using (true);

create table public.coin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  currency text not null check (currency in ('silver','gold')),
  type text not null check (type in ('credit','debit')),
  amount integer not null check (amount > 0),
  reason text not null default '',
  status text not null default 'completed',
  created_at timestamptz not null default now()
);
create index coin_tx_user_idx on public.coin_transactions (user_id, created_at desc);
grant select on public.coin_transactions to authenticated;
grant all on public.coin_transactions to service_role;
alter table public.coin_transactions enable row level security;
create policy "own transactions" on public.coin_transactions for select to authenticated using (auth.uid() = user_id);
create policy "admins read transactions" on public.coin_transactions for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- one-time signup reward: 15 SPC + 2 GPC, granted by the server on profile creation
create or replace function public.grant_signup_reward()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.wallets (user_id, silver_coins, gold_coins, signup_bonus_granted)
  values (new.id, 15, 2, true)
  on conflict (user_id) do nothing;

  if found then
    insert into public.coin_transactions (user_id, currency, type, amount, reason)
    values (new.id, 'silver', 'credit', 15, 'Welcome reward'),
           (new.id, 'gold', 'credit', 2, 'Welcome reward');
  end if;

  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  return new;
end;
$$;
create trigger profiles_signup_reward after insert on public.profiles
for each row execute function public.grant_signup_reward();

-- ============ GRAPH ============
create table public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null,
  following_id uuid not null,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);
create index follows_following_idx on public.follows (following_id);
grant select, insert, delete on public.follows to authenticated;
grant select on public.follows to anon;
grant all on public.follows to service_role;
alter table public.follows enable row level security;
create policy "follows public read" on public.follows for select using (true);
create policy "follow as self" on public.follows for insert to authenticated with check (auth.uid() = follower_id);
create policy "unfollow as self" on public.follows for delete to authenticated using (auth.uid() = follower_id);

create table public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  target_id text not null,
  target_type text not null,
  created_at timestamptz not null default now(),
  unique (user_id, target_id, target_type)
);
create index likes_target_idx on public.likes (target_id);
grant select, insert, delete on public.likes to authenticated;
grant select on public.likes to anon;
grant all on public.likes to service_role;
alter table public.likes enable row level security;
create policy "likes public read" on public.likes for select using (true);
create policy "like as self" on public.likes for insert to authenticated with check (auth.uid() = user_id);
create policy "unlike as self" on public.likes for delete to authenticated using (auth.uid() = user_id);

create table public.saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  target_id text not null,
  target_type text not null,
  created_at timestamptz not null default now(),
  unique (user_id, target_id, target_type)
);
grant select, insert, delete on public.saves to authenticated;
grant all on public.saves to service_role;
alter table public.saves enable row level security;
create policy "own saves" on public.saves for select to authenticated using (auth.uid() = user_id);
create policy "save as self" on public.saves for insert to authenticated with check (auth.uid() = user_id);
create policy "unsave as self" on public.saves for delete to authenticated using (auth.uid() = user_id);

-- ============ CONTENT ============
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null,
  caption text not null default '',
  media_url text,
  media_type text,
  hashtags text[] not null default '{}',
  space_slug text,
  shares_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index posts_created_idx on public.posts (created_at desc);
create index posts_author_idx on public.posts (author_id);
grant select, insert, update, delete on public.posts to authenticated;
grant select on public.posts to anon;
grant all on public.posts to service_role;
alter table public.posts enable row level security;
create policy "posts public read" on public.posts for select using (true);
create policy "insert own post" on public.posts for insert to authenticated with check (auth.uid() = author_id);
create policy "update own post" on public.posts for update to authenticated using (auth.uid() = author_id);
create policy "delete own post" on public.posts for delete to authenticated using (auth.uid() = author_id or public.has_role(auth.uid(),'admin'));

create table public.pyes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null,
  title text,
  caption text not null default '',
  video_url text not null,
  poster_url text not null default '',
  music_title text,
  music_author text,
  sound_id uuid,
  hashtags text[] not null default '{}',
  space_slug text,
  views_count integer not null default 0,
  shares_count integer not null default 0,
  visibility text not null default 'public',
  moderation_status text not null default 'approved',
  created_at timestamptz not null default now()
);
create index pyes_created_idx on public.pyes (created_at desc);
create index pyes_author_idx on public.pyes (author_id);
grant select, insert, update, delete on public.pyes to authenticated;
grant select on public.pyes to anon;
grant all on public.pyes to service_role;
alter table public.pyes enable row level security;
create policy "public pyes readable" on public.pyes for select using (visibility = 'public');
create policy "own pyes readable" on public.pyes for select to authenticated using (auth.uid() = author_id);
create policy "insert own pyes" on public.pyes for insert to authenticated with check (auth.uid() = author_id);
create policy "update own pyes" on public.pyes for update to authenticated using (auth.uid() = author_id);
create policy "delete own pyes" on public.pyes for delete to authenticated using (auth.uid() = author_id or public.has_role(auth.uid(),'admin'));

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  target_id text not null,
  target_type text not null,
  author_id uuid not null,
  text text not null,
  created_at timestamptz not null default now()
);
create index comments_target_idx on public.comments (target_id, created_at desc);
grant select, insert, delete on public.comments to authenticated;
grant select on public.comments to anon;
grant all on public.comments to service_role;
alter table public.comments enable row level security;
create policy "comments public read" on public.comments for select using (true);
create policy "insert own comment" on public.comments for insert to authenticated with check (auth.uid() = author_id);
create policy "delete own comment" on public.comments for delete to authenticated using (auth.uid() = author_id or public.has_role(auth.uid(),'admin'));

create table public.sounds (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null default '',
  author_id uuid,
  audio_url text not null,
  cover_url text not null default '',
  duration text not null default '0:00',
  category text not null default 'Original',
  plays_count integer not null default 0,
  usage_count integer not null default 0,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index sounds_title_idx on public.sounds (lower(title));
grant select, insert, update on public.sounds to authenticated;
grant select on public.sounds to anon;
grant all on public.sounds to service_role;
alter table public.sounds enable row level security;
create policy "sounds public read" on public.sounds for select using (true);
create policy "insert own sound" on public.sounds for insert to authenticated with check (auth.uid() = author_id);
create policy "update own sound" on public.sounds for update to authenticated using (auth.uid() = author_id);