-- A request can cover several coffees bought together (1 to 5).
alter table public.stamp_requests
  add column quantity int not null default 1 check (quantity between 1 and 5);

-- Issue one free coffee for every multiple of 10 stamps the approved request crosses.
create or replace function public.issue_reward() returns trigger
language plpgsql security definer set search_path = public as $$
declare total_after int;
declare earned int;
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    select coalesce(sum(quantity), 0) into total_after from public.stamp_requests
      where user_id = new.user_id and status = 'approved';
    earned := (total_after / 10) - ((total_after - new.quantity) / 10);
    for i in 1..earned loop
      insert into public.rewards (user_id) values (new.user_id);
    end loop;
  end if;
  return new;
end $$;
