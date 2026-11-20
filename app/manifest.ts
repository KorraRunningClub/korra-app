import type { MetadataRoute } from "next";

// Permite instalar o site na tela de início do celular, como um app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Korrá Running Club",
    short_name: "Korrá",
    description: "A rua antes do pódio. Área do aluno, ranking e desafios da Korrá Running Club.",
    lang: "pt-BR",
    start_url: "/inicio",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#E9E8D6",
    theme_color: "#384237",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
