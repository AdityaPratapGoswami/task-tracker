import type { Metadata, Viewport } from "next";
import { Inter, Archivo } from "next/font/google";
import "./globals.css";
import "./modernist.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

// Archivo drives the Modernist desktop design. Only the three weights the
// system actually uses are requested, so this adds one small file rather
// than the full family.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Balance",
  description: "Organize your life with Balance",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

import { AuthProvider } from "@/context/AuthContext";
import StatusBarManager from "@/components/StatusBarManager";
import AppLayout from "@/components/AppLayout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Font variables live on <html> so that tokens defined in :root can
  // reference them. On <body> they would be invalid at :root scope, which
  // silently blanks any token built from them.
  return (
    <html lang="en" className={`${inter.variable} ${archivo.variable}`}>
      <body suppressHydrationWarning>
        <AuthProvider>
          <AppLayout>
            {children}
            <StatusBarManager />
          </AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}