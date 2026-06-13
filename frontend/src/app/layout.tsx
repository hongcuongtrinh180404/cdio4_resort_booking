import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import ChatWidget from "@/components/chat/ChatWidget";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "DTUVIVU Resort & Spa - Kỳ nghỉ trong mơ bắt đầu từ đây",
  description:
    "Trải nghiệm nghỉ dưỡng cao cấp với phòng sang trọng, dịch vụ trọn gói và khung cảnh thiên nhiên tuyệt đẹp tại DTUVIVU.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${inter.variable} ${poppins.variable} bg-background text-on-surface font-body-md antialiased`}
        suppressHydrationWarning
      >
        <Navbar />
        <main className="pt-[88px]">{children}</main>
        <Footer />
        <ChatWidget />
      </body>
    </html>
  );
}
