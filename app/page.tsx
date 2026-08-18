import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { About } from "@/components/about"
import { Programs } from "@/components/programs"
import { Schedule } from "@/components/schedule"
import { Gallery } from "@/components/gallery"
import { Contact } from "@/components/contact"
import { Footer } from "@/components/footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "GARD 018 | Boks Klub Niš | Kik Boks Treninzi | Najbolji Borilački Klub",
  description:
    "GARD 018 je vodeći boks i kik boks klub u Nišu. Nudimo profesionalne treninge boksa, kik boksa, muay thai-a za sve uzraste. Pridruži se danas!",
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsActivityLocation",
            name: "GARD 018 - Borilački Klub",
            alternateName: ["GARD018", "GARD 018 Boks Klub", "GARD 018 Kik Boks"],
            description:
              "Profesionalni boks i kik boks klub u Nišu. Treninzi boksa, kik boksa, muay thai-a za sve uzraste.",
            url: "https://gard018.com",
            telephone: "+381-XX-XXX-XXXX",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Niš",
              addressCountry: "RS",
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: "43.3209",
              longitude: "21.8958",
            },
            sameAs: ["https://www.instagram.com/gard018", "https://www.facebook.com/gard018"],
            sport: ["Boxing", "Kickboxing", "Muay Thai", "Martial Arts"],
            priceRange: "$$",
            image: "https://gard018.com/og-image.jpg",
          }),
        }}
      />
      <main className="min-h-screen bg-background">
        <Header />
        <Hero />
        <About />
        <Programs />
        <Schedule />
        <Gallery />
        <Contact />
        <Footer />
      </main>
    </>
  )
}
