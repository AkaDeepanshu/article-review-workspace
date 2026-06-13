import "easySLR/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { Providers } from "easySLR/components/providers";

export const metadata: Metadata = {
  title: "ArticleDesk",
  description:
    "A collaborative workspace for researchers to import, organize, and screen research articles.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
