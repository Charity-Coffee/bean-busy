-- Audit trail for staff decisions: who approved/rejected a request and who redeemed a reward.
-- Existing rows keep null (decided before this was recorded).
alter table public.stamp_requests
  add column decided_by uuid references public.profiles (id) on delete set null;
alter table public.rewards
  add column redeemed_by uuid references public.profiles (id) on delete set null;

create index stamp_requests_decided on public.stamp_requests (decided_at desc) where status <> 'pending';
create index rewards_redeemed on public.rewards (redeemed_at desc) where redeemed_at is not null;
