import type { Metadata } from "next";
import "./globals.css";  // <--- ¡ESTA ES VITAL!

export const metadata: Metadata = {
  title: "Pagos Familiares",
  description: "Control de gastos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}