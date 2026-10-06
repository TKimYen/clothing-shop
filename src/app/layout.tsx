import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SiteChrome from "../components/SiteChrome";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BlueWear - Style for everyone",
  description:
    "Thời trang unisex - đơn giản, thoải mái, phù hợp với mọi cá tính.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${inter.className} min-h-screen flex flex-col text-[#164F8D] bg-white`}
      >
        <ClerkProvider>
          <SiteChrome header={<Header />} footer={<Footer />}>
            {children}
          </SiteChrome>
        </ClerkProvider>
      </body>
    </html>
  );
}
