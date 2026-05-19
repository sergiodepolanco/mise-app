import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MISE — Todo en su lugar",
  description: "Gestión integral para hostelería",
  manifest: "/manifest.json",
  themeColor: "#0F172A",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
