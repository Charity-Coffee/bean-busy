import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/`);
    console.error('auth callback: exchangeCodeForSession failed:', error.code ?? error.name, error.message);
    // Most often this is a link opened in a different browser/app than the one
    // that requested it, so the PKCE code verifier cookie isn't there to match it.
    return NextResponse.redirect(`${origin}/login?error=link_mismatch`);
  }
  return NextResponse.redirect(`${origin}/login?error=missing_code`);
}
