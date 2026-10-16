create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  raw_description text not null default '',
  profile_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.checklist_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id text not null,
  status text not null check (status in ('pending', 'completed', 'needs_confirmation')),
  updated_at timestamptz not null default now(),
  unique (user_id, item_id)
);

alter table public.profiles enable row level security;
alter table public.business_profiles enable row level security;
alter table public.checklist_progress enable row level security;

create policy "Users can view their profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update their profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert their profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can manage their business profile"
  on public.business_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage their checklist"
  on public.checklist_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
