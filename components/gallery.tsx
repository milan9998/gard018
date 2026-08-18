"use client"

import { useState } from "react"
import { X } from "lucide-react"

const images = [
  {
    src: "/images/img-6435-ezgif.jpeg",
    alt: "Personalni trening",
  },
  {
    src: "/images/img-6497-ezgif.jpeg",
    alt: "Trening omladine",
  },
  {
    src: "/images/za-20galeriju-20-2810-29.jpeg",
    alt: "Merenje pred meč",
  },
  {
    src: "/images/za-20galeriju-20-285-29.jpeg",
    alt: "Pobeda sa srpskom zastavom",
  },
  {
    src: "https://lh3.googleusercontent.com/p/AF1QipPuVMRkf6qtFz2mM-rn4MJFxT6SH5_MPlOSIEfm=w1600-h1000-k-no",
    alt: "Grupni trening",
  },
  {
    src: "/images/za-20galeriju-20-283-29.jpeg",
    alt: "Pobeda na ringu",
  },
  {
    src: "/images/za-20galeriju-20-286-29.jpeg",
    alt: "Svetsko prvenstvo",
  },
  {
    src: "/images/za-20galeriju-20-287-29.jpeg",
    alt: "WAKO šampionat",
  },
  {
    src: "/images/za-20galeriju.jpeg",
    alt: "Osvojena titula",
  },
]

export function Gallery() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  return (
    <section id="galerija" className="py-24 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-primary uppercase tracking-[0.3em] text-sm mb-4 font-medium">Galerija</p>
          <h2
            className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            IZ NAŠEG KLUBA
          </h2>
          <div className="w-20 h-1 bg-primary mx-auto" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(image.src)}
              className="relative aspect-[4/3] overflow-hidden rounded-sm group cursor-pointer"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ backgroundImage: `url('${image.src}')` }}
              />
            </button>
          ))}
        </div>
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-foreground hover:text-primary transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={selectedImage || "/placeholder.svg"}
            alt="Uvećana slika"
            className="max-w-full max-h-[90vh] object-contain rounded-sm"
          />
        </div>
      )}
    </section>
  )
}
