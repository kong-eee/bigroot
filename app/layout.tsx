import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar"; // 🚀 공통 바 불러오기

export const metadata: Metadata = {
  title: "빅루트 (BIGROOT) - 세입자의 든든한 뿌리",
  description: "보증금과 권리를 단단하게 지켜드립니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {/* 🔔 모든 페이지 상단에 네비게이션 바 고정 연동 */}
        <Navbar />
        {children}
      </body>
    </html>
  );
}