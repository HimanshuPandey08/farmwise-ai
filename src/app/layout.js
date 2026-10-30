import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { DEFAULT_LANGUAGE, COOKIE_NAME, isValidLocale } from "@/i18n/config";
import { LanguageProvider } from "@/context/LanguageContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "FarmWise AI — Agricultural Decision Support & Disease Intelligence",
  description: "AI-powered crop disease diagnosis, scientific agricultural guidance, and community early-warning surveillance.",
};

export const instant = false;

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const cookieVal = cookieStore.get(COOKIE_NAME)?.value;
  const initialLanguage = isValidLocale(cookieVal) ? cookieVal : DEFAULT_LANGUAGE;

  return (
    <html
      lang={initialLanguage}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider initialLanguage={initialLanguage}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
