import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function Hero() {
  return (
    <section id="pocetna" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/boxing-ring-dark-dramatic-lighting-smoke.jpg')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />

      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-primary uppercase tracking-[0.3em] text-sm md:text-base mb-4 font-medium">
            Boks • Kik Boks • Muay Thai
          </p>

          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-foreground mb-6 tracking-tight leading-none"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            GARD
            <span className="text-primary"> 018</span>
          </h1>

          <p className="text-lg md:text-xl text-foreground/80 mb-8 max-w-2xl mx-auto leading-relaxed">
            Postani deo porodice šampiona. Profesionalni treninzi za sve uzraste i nivoe u srcu Niša.
          </p>

          <div className="flex items-center justify-center">
            <Button
              size="lg"
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-wider text-sm px-8 py-6"
            >
              <Link href="/registracija">
                Započni trening
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-8 max-w-md mx-auto">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary" style={{ fontFamily: "var(--font-heading)" }}>
                50+
              </p>
              <p className="text-sm text-muted-foreground uppercase tracking-wider mt-1">Aktivnih članova</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary" style={{ fontFamily: "var(--font-heading)" }}>
                50+
              </p>
              <p className="text-sm text-muted-foreground uppercase tracking-wider mt-1">Osvojenih medalja</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-foreground/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-primary rounded-full" />
        </div>
      </div>
    </section>
  )
}
