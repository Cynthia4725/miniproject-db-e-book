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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&family=Sarabun:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-900"
        suppressHydrationWarning
      >
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {children}
        </main>
        <footer className="bg-white border-t border-slate-200/80 py-8 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <p className="font-semibold text-slate-700">
                Database Mini-Project: E-Book Store System with Direct Neon SQL Queries &amp; 5D Analytics
              </p>
            </div>
            <p className="text-slate-400 font-mono text-[11px]">
              Next.js 15 App Router • PostgreSQL 16 on Neon Serverless (Singapore) • Strict 3NF/BCNF Schema
            </p>
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 pt-2 border-t border-slate-100 max-w-md mx-auto" suppressHydrationWarning>
              <a
                href="/docs/db-architecture.html"
                target="_blank"
                suppressHydrationWarning
                className="hover:text-emerald-600 transition-colors"
              >
                ผังฐานข้อมูล (Schema Docs) ↗
              </a>
              <span>•</span>
              <a
                href="/admin/orders"
                suppressHydrationWarning
                className="hover:text-emerald-600 transition-colors"
              >
                ระบบจัดการผู้ดูแลระบบ (Admin)
              </a>
              <span>•</span>
              <a
                href="/library"
                suppressHydrationWarning
                className="hover:text-emerald-600 transition-colors"
              >
                คลังหนังสือของฉัน (Library)
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
