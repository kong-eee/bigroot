import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import Navbar from './components/NavbarClassic';
import PageInteractionRecovery from './components/PageInteractionRecovery';

const noto = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-noto',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '빅루트 (BIGROOT) - 세입자의 든든한 뿌리',
  description:
    '세입자의 든든한 뿌리, 든든한 길. — 보증금과 권리를 함께 지킵니다.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" data-theme="classic" suppressHydrationWarning>
      <body className={`${noto.variable} antialiased`}>
        <PageInteractionRecovery />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
