import "./globals.css";
import {Analytics} from "@vercel/analytics/next";

export const metadata = {
  title: "Skyblock Connections",
  description: "Skyblock variant of the New York Times' Connections game",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      <Analytics/>
      </body>
    </html>
  );
}