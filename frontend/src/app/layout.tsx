import type { Metadata } from "next";
import localFont from "next/font/local";
import { ChromeFrame } from "@/components/layout/ChromeFrame";
import { LiveTvShell } from "@/components/news/LiveTvShell";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "AvizorChart.dev — Terminal cuantitativo",
  description:
    "Plataforma SaaS de trading con detección técnica anticipada, screeners cuantitativos, Mesa de Agentes IA y ejecución multinivel.",
  icons: {
    icon: "/brand/avizor-mark.png?v=3",
    apple: "/brand/avizor-mark.png?v=3",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[#050508] font-sans text-white antialiased`}
      >
        <LiveTvShell>
          <ChromeFrame>{children}</ChromeFrame>
        </LiveTvShell>
      </body>
    </html>
  );
}
