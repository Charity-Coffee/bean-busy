import Image from 'next/image';
import LoginForm from './LoginForm';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="page page--center">
      <Image className="logo-full" src="/logo-full.png" alt="Charity Coffee" width={900} height={588} priority />
      <div className="stack">
        <h1>Collect stamps. Get a free coffee.</h1>
        <p className="muted">
          Ten stamps and your next coffee is on us. Sign in with your email and we&apos;ll send you a link.
        </p>
      </div>
      <LoginForm initialError={Boolean(error)} />
    </main>
  );
}
