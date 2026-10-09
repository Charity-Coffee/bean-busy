import { signOut } from '@/app/actions';

export default function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOut}>
      <button type="submit" className={className} style={{ background: 'none', border: 0, padding: 0, font: 'inherit', cursor: 'pointer', color: 'inherit', textDecoration: 'underline' }}>
        Sign out
      </button>
    </form>
  );
}
