import type { Metadata, Viewport } from 'next';
import { Karla } from 'next/font/google';
import './globals.css';

const karla = Karla({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-karla',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Charity Coffee',
  description: 'Collect stamps. Get a free coffee.',
  icons: { apple: '/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Charity Coffee', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#EFEEE9',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={karla.variable}>
      <body>{children}</body>
    </html>
  );
}
