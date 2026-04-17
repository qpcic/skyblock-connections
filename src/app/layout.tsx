import "./globals.css";

export const metadata = {
  title: "Skyblock Connections",
  description: "Hypixel Skyblock themed puzzle",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Children je tvoj page.tsx, ki se izriše tukaj */}
        {children}
      </body>
    </html>
  );
}