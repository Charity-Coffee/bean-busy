-- Buy nine, get the tenth free: a reward is earned every 9 approved stamps.
alter table public.stamp_requests
  drop constraint stamp_requests_quantity_check,
  add constraint stamp_requests_quantity_check check (quantity between 1 and 9);

create or replace function public.issue_reward() returns trigger
language plpgsql security definer set search_path = public as $$
declare total_after int;
declare earned int;
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    select coalesce(sum(quantity), 0) into total_after from public.stamp_requests
      where user_id = new.user_id and status = 'approved';
    earned := (total_after / 9) - ((total_after - new.quantity) / 9);
    for i in 1..earned loop
      insert into public.rewards (user_id) values (new.user_id);
    end loop;
  end if;
  return new;
end $$;
