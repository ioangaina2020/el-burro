-- El Burro Task Manager: rulează tot scriptul în Supabase > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('admin','viewer')),
  created_at timestamptz not null default now()
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade text not null check (grade in ('Vice President','Treasurer','Sergent','Enforcer','Road Captain','Membru','Prospect')),
  created_at timestamptz not null default now()
);

create table if not exists public.weekly_records (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  week_key text not null,
  status text not null default 'Activ' check (status in ('Activ','Scutit','Inactivitate')),
  done boolean not null default false,
  paid boolean not null default false,
  updated_at timestamptz not null default now(),
  unique(member_id, week_key)
);

create table if not exists public.app_settings (
  id integer primary key check (id=1),
  task_amount bigint not null default 740000
);
insert into public.app_settings(id,task_amount) values(1,740000) on conflict(id) do nothing;

create or replace function public.is_admin()
returns boolean language sql stable security definer
set search_path = public
as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin'); $$;

alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.weekly_records enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "profile read self or admin" on public.profiles;
create policy "profile read self or admin" on public.profiles for select to authenticated using (id=auth.uid() or public.is_admin());
drop policy if exists "members visible to signed in users" on public.members;
create policy "members visible to signed in users" on public.members for select to authenticated using (true);
drop policy if exists "members admin insert" on public.members;
create policy "members admin insert" on public.members for insert to authenticated with check (public.is_admin());
drop policy if exists "members admin update" on public.members;
create policy "members admin update" on public.members for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "members admin delete" on public.members;
create policy "members admin delete" on public.members for delete to authenticated using (public.is_admin());

drop policy if exists "records visible to signed in users" on public.weekly_records;
create policy "records visible to signed in users" on public.weekly_records for select to authenticated using (true);
drop policy if exists "records admin insert" on public.weekly_records;
create policy "records admin insert" on public.weekly_records for insert to authenticated with check (public.is_admin());
drop policy if exists "records admin update" on public.weekly_records;
create policy "records admin update" on public.weekly_records for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "records admin delete" on public.weekly_records;
create policy "records admin delete" on public.weekly_records for delete to authenticated using (public.is_admin());

drop policy if exists "settings visible to signed in users" on public.app_settings;
create policy "settings visible to signed in users" on public.app_settings for select to authenticated using (true);
drop policy if exists "settings admin update" on public.app_settings;
create policy "settings admin update" on public.app_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "settings admin insert" on public.app_settings;
create policy "settings admin insert" on public.app_settings for insert to authenticated with check (public.is_admin());

-- Profil automat pentru orice cont creat în Supabase Auth; implicit doar vizualizare.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  insert into public.profiles(id,role) values(new.id,'viewer');
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- După ce creezi conturile Auth, promovează DOAR contul tău la admin:
-- update public.profiles set role='admin'
-- where id=(select id from auth.users where email='ADRESA_TA_DE_EMAIL');
