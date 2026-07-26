import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import "./modernist.css";
import { AuthProvider } from "@/context/AuthContext";
import AppLayout from "@/components/AppLayout";
import { THEME_INIT_SCRIPT } from "@/lib/useTheme";

// Archivo drives the whole design system. Only the three weights actually used
// are requested, so this stays one small file rather than the full family.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Balance",
  description: "Organize your life with Balance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The font variable lives on <html> so tokens defined in :root can reference
  // it. On <body> it would be invalid at :root scope, which silently blanks
  // any token built from it.
  return (
    <html lang="en" className={archivo.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
