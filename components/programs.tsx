"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Phone, MapPin, Mail } from "lucide-react"
import { useEffect, useState } from "react"
import Image from "next/image"

const programs = [
  {
    title: "BOKS",
    subtitle: "Klasični boks",
    description:
      "Naučite tehnike boksa od osnovnih stavova do naprednih kombinacija. Program uključuje rad na vrećama, sparinge i kondicionu pripremu.",
    image: "/images/boks.jpeg",
    features: ["Tehnika udaraca", "Odbrana", "Kondicija", "Sparing"],
  },
  {
    title: "KIK BOKS",
    subtitle: "K-1 stil",
    description:
      "Kombinacija boksa i tehnike nogu. Intenzivan trening koji razvija snagu, brzinu i koordinaciju celog tela.",
    image: "/images/kickboks.jpeg",
    features: ["Udarci nogama", "Kombinacije", "Klinč tehnika", "Takmičenja"],
  },
  {
    title: "MUAY THAI",
    subtitle: "Tajlandski boks",
    description:
      "Tradicionalna tajlandska borilačka veština poznata kao 'Veština osam ekstremiteta'. Koristi pesnice, laktove, kolena i noge.",
    image: "/images/muay-thai.jpeg",
    features: ["Klinč rad", "Udarci laktovima", "Udarci kolenima", "Takmičenja"],
  },
  {
    title: "PERSONALNI TRENING",
    subtitle: "1-na-1 trening",
    description:
      "Individualni trening prilagođen vašim ciljevima. Rad sa trenerom na tehnici, snazi, brzini i izdržljivosti.",
    image: "/images/personalni.jpeg",
    features: ["Individualni pristup", "Fleksibilan raspored", "Brži napredak", "Svi nivoi"],
  },
]

export function Programs() {
  const [user, setUser] = useState<{ email: string; name: string; avatar?: string } | null>(null)
  const [showContact, setShowContact] = useState(false)

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user)
        }
      })
      .catch(() => {})
  }, [])

  const handleLearnMore = (e: React.MouseEvent, programTitle: string) => {
    e.preventDefault()
    setShowContact(true)
  }

  return (
    <>
      <section id="programi" className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-primary uppercase tracking-[0.3em] text-sm mb-4 font-medium">Programi</p>
            <h2
              className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              IZABERI SVOJ PUT
            </h2>
            <div className="w-20 h-1 bg-primary mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto">
            {programs.map((program, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-sm border border-primary/10 bg-card shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="relative overflow-hidden h-[280px] md:h-[320px]">
                  <Image
                    src={program.image || "/placeholder.svg"}
                    alt={program.title}
                    fill
                    className="object-cover"
                    quality={95}
                    priority={index < 2}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>

                {/* Tekst kartica ispod slike */}
                <div className="p-6 md:p-8">
                  <p className="text-primary text-xs uppercase tracking-widest mb-2">{program.subtitle}</p>
                  <h3
                    className="text-2xl md:text-3xl font-bold text-foreground mb-3"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {program.title}
                  </h3>
                  <p className="text-muted-foreground text-base md:text-lg font-medium mb-4 leading-relaxed">
                    {program.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {program.features.map((feature, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-sm border border-primary/20"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  <Button
                    onClick={(e) => handleLearnMore(e, program.title)}
                    variant="ghost"
                    className="text-primary hover:text-primary hover:bg-primary/10 p-0 h-auto uppercase tracking-wider text-sm font-semibold"
                  >
                    Saznaj više <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {showContact && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowContact(false)}
        >
          <div
            className="bg-card border border-primary/20 rounded-sm p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-foreground mb-6" style={{ fontFamily: "var(--font-heading)" }}>
              KONTAKT INFORMACIJE
            </h3>
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Telefon</p>
                  <p className="text-foreground">069 010 5213</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-foreground">ognjen.boks19@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Adresa</p>
                  <p className="text-foreground">Svetozara Miletića 10, Niš 18000</p>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mb-6">
              Članarina se plaća direktno u klubu. Kontaktirajte nas za više informacija o cenovniku i rasporedu
              treninga.
            </p>
            <Button onClick={() => setShowContact(false)} className="w-full">
              Zatvori
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
