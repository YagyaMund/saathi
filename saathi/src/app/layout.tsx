import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saathi",
  description:
    "Instagram catalogue and WhatsApp-style seller assistant for small Indian shops.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
