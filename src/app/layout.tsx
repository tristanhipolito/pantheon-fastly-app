import type { Metadata } from "next";
import { Providers } from "../app/providers"; // Adjusted path
import "./globals.css";

export const metadata: Metadata = {
  title: "Fastly IP Management",
  description: "Bulk IP management for Fastly services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-gray-50">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}