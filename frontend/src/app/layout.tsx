import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NarrativeFlow - AI Story Co-Writing Platform',
  description: 'Create compelling stories with an AI co-author. Multi-chapter novels, screenplays, and episodic fiction with long-term memory and consistency.',
  keywords: ['AI writing', 'story writing', 'novel writing', 'creative writing', 'co-author'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-text-primary min-h-screen`}>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
        >{`(function(){try{var key='nf-theme';var stored=localStorage.getItem(key);var theme=(stored==='light'||stored==='dark')?stored:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');var root=document.documentElement;root.classList.add(theme);root.setAttribute('data-theme',theme);}catch(e){}})();`}</Script>
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: 'bg-surface border border-surface-border text-text-primary',
              duration: 4000,
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
