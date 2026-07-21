import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aegis — Protocol Flight Recorder",
  description:
    "An independent, evidence-first verifier for observing protocol state, testing transaction intent, and replaying failure scenarios.",
  applicationName: "Aegis Protocol Flight Recorder",
  openGraph: {
    title: "Aegis — Protocol Flight Recorder",
    description: "Observe state. Test intent. Reconstruct impact.",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Aegis Protocol Flight Recorder" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aegis — Protocol Flight Recorder",
    description: "Observe state. Test intent. Reconstruct impact.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#151a18",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
