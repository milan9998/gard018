import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GARD 018 - Boks Klub Niš",
    short_name: "GARD 018",
    description: "Zvanična aplikacija GARD 018 boks i kik-boks kluba.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#050505",
    theme_color: "#cf3654",
    lang: "sr-RS",
    icons: [
      {
        src: "/icon.jpg",
        sizes: "1024x1024",
        type: "image/jpeg",
        purpose: "maskable",
      },
    ],
  };
}
