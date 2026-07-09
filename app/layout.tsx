import type {Metadata} from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'SIKLIN-RS - Sistem Informasi Indikator Kesehatan Lingkungan Rumah Sakit',
  description: 'Aplikasi untuk memantau, menganalisis, dan melaporkan capaian indikator kesehatan lingkungan rumah sakit.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-[#F3F4F6] text-gray-800 antialiased font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
