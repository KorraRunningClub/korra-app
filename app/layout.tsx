import type { Metadata, Viewport } from "next";
// Fontes hospedadas no próprio site (sem depender do Google Fonts)
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/barlow/400.css";
import "@fontsource/barlow/500.css";
import "@fontsource/barlow/600.css";
import "@fontsource/barlow-condensed/500.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://korrarunningclub.com.br"),
  title: "Korrá Running Club · Assessoria de corrida na Grande Florianópolis",
  description:
    "A rua antes do pódio. Assessoria de corrida de rua com planejamento individual, treinos presenciais na Pedra Branca (Palhoça) e Florianópolis, e acompanhamento online.",
  applicationName: "Korrá",
  appleWebApp: { capable: true, title: "Korrá", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  openGraph: {
    title: "Korrá Running Club",
    description: "A rua antes do pódio. Assessoria de corrida na Grande Florianópolis e online.",
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#E9E8D6",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
