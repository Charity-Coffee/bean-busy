-- Charity Coffee loyalty: schema, RLS, realtime.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text not null default '',
  is_staff boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.stamp_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create unique index stamp_requests_one_pending on public.stamp_requests (user_id) where status = 'pending';
create index stamp_requests_user_created on public.stamp_requests (user_id, created_at desc);

create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  issued_at timestamptz not null default now(),
  redeemed_at timestamptz
);
create index rewards_user on public.rewards (user_id);

-- Profile on sign-up (name comes from magic-link metadata).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''), coalesce(new.email, ''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Every 10th approved stamp issues a free coffee.
create function public.issue_reward() returns trigger
language plpgsql security definer set search_path = public as $$
declare approved_count int;
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    select count(*) into approved_count from public.stamp_requests
      where user_id = new.user_id and status = 'approved';
    if approved_count % 10 = 0 then
      insert into public.rewards (user_id) values (new.user_id);
    end if;
  end if;
  return new;
end $$;
create trigger stamp_request_decided after update on public.stamp_requests
  for each row execute function public.issue_reward();

create function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_staff from public.profiles where id = auth.uid()), false)
$$;

-- Stop users promoting themselves.
create function public.protect_staff_flag() returns trigger
language plpgsql as $$
begin
  if new.is_staff is distinct from old.is_staff and auth.uid() is not null then
    new.is_staff := old.is_staff;
  end if;
  return new;
end $$;
create trigger profiles_protect_staff before update on public.profiles
  for each row execute function public.protect_staff_flag();

alter table public.profiles enable row level security;
alter table public.stamp_requests enable row level security;
alter table public.rewards enable row level security;

create policy "own or staff profile" on public.profiles for select
  using (id = auth.uid() or public.is_staff());
create policy "own profile update" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

create policy "own or staff requests" on public.stamp_requests for select
  using (user_id = auth.uid() or public.is_staff());
create policy "request own pending" on public.stamp_requests for insert
  with check (user_id = auth.uid() and status = 'pending');
create policy "staff decide" on public.stamp_requests for update
  using (public.is_staff()) with check (public.is_staff());

create policy "own or staff rewards" on public.rewards for select
  using (user_id = auth.uid() or public.is_staff());
create policy "staff redeem" on public.rewards for update
  using (public.is_staff()) with check (public.is_staff());

alter publication supabase_realtime add table public.stamp_requests, public.rewards;

-- First staff member: update public.profiles set is_staff = true where email = 'you@example.com';
-- (run in the SQL editor; the trigger above only blocks changes made through the API)
