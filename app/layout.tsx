import type { Metadata } from "next";
import "primereact/resources/themes/lara-light-teal/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "./globals.css";
import { PrimeProvider } from "@/components/providers/prime-provider";

export const metadata: Metadata = {
  title: {
    default: "HomeNest",
    template: "HomeNest",
  },
  description: "HomeNest Property & Resident Management Admin Portal",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/images/homenest-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/images/homenest-icon.png" />
      </head>
      <body className="h-full w-full flex flex-col font-sans bg-[#edf5f1] text-gray-900 antialiased">
        <PrimeProvider>{children}</PrimeProvider>
      </body>
    </html>
  );
}
