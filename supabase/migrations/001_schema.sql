-- Enable required extensions
create extension if not exists "pgcrypto";

-- Enum definitions
create type if not exists room_kind as enum ('group', 'dm');
create type if not exists member_role as enum ('admin', 'member');
create type if not exists message_type as enum ('text', 'image', 'file', 'system');

-- Profiles: public info + 8-digit account id
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  account_id8 char(8) not null unique,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text,
  avatar_url text,
  expo_push_token text,
  created_at timestamptz default now()
);
create index if not exists idx_profiles_account8 on public.profiles(account_id8);

create or replace view public.profiles_public as
select user_id, account_id8, username, display_name, avatar_url, created_at
from public.profiles;

-- Rooms
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  kind room_kind not null,
  code6 char(6),
  creator uuid not null references auth.users(id),
  is_public boolean default true,
  is_persistent boolean default false,
  expires_at timestamptz,
  created_at timestamptz default now(),
  unique (code6) where (code6 is not null)
);

-- Room members
create table if not exists public.room_members (
  room_id uuid references public.rooms(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role member_role not null default 'member',
  joined_at timestamptz default now(),
  left_at timestamptz,
  primary key (room_id, user_id)
);
create index if not exists idx_room_members_user on public.room_members(user_id);

-- Messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  sender uuid not null references auth.users(id),
  type message_type not null default 'text',
  text text,
  file_url text,
  meta jsonb,
  created_at timestamptz default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);
create index if not exists idx_messages_room_created on public.messages(room_id, created_at desc);

-- Read states
create table if not exists public.read_states (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

-- Invites (for private rooms)
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  invited_account_id8 char(8) not null,
  invited_by uuid not null references auth.users(id),
  created_at timestamptz default now(),
  unique (room_id, invited_account_id8)
);

-- Call signals (WebRTC)
create table if not exists public.call_signals (
  id uuid primary key default gen_random_uuid(),
  dm_room_id uuid not null references public.rooms(id) on delete cascade,
  from_user uuid not null references auth.users(id),
  to_user uuid not null references auth.users(id),
  payload jsonb not null,
  created_at timestamptz default now()
);

-- Utility functions
create or replace function public.generate_account_id8()
returns char(8)
language plpgsql
as $$
declare
  candidate char(8);
begin
  loop
    candidate := lpad(floor(random()*1e8)::text, 8, '0');
    exit when not exists (select 1 from public.profiles where account_id8 = candidate);
  end loop;
  return candidate;
end;
$$;

create or replace function public.generate_code6()
returns char(6)
language plpgsql
as $$
declare
  candidate char(6);
begin
  loop
    candidate := lpad(floor(random()*1e6)::text, 6, '0');
    exit when not exists (select 1 from public.rooms where code6 = candidate);
  end loop;
  return candidate;
end;
$$;
