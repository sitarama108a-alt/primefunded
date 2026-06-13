import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { ProgressBar } from '@/components/ProgressBar';
import { PerformanceTracker } from '@/components/PerformanceTracker';

export const metadata: Metadata = {
  title: 'PrimeFunded | Institutional Trading Challenges',
  description: 'Scale your trading career with PrimeFunded institutional funding. No consistency rules, daily payouts, and up to $200,000 in capital.',
  keywords: ['prop firm', 'funded account', 'trading challenge', 'forex funding', 'institutional capital'],
  authors: [{ name: 'PrimeFunded Global' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://primefunded.com',
    siteName: 'PrimeFunded',
    title: 'PrimeFunded | Trade with Institutional Capital',
    description: 'Get funded up to $200,000. Keep 80% of your profits. Start your challenge today.',
    images: [
      {
        url: 'https://picsum.photos/seed/primefunded/1200/630',
        width: 1200,
        height: 630,
        alt: 'PrimeFunded Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PrimeFunded | Institutional Trading Challenges',
    description: 'The world\'s most transparent prop firm. No hidden rules.',
    images: ['https://picsum.photos/seed/primefunded/1200/630'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="theme-color" content="#020817" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=Source+Code+Pro:wght@400;600&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <FirebaseClientProvider>
          <PerformanceTracker />
          <ProgressBar />
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
