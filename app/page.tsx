import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { About } from "@/components/about"
import { Programs } from "@/components/programs"
import { Schedule } from "@/components/schedule"
import { Gallery } from "@/components/gallery"
import { Contact } from "@/components/contact"
import { NewsPreview } from "@/components/news-preview"
import { Footer } from "@/components/footer"
import { HeroIntro } from "@/components/hero-intro"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "GARD 018 Niš | Boks, Kik Boks i Muay Thai treninzi",
  description:
    "Pridruži se GARD 018 klubu u Nišu. Boks, kik boks, Muay Thai, grupni i individualni treninzi za početnike i iskusne vežbače.",
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
            telephone: "+381690105213",
            address: {
              "@type": "PostalAddress",
              streetAddress: "Svetozara Miletića 10",
              addressLocality: "Niš",
              postalCode: "18000",
              addressCountry: "RS",
            },
            areaServed: {
              "@type": "City",
              name: "Niš",
            },
            contactPoint: {
              "@type": "ContactPoint",
              telephone: "+381690105213",
              contactType: "customer service",
              areaServed: "RS",
              availableLanguage: ["sr-Latn"],
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: "43.3209",
              longitude: "21.8958",
            },
            sameAs: ["https://www.instagram.com/borilacki.klub.gard.018/", "https://www.facebook.com/gard018"],
            sport: ["Boxing", "Kickboxing", "Muay Thai", "Martial Arts"],
            priceRange: "$$",
            image: "https://gard018.com/og-image.jpg",
          }),
        }}
      />
      <HeroIntro />
      <main className="min-h-screen bg-background">
        <Header />
        <Hero />
        <NewsPreview />
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
