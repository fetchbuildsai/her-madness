-- HER MADNESS — Supabase Schema
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/pwuayyyqonocvuozycek/sql

-- ============================================================
-- PROFILES
-- One row per user, created automatically after signup
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  favorite_team text,
  instagram text,
  tiktok text,
  twitter text,
  threads text,
  linkedin text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Auto-create profile row when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- ============================================================
-- TEAMS
-- Populated with the 2026 NCAA Women's Tournament field
-- ============================================================
create table if not exists public.teams (
  id serial primary key,
  name text not null,
  seed integer not null check (seed between 1 and 16),
  region text not null check (region in ('Albany', 'Greensboro', 'Portland', 'Spokane')),
  abbreviation text,
  primary_color text default '#ffffff',
  secondary_color text default '#000000'
);

-- RLS — teams are public read
alter table public.teams enable row level security;
create policy "Teams are viewable by everyone" on public.teams for select using (true);

-- ============================================================
-- BRACKETS
-- One bracket per user (enforced via unique constraint)
-- picks: JSONB — { "Albany_1": teamId, "Albany_2": teamId, ... }
-- scoring: 10/20/40/80/160/320 pts per round
-- ============================================================
create table if not exists public.brackets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  picks jsonb default '{}'::jsonb not null,
  score integer default 0 not null,
  submitted_at timestamptz,
  locked_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (user_id)
);

-- RLS
alter table public.brackets enable row level security;
create policy "Brackets are viewable by everyone" on public.brackets for select using (true);
create policy "Users can insert own bracket" on public.brackets for insert with check (auth.uid() = user_id);
create policy "Users can update own bracket (if not locked)" on public.brackets for update
  using (auth.uid() = user_id and locked_at is null);

-- ============================================================
-- GAMES
-- Each tournament matchup. winner_id set as games complete.
-- ============================================================
create table if not exists public.games (
  id serial primary key,
  round integer not null check (round between 1 and 6),
  region text,
  game_slot text,               -- e.g. "Albany_R1_G1"
  team1_id integer references public.teams(id),
  team2_id integer references public.teams(id),
  team1_score integer,
  team2_score integer,
  winner_id integer references public.teams(id),
  tip_off timestamptz,
  status text default 'upcoming' check (status in ('upcoming', 'live', 'final'))
);

-- RLS — games are public read, only admin writes (via service role)
alter table public.games enable row level security;
create policy "Games are viewable by everyone" on public.games for select using (true);

-- ============================================================
-- MESSAGES (Community Chat)
-- game_id null = global chat, set = per-game chat room
-- ============================================================
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  game_id integer references public.games(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  flagged boolean default false,
  created_at timestamptz default now() not null
);

-- RLS
alter table public.messages enable row level security;
create policy "Messages are viewable by everyone" on public.messages for select using (not flagged);
create policy "Authenticated users can send messages" on public.messages
  for insert with check (auth.uid() = user_id);
create policy "Users can delete own messages" on public.messages
  for delete using (auth.uid() = user_id);

-- Real-time: enable for messages table
alter publication supabase_realtime add table public.messages;

-- ============================================================
-- FEATURE SUGGESTIONS
-- Submitted via the feature tab on the app
-- ============================================================
create table if not exists public.feature_suggestions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  suggestion text not null check (char_length(suggestion) between 5 and 500),
  created_at timestamptz default now() not null
);

alter table public.feature_suggestions enable row level security;
create policy "Anyone can submit suggestions" on public.feature_suggestions
  for insert with check (true);
create policy "Suggestions viewable by owner" on public.feature_suggestions
  for select using (auth.uid() = user_id);
