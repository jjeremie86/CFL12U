import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CFL12U Sideline",
  description: "Team management for the CFL12U coaching staff.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="chalk-texture min-h-screen">{children}</body>
    </html>
  );
}
