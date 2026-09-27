-- ============ MISSION CLAIMS (server-enforced, once per day) ============
create table public.mission_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  mission_id text not null,
  claim_date date not null default (now() at time zone 'utc')::date,
  created_at timestamptz not null default now(),
  unique (user_id, mission_id, claim_date)
);
grant select on public.mission_claims to authenticated;
grant all on public.mission_claims to service_role;
alter table public.mission_claims enable row level security;
create policy "own mission claims" on public.mission_claims for select to authenticated using (auth.uid() = user_id);

-- Fixed, server-side reward table: clients cannot choose amounts
create or replace function public.mission_reward(_mission_id text)
returns record language sql immutable as $$
  select * from (values
    ('watch_pyes', 5, 0),
    ('share_pulse', 5, 1),
    ('give_likes', 3, 0),
    ('play_game', 5, 1),
    ('listen_sound', 2, 0),
    ('checkin', 3, 0)
  ) as r(mission_id, silver, gold)
  where r.mission_id = _mission_id
$$;

create or replace function public.claim_mission_reward(_mission_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  s integer;
  g integer;
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'message', 'Please log in to claim reward');
  end if;

  select silver, gold into s, g from (values
    ('watch_pyes', 5, 0),
    ('share_pulse', 5, 1),
    ('give_likes', 3, 0),
    ('play_game', 5, 1),
    ('listen_sound', 2, 0),
    ('checkin', 3, 0)
  ) as r(mission_id, silver, gold) where r.mission_id = _mission_id;

  if s is null then
    return jsonb_build_object('ok', false, 'message', 'Unknown mission');
  end if;

  begin
    insert into public.mission_claims (user_id, mission_id) values (uid, _mission_id);
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'message', 'Already claimed today');
  end;

  update public.wallets
     set silver_coins = silver_coins + s,
         gold_coins = gold_coins + g,
         updated_at = now()
   where user_id = uid;

  if s > 0 then
    insert into public.coin_transactions (user_id, currency, type, amount, reason)
    values (uid, 'silver', 'credit', s, 'Mission reward: ' || _mission_id);
  end if;
  if g > 0 then
    insert into public.coin_transactions (user_id, currency, type, amount, reason)
    values (uid, 'gold', 'credit', g, 'Mission reward: ' || _mission_id);
  end if;

  return jsonb_build_object('ok', true, 'silver', s, 'gold', g,
    'message', 'Claimed +' || s || ' SPC' || case when g > 0 then ' and +' || g || ' GPC' else '' end || '!');
end;
$$;

-- ============ COIN TRANSFERS (tips & gifts) ============
create or replace function public.send_coins(_recipient uuid, _currency text, _amount integer, _reason text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  bal integer;
begin
  if uid is null then return jsonb_build_object('ok', false, 'message', 'Please log in'); end if;
  if uid = _recipient then return jsonb_build_object('ok', false, 'message', 'You cannot tip yourself'); end if;
  if _amount is null or _amount <= 0 then return jsonb_build_object('ok', false, 'message', 'Invalid amount'); end if;
  if _currency not in ('silver','gold') then return jsonb_build_object('ok', false, 'message', 'Invalid currency'); end if;
  if not exists (select 1 from public.profiles where id = _recipient) then
    return jsonb_build_object('ok', false, 'message', 'Recipient not found');
  end if;

  if _currency = 'gold' then
    update public.wallets set gold_coins = gold_coins - _amount, updated_at = now()
     where user_id = uid and gold_coins >= _amount returning gold_coins into bal;
  else
    update public.wallets set silver_coins = silver_coins - _amount, updated_at = now()
     where user_id = uid and silver_coins >= _amount returning silver_coins into bal;
  end if;

  if bal is null then
    return jsonb_build_object('ok', false, 'message', 'Insufficient balance');
  end if;

  if _currency = 'gold' then
    update public.wallets set gold_coins = gold_coins + _amount, updated_at = now() where user_id = _recipient;
  else
    update public.wallets set silver_coins = silver_coins + _amount, updated_at = now() where user_id = _recipient;
  end if;

  insert into public.coin_transactions (user_id, currency, type, amount, reason)
  values (uid, _currency, 'debit', _amount, coalesce(_reason, 'Gift sent')),
         (_recipient, _currency, 'credit', _amount, coalesce(_reason, 'Gift received'));

  insert into public.notifications (user_id, type, actor_id, content)
  values (_recipient, 'monetization', uid,
    'sent you ' || _amount || ' ' || case when _currency = 'gold' then 'GPC' else 'SPC' end);

  return jsonb_build_object('ok', true, 'message', 'Sent');
end;
$$;

-- ============ GAME OUTCOMES (server credits the reward) ============
create or replace function public.record_game_outcome(_game_id text, _result text, _score integer, _opponent_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  reward integer := 0;
begin
  if uid is null then return jsonb_build_object('ok', false, 'message', 'Please log in'); end if;
  if _result not in ('win','loss','draw') then return jsonb_build_object('ok', false, 'message', 'Invalid result'); end if;

  reward := case _result when 'win' then 5 when 'draw' then 2 else 0 end;

  insert into public.game_records (user_id, game_id, result, score, coins_earned, opponent_name)
  values (uid, _game_id, _result, coalesce(_score, 0), reward, coalesce(_opponent_name, ''));

  if reward > 0 then
    update public.wallets set silver_coins = silver_coins + reward, updated_at = now() where user_id = uid;
    insert into public.coin_transactions (user_id, currency, type, amount, reason)
    values (uid, 'silver', 'credit', reward, 'Arcade reward: ' || upper(_game_id));
  end if;

  return jsonb_build_object('ok', true, 'coinsEarned', reward);
end;
$$;

-- ============ COUNTERS (any viewer may increment, nothing else) ============
create or replace function public.increment_pyes_views(_pyes_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.pyes set views_count = views_count + 1 where id = _pyes_id;
$$;

create or replace function public.increment_pyes_shares(_pyes_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.pyes set shares_count = shares_count + 1 where id = _pyes_id;
$$;

create or replace function public.increment_post_shares(_post_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.posts set shares_count = shares_count + 1 where id = _post_id;
$$;

create or replace function public.increment_sound_plays(_sound_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.sounds set plays_count = plays_count + 1 where id = _sound_id;
$$;

create or replace function public.increment_sound_usage(_sound_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.sounds set usage_count = usage_count + 1 where id = _sound_id;
$$;

-- ============ ADMIN ACTIONS (role-checked server side) ============
create or replace function public.admin_set_verified(_user_id uuid, _verified boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then
    return jsonb_build_object('ok', false, 'message', 'Not authorized');
  end if;
  update public.profiles set is_verified = _verified where id = _user_id;
  insert into public.audit_logs (admin_id, action, target, details)
  values (auth.uid(), case when _verified then 'verify_user' else 'unverify_user' end, _user_id::text, '');
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.admin_set_deactivated(_user_id uuid, _deactivated boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then
    return jsonb_build_object('ok', false, 'message', 'Not authorized');
  end if;
  update public.profiles set is_deactivated = _deactivated where id = _user_id;
  insert into public.audit_logs (admin_id, action, target, details)
  values (auth.uid(), case when _deactivated then 'suspend_user' else 'restore_user' end, _user_id::text, '');
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.log_admin_action(_action text, _target text, _details text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then return; end if;
  insert into public.audit_logs (admin_id, action, target, details)
  values (auth.uid(), _action, coalesce(_target,''), coalesce(_details,''));
end;
$$;

grant execute on function public.claim_mission_reward(text) to authenticated;
grant execute on function public.send_coins(uuid, text, integer, text) to authenticated;
grant execute on function public.record_game_outcome(text, text, integer, text) to authenticated;
grant execute on function public.increment_pyes_views(uuid) to authenticated, anon;
grant execute on function public.increment_pyes_shares(uuid) to authenticated, anon;
grant execute on function public.increment_post_shares(uuid) to authenticated, anon;
grant execute on function public.increment_sound_plays(uuid) to authenticated, anon;
grant execute on function public.increment_sound_usage(uuid) to authenticated;
grant execute on function public.admin_set_verified(uuid, boolean) to authenticated;
grant execute on function public.admin_set_deactivated(uuid, boolean) to authenticated;
grant execute on function public.log_admin_action(text, text, text) to authenticated;