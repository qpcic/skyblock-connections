import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Skyblock Connections",
    description: "Skyblock variant of New York Times Connections",
    openGraph: {
        title: "Skyblock Connections",
        description: "Daily word-association puzzle game.",
        url: "https://skyblock-connections.vercel.app", // Replace with your actual domain
        siteName: "Skyblock Connections",
        images: [
            {
                url: "https://raw.githubusercontent.com/qpcic/skyblock-connections/main/public/icon.png",
                width: 512,
                height: 512,
                alt: "Skyblock Connections Icon",
            },
        ],
        locale: "en_US",
        type: "website",
    },
    // Twitter / X configuration
    twitter: {
        card: "summary",
        title: "Skyblock Connections",
        description: "Daily Skyblock puzzle game.",
        images: ["https://raw.githubusercontent.com/qpcic/skyblock-connections/main/public/icon.png"],
    },
    // Favicon link for browser tabs
    icons: {
        icon: "/favicon.ico",
    },
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body className="antialiased">
        {children}
        <Analytics />
        </body>
        </html>
    );
}