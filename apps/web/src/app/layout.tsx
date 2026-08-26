import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/providers/Providers';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: 'Atelier Shop',
  description: 'A Next.js storefront + admin over the NestJS API',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          <main className="container page">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
