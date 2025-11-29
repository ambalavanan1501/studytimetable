-- 1. Create profiles table if it doesn't exist
create table if not exists public.profiles (
  id uuid not null references auth.users (id) on delete cascade,
  full_name text null,
  avatar_url text null,
  university text null,
  branch text null,
  semester text null,
  attendance_goal integer default 75,
  accent_color text default 'purple',
  cgpa numeric default 0,
  credits integer default 0,
  notifications_enabled boolean default true,
  updated_at timestamp with time zone,
  constraint profiles_pkey primary key (id)
);

-- 2. Add columns if they don't exist (in case table already exists but is old)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'university') then
    alter table public.profiles add column university text null;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'branch') then
    alter table public.profiles add column branch text null;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'semester') then
    alter table public.profiles add column semester text null;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'attendance_goal') then
    alter table public.profiles add column attendance_goal integer default 75;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'accent_color') then
    alter table public.profiles add column accent_color text default 'purple';
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'cgpa') then
    alter table public.profiles add column cgpa numeric default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'credits') then
    alter table public.profiles add column credits integer default 0;
  end if;
end $$;

-- 3. Enable RLS
alter table public.profiles enable row level security;

-- 4. Create Policies (Drop existing first to avoid errors)
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- 5. Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- 6. Trigger to call the function on new user creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
