import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Muse · 뷰티 모델 × 아티스트 매칭",
  description:
    "Muse는 뷰티 모델·고객과 뷰티 전문가를 잇는 양면형 매칭 마켓플레이스입니다.",
};

export const viewport: Viewport = {
  themeColor: "#D6296B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
