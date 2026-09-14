import type { Metadata } from "next";
import { Syne, Outfit } from "next/font/google";
import "./globals.css";

const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Shadow AI — Call your forever buddy",
  description:
    "A video-call AI companion who sees your screen and guides you click-by-click. Meet Mira.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} h-full`}>
      <body className="min-h-dvh bg-[var(--bg)] font-sans text-white antialiased">{children}</body>
    </html>
  );
}
