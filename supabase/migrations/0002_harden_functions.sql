-- Trigger functions should not be callable through the REST API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.issue_reward() from public, anon, authenticated;
-- is_staff() is used by RLS policies for signed-in users only.
revoke execute on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;
alter function public.protect_staff_flag() set search_path = public;
