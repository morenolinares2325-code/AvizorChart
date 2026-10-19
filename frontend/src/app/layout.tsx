import type { Metadata } from "next";
import localFont from "next/font/local";
import { Navbar } from "@/components/layout/Navbar";
import { SupportWidget } from "@/components/layout/SupportWidget";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-zinc-950 font-sans text-zinc-100 antialiased`}
      >
        <Navbar />
        <main className="pt-14">{children}</main>
        <SupportWidget />
      </body>
    </html>
  );
}
