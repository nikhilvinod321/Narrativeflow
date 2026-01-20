import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
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
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-text-primary min-h-screen`}>
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: 'bg-surface border border-surface-border text-text-primary',
              duration: 4000,
              style: {
                background: '#16161f',
                color: '#f8fafc',
                border: '1px solid #2a2a3a',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
