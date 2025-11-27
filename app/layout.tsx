import type { Metadata } from "next";
import "./globals.css"; // <--- ESTA ES LA LÍNEA MÁGICA QUE FALTABA

export const metadata: Metadata = {
  title: "Pagos Familiares",
  description: "Control de gastos Spotify y YouTube",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased bg-gray-100">
        {children}
      </body>
    </html>
  );
}