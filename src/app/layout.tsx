import "./globals.css";

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
        {/* Children je tvoj page.tsx, ki se izriše tukaj */}
        {children}
      </body>
    </html>
  );
}