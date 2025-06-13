import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Budget Drop - Retro Terminal Finance",
  description: "A retro CRT-style budget management app with drag-and-drop chips",
  keywords: ["budget", "finance", "terminal", "retro", "CRT"],
  authors: [{ name: "Budget Drop" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
