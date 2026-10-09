# Bean Busy: Charity Coffee loyalty

Installable web app (PWA). Customers collect stamps toward a free coffee; staff approve requests at the counter.

## Setup
1. Create a Supabase project and run `supabase/migrations/0001_init.sql` in the SQL editor.
2. In Supabase Auth settings, set the Site URL to your deployed URL and add `<url>/auth/callback` to Redirect URLs.
3. Copy `.env.example` to `.env.local` and fill in the project URL and anon key.
4. `npm install && npm run dev`
5. Make the first staff member: `update public.profiles set is_staff = true where email = 'you@example.com';`
