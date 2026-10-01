import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Neon E-Book Store | Course Database Project',
  description: 'Full-stack E-Book Store System powered by Neon Serverless PostgreSQL and Next.js App Router',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body
        className="bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased"
        suppressHydrationWarning
      >
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4">
            <p>Database Mini-Project: E-Book Store System with Direct Neon SQL Queries & 5D Analytics</p>
            <p className="mt-1 text-slate-400">Next.js 15 App Router • PostgreSQL 16 on Neon Serverless • Zero-Dependency Local Assets</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
