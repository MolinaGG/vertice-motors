import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vértice Motors | Seminovos. Novas histórias.",
  description: "Explore seminovos, compare seus favoritos e encontre seu próximo caminho. Projeto demonstrativo Vértice Motors.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body >{children}</body>
    </html>
  );
}
