import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HyperFrames Studio — AI Video Composition",
  description:
    "Describe a video in natural language and watch it come to life. Powered by HyperFrames and AI.",
  keywords: ["hyperframes", "video", "AI", "motion graphics", "GSAP", "HTML video"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased h-screen overflow-hidden">{children}</body>
    </html>
  );
}
