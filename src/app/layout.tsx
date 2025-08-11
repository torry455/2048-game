import "./globals.css";

export const metadata = {
  title: "2048 Game",
  description: "Simple 2048 game with Next.js and Tailwind",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
