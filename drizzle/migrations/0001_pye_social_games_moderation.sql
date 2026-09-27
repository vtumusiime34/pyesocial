-- ============ MESSAGING ============
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null,
  user_b uuid not null,
  last_message text not null default '',
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (user_a < user_b),
  unique (user_a, user_b)
);
grant select, insert, update on public.conversations to authenticated;
grant all on public.conversations to service_role;
alter table public.conversations enable row level security;
create policy "own conversations" on public.conversations for select to authenticated using (auth.uid() in (user_a, user_b));
create policy "create own conversation" on public.conversations for insert to authenticated with check (auth.uid() in (user_a, user_b));
create policy "update own conversation" on public.conversations for update to authenticated using (auth.uid() in (user_a, user_b));

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null,
  text text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index messages_conv_idx on public.messages (conversation_id, created_at);
grant select, insert, update on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
create policy "read own conversation messages" on public.messages for select to authenticated
  using (exists (select 1 from public.conversations c where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b)));
create policy "send as self" on public.messages for insert to authenticated
  with check (auth.uid() = sender_id and exists (select 1 from public.conversations c where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b)));
create policy "mark read in own conversation" on public.messages for update to authenticated
  using (exists (select 1 from public.conversations c where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b)));

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null,
  actor_id uuid,
  content text not null default '',
  target_id text,
  target_type text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "own notifications" on public.notifications for select to authenticated using (auth.uid() = user_id);
create policy "notify others" on public.notifications for insert to authenticated with check (auth.uid() = actor_id);
create policy "update own notifications" on public.notifications for update to authenticated using (auth.uid() = user_id);
create policy "delete own notifications" on public.notifications for delete to authenticated using (auth.uid() = user_id);

-- ============ CONFERENCES ============
create table public.conferences (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null,
  title text not null,
  description text not null default '',
  cover_image text not null default '',
  scheduled_date text not null default '',
  scheduled_time text not null default '',
  max_participants integer not null default 100,
  privacy text not null default 'public',
  speakers text[] not null default '{}',
  category text not null default 'General',
  sponsored_by text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.conferences to authenticated;
grant select on public.conferences to anon;
grant all on public.conferences to service_role;
alter table public.conferences enable row level security;
create policy "conferences public read" on public.conferences for select using (true);
create policy "host own conference" on public.conferences for insert to authenticated with check (auth.uid() = host_id);
create policy "update own conference" on public.conferences for update to authenticated using (auth.uid() = host_id);
create policy "delete own conference" on public.conferences for delete to authenticated using (auth.uid() = host_id or public.has_role(auth.uid(),'admin'));

create table public.conference_participants (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.conferences(id) on delete cascade,
  user_id uuid not null,
  joined_at timestamptz not null default now(),
  unique (conference_id, user_id)
);
grant select, insert, delete on public.conference_participants to authenticated;
grant select on public.conference_participants to anon;
grant all on public.conference_participants to service_role;
alter table public.conference_participants enable row level security;
create policy "participants public read" on public.conference_participants for select using (true);
create policy "join as self" on public.conference_participants for insert to authenticated with check (auth.uid() = user_id);
create policy "leave as self" on public.conference_participants for delete to authenticated using (auth.uid() = user_id);

-- ============ GAMES ============
create table public.game_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  game_id text not null,
  result text not null check (result in ('win','loss','draw')),
  score integer not null default 0,
  coins_earned integer not null default 0,
  opponent_name text not null default '',
  played_at timestamptz not null default now()
);
create index game_records_user_idx on public.game_records (user_id, played_at desc);
grant select on public.game_records to authenticated;
grant all on public.game_records to service_role;
alter table public.game_records enable row level security;
create policy "game records public read" on public.game_records for select using (true);

create table public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  game_id text not null,
  host_id uuid not null,
  guest_id uuid,
  status text not null default 'waiting' check (status in ('waiting','playing','finished','abandoned')),
  turn_user_id uuid,
  state jsonb not null default '{}'::jsonb,
  winner_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index game_rooms_open_idx on public.game_rooms (game_id, status);
grant select, insert, update on public.game_rooms to authenticated;
grant all on public.game_rooms to service_role;
alter table public.game_rooms enable row level security;
create policy "rooms readable" on public.game_rooms for select to authenticated using (true);
create policy "host creates room" on public.game_rooms for insert to authenticated with check (auth.uid() = host_id);
create policy "players update room" on public.game_rooms for update to authenticated
  using (auth.uid() = host_id or auth.uid() = guest_id or (guest_id is null and status = 'waiting'));

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.game_rooms;

-- ============ MODERATION ============
create table public.safety_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null,
  reported_item_id text not null,
  reported_item_type text not null,
  reported_title text,
  reason text not null,
  description text not null default '',
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.safety_reports to authenticated;
grant all on public.safety_reports to service_role;
alter table public.safety_reports enable row level security;
create policy "own reports" on public.safety_reports for select to authenticated using (auth.uid() = reporter_id);
create policy "admins read reports" on public.safety_reports for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "report as self" on public.safety_reports for insert to authenticated with check (auth.uid() = reporter_id);
create policy "admins update reports" on public.safety_reports for update to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.blocked_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  blocked_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, blocked_id)
);
grant select, insert, delete on public.blocked_users to authenticated;
grant all on public.blocked_users to service_role;
alter table public.blocked_users enable row level security;
create policy "own blocks" on public.blocked_users for select to authenticated using (auth.uid() = user_id);
create policy "block as self" on public.blocked_users for insert to authenticated with check (auth.uid() = user_id);
create policy "unblock as self" on public.blocked_users for delete to authenticated using (auth.uid() = user_id);

create table public.account_appeals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  username text not null default '',
  email text not null default '',
  message text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
grant select, insert on public.account_appeals to authenticated;
grant all on public.account_appeals to service_role;
alter table public.account_appeals enable row level security;
create policy "own appeals" on public.account_appeals for select to authenticated using (auth.uid() = user_id);
create policy "admins read appeals" on public.account_appeals for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "appeal as self" on public.account_appeals for insert to authenticated with check (auth.uid() = user_id);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null,
  action text not null,
  target text not null default '',
  details text not null default '',
  created_at timestamptz not null default now()
);
grant select on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "admins read audit" on public.audit_logs for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- ============ MONETIZATION ============
create table public.advertisements (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null,
  advertiser_name text not null default '',
  title text not null,
  description text not null default '',
  media_url text not null default '',
  media_type text not null default 'image',
  destination_url text not null default '',
  call_to_action text not null default 'Learn more',
  category text not null default 'General',
  start_date text not null default '',
  end_date text not null default '',
  budget_coins integer not null default 0,
  status text not null default 'pending_review',
  target_audience text not null default 'all',
  impressions integer not null default 0,
  clicks integer not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.advertisements to authenticated;
grant all on public.advertisements to service_role;
alter table public.advertisements enable row level security;
create policy "active ads public" on public.advertisements for select using (status = 'active');
create policy "own ads" on public.advertisements for select to authenticated using (auth.uid() = advertiser_id);
create policy "admins read ads" on public.advertisements for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "create own ad" on public.advertisements for insert to authenticated with check (auth.uid() = advertiser_id);
create policy "update own ad" on public.advertisements for update to authenticated using (auth.uid() = advertiser_id or public.has_role(auth.uid(),'admin'));

create table public.promoted_content (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null,
  content_id text not null,
  content_type text not null,
  content_title text not null default '',
  goal text not null default 'more_content_views',
  audience text not null default 'all',
  duration_days integer not null default 1,
  budget_coins integer not null default 0,
  status text not null default 'pending_review',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.promoted_content to authenticated;
grant all on public.promoted_content to service_role;
alter table public.promoted_content enable row level security;
create policy "active promotions public" on public.promoted_content for select using (status = 'active');
create policy "own promotions" on public.promoted_content for select to authenticated using (auth.uid() = author_id);
create policy "create own promotion" on public.promoted_content for insert to authenticated with check (auth.uid() = author_id);
create policy "update own promotion" on public.promoted_content for update to authenticated using (auth.uid() = author_id or public.has_role(auth.uid(),'admin'));