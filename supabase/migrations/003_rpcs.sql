create or replace function public.create_or_join_group(
  p_code6 char(6),
  p_is_public boolean default true,
  p_is_persistent boolean default false,
  p_invited_account_ids char(8)[] default '{}'
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_room public.rooms%rowtype;
  v_user uuid := auth.uid();
  v_expires_at timestamptz;
begin
  if v_user is null then
    raise exception 'auth required';
  end if;

  select * into v_room from public.rooms where code6 = p_code6 limit 1;
  if found then
    perform 1 from public.room_members where room_id = v_room.id and user_id = v_user;
    if not found then
      insert into public.room_members(room_id, user_id, role)
      values (v_room.id, v_user, 'member');
    end if;
    return v_room.id;
  end if;

  if not p_is_persistent then
    v_expires_at := now() + interval '24 hours';
  end if;

  insert into public.rooms (kind, code6, creator, is_public, is_persistent, expires_at)
  values ('group', p_code6, v_user, coalesce(p_is_public, true), coalesce(p_is_persistent, false), v_expires_at)
  returning * into v_room;

  insert into public.room_members(room_id, user_id, role)
  values (v_room.id, v_user, 'admin');

  if not coalesce(p_is_public, true) and array_length(p_invited_account_ids, 1) > 0 then
    insert into public.invites(room_id, invited_account_id8, invited_by)
    select v_room.id, account_id, v_user
    from unnest(p_invited_account_ids) as account_id;
  end if;

  return v_room.id;
end;
$$;

create or replace function public.create_or_open_dm(p_target_account_id8 char(8))
returns uuid
language plpgsql
security definer
as $$
declare
  v_current uuid := auth.uid();
  v_target uuid;
  v_room_id uuid;
begin
  if v_current is null then
    raise exception 'auth required';
  end if;

  select user_id into v_target from public.profiles where account_id8 = p_target_account_id8;
  if not found then
    raise exception 'target not found';
  end if;

  if v_target = v_current then
    raise exception 'cannot dm self';
  end if;

  select rm.room_id
    into v_room_id
    from public.room_members rm
    join public.rooms r on r.id = rm.room_id and r.kind = 'dm'
    where rm.user_id = v_current
      and exists (
        select 1 from public.room_members rm2
        where rm2.room_id = rm.room_id and rm2.user_id = v_target
      )
    limit 1;

  if found then
    return v_room_id;
  end if;

  insert into public.rooms (kind, creator, is_public)
  values ('dm', v_current, false)
  returning id into v_room_id;

  insert into public.room_members(room_id, user_id, role)
  values (v_room_id, v_current, 'admin'),
         (v_room_id, v_target, 'admin');

  return v_room_id;
end;
$$;

create or replace function public.post_message(
  p_room_id uuid,
  p_text text default null,
  p_file_url text default null,
  p_meta jsonb default '{}'::jsonb
)
returns public.messages
language plpgsql
security definer
as $$
declare
  v_user uuid := auth.uid();
  v_room public.rooms%rowtype;
  v_message public.messages%rowtype;
begin
  if v_user is null then
    raise exception 'auth required';
  end if;

  select * into v_room from public.rooms r
  where r.id = p_room_id
    and exists (
      select 1 from public.room_members m
      where m.room_id = r.id and m.user_id = v_user
    );
  if not found then
    raise exception 'room not found or forbidden';
  end if;

  insert into public.messages(room_id, sender, type, text, file_url, meta)
  values (p_room_id, v_user, case when p_file_url is not null then 'file' else 'text' end, p_text, p_file_url, p_meta)
  returning * into v_message;

  return v_message;
end;
$$;

create or replace function public.set_room_visibility(p_room_id uuid, p_is_public boolean)
returns public.rooms
language plpgsql
security definer
as $$
declare
  v_room public.rooms%rowtype;
begin
  update public.rooms
    set is_public = p_is_public
    where id = p_room_id
      and exists (
        select 1 from public.room_members m
        where m.room_id = p_room_id and m.user_id = auth.uid() and m.role = 'admin'
      )
    returning * into v_room;
  if not found then
    raise exception 'forbidden';
  end if;
  return v_room;
end;
$$;

create or replace function public.set_room_persistence(p_room_id uuid, p_is_persistent boolean)
returns public.rooms
language plpgsql
security definer
as $$
declare
  v_room public.rooms%rowtype;
begin
  update public.rooms
    set is_persistent = p_is_persistent,
        expires_at = case when p_is_persistent then null else now() + interval '24 hours' end
    where id = p_room_id
      and exists (
        select 1 from public.room_members m
        where m.room_id = p_room_id and m.user_id = auth.uid() and m.role = 'admin'
      )
    returning * into v_room;
  if not found then
    raise exception 'forbidden';
  end if;
  return v_room;
end;
$$;
