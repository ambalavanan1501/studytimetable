-- Create table for manual timetable entries
create table if not exists public.timetable_entries (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  day text not null,
  start_time time without time zone not null,
  end_time time without time zone not null,
  subject_name text not null,
  subject_code text not null,
  type text not null check (type in ('theory', 'lab')),
  room_number text null,
  slot_code text null,
  slot_label text null,
  created_at timestamp with time zone not null default now(),
  constraint timetable_entries_pkey primary key (id)
);

-- Create table for smart add entries (FFCS)
create table if not exists public.smart_timetable_entries (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  day text not null,
  start_time time without time zone not null,
  end_time time without time zone not null,
  subject_name text not null,
  subject_code text not null,
  type text not null check (type in ('theory', 'lab')),
  room_number text null,
  slot_code text null,
  slot_label text null,
  credit numeric null,
  created_at timestamp with time zone not null default now(),
  constraint smart_timetable_entries_pkey primary key (id)
);

-- Create profiles table
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
  credits numeric default 0,
  current_streak integer default 0,
  last_active_date date default CURRENT_DATE,
  notifications_enabled boolean default true,
  updated_at timestamp with time zone,
  constraint profiles_pkey primary key (id)
);

-- Create attendance_logs table
create table if not exists public.attendance_logs (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  subject_code text not null,
  status text not null check (status in ('present', 'absent')),
  created_at timestamp with time zone not null default now(),
  constraint attendance_logs_pkey primary key (id),
  constraint unique_attendance_per_day unique (user_id, date, subject_code)
);

-- Enable Row Level Security (RLS)
alter table public.timetable_entries enable row level security;
alter table public.smart_timetable_entries enable row level security;
alter table public.profiles enable row level security;
alter table public.attendance_logs enable row level security;

-- Policies for timetable_entries
create policy "Users can view their own timetable entries" on public.timetable_entries
  for select using (auth.uid() = user_id);

create policy "Users can insert their own timetable entries" on public.timetable_entries
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own timetable entries" on public.timetable_entries
  for update using (auth.uid() = user_id);

create policy "Users can delete their own timetable entries" on public.timetable_entries
  for delete using (auth.uid() = user_id);

-- Policies for smart_timetable_entries
create policy "Users can view their own smart timetable entries" on public.smart_timetable_entries
  for select using (auth.uid() = user_id);

create policy "Users can insert their own smart timetable entries" on public.smart_timetable_entries
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own smart timetable entries" on public.smart_timetable_entries
  for update using (auth.uid() = user_id);

create policy "Users can delete their own smart timetable entries" on public.smart_timetable_entries
  for delete using (auth.uid() = user_id);

-- Policies for profiles
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Policies for attendance_logs
create policy "Users can view their own attendance logs" on public.attendance_logs
  for select using (auth.uid() = user_id);

create policy "Users can insert their own attendance logs" on public.attendance_logs
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own attendance logs" on public.attendance_logs
  for update using (auth.uid() = user_id);

create policy "Users can delete their own attendance logs" on public.attendance_logs
  for delete using (auth.uid() = user_id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on new user creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
