-- Enable RLS
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.messages enable row level security;
alter table public.read_states enable row level security;
alter table public.invites enable row level security;
alter table public.call_signals enable row level security;

-- Profiles policies
create policy profiles_self_select on public.profiles
  for select using (auth.uid() = user_id);

create policy profiles_self_update on public.profiles
  for update using (auth.uid() = user_id);

create policy profiles_public_select on public.profiles
  for select using (auth.role() = 'authenticated');

-- Rooms policies
create policy rooms_member_select on public.rooms
  for select using (
    exists (
      select 1 from public.room_members m
      where m.room_id = id and m.user_id = auth.uid()
    )
    or (kind = 'group' and is_public = true)
  );

create policy rooms_admin_update on public.rooms
  for update using (
    exists (
      select 1 from public.room_members m
      where m.room_id = id and m.user_id = auth.uid() and m.role = 'admin'
    )
  );

-- Room members policies
create policy room_members_select on public.room_members
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.room_members m
      where m.room_id = room_id and m.user_id = auth.uid() and m.role = 'admin'
    )
  );

create policy room_members_admin_insert on public.room_members
  for insert with check (
    exists (
      select 1 from public.room_members m
      where m.room_id = room_id and m.user_id = auth.uid() and m.role = 'admin'
    )
  );

create policy room_members_admin_delete on public.room_members
  for delete using (
    exists (
      select 1 from public.room_members m
      where m.room_id = room_id and m.user_id = auth.uid() and m.role = 'admin'
    )
  );

-- Messages policies
create policy messages_member_select on public.messages
  for select using (
    exists (
      select 1 from public.room_members m
      where m.room_id = room_id and m.user_id = auth.uid()
    )
  );

create policy messages_member_insert on public.messages
  for insert with check (
    exists (
      select 1 from public.room_members m
      where m.room_id = room_id and m.user_id = auth.uid()
    )
  );

create policy messages_edit_delete on public.messages
  for update using (
    sender = auth.uid()
    or exists (
      select 1 from public.room_members m
      where m.room_id = room_id and m.user_id = auth.uid() and m.role = 'admin'
    )
  );

-- Read states
create policy read_states_member on public.read_states
  for all using (
    exists (
      select 1 from public.room_members m
      where m.room_id = room_id and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.room_members m
      where m.room_id = room_id and m.user_id = auth.uid()
    )
  );

-- Invites
create policy invites_admin on public.invites
  for all using (
    exists (
      select 1 from public.room_members m
      where m.room_id = room_id and m.user_id = auth.uid() and m.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.room_members m
      where m.room_id = room_id and m.user_id = auth.uid() and m.role = 'admin'
    )
  );

-- Call signals (DM only)
create policy call_signals_dm on public.call_signals
  for all using (
    exists (
      select 1 from public.room_members m
      where m.room_id = dm_room_id and m.user_id = auth.uid()
    )
  );
