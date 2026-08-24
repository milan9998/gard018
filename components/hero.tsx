import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Phone, Play } from "lucide-react"

export function Hero() {
  return (
    <section id="pocetna" className="hero-section relative isolate flex min-h-[720px] items-center overflow-hidden pt-20 sm:min-h-screen lg:pt-24">
      <div className="hero-image hero-image-desktop" aria-hidden="true" />
      <div className="hero-image hero-image-mobile" aria-hidden="true" />
      <div className="hero-vignette" aria-hidden="true" />
      <div className="hero-light hero-light-one" aria-hidden="true" />
      <div className="hero-light hero-light-two" aria-hidden="true" />

      <div className="hero-content relative z-10 container mx-auto w-full px-5 sm:px-8 lg:px-12">
        <div className="max-w-3xl text-center lg:max-w-2xl lg:text-left">
          <div className="hero-copy">
            <div className="hero-upper">
              <div className="hero-reveal hero-reveal-delay-1 mb-6 inline-flex items-center gap-3 rounded-full border border-white/15 bg-black/25 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80 backdrop-blur-md sm:text-xs">
                <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_14px_rgba(211,55,86,0.95)]" />
                Boks · Kik boks · Muay Thai
              </div>

              <h1
                className="hero-reveal hero-reveal-delay-2 text-[clamp(3.8rem,16vw,7.7rem)] font-bold leading-[0.82] tracking-[-0.055em] text-white drop-shadow-[0_12px_35px_rgba(0,0,0,0.45)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                GARD
                <span className="text-primary"> 018</span>
              </h1>
            </div>

            <div className="hero-lower">
              <div className="hero-reveal hero-reveal-delay-3 mt-7 max-w-xl lg:mt-8">
                <p className="text-xl font-semibold leading-tight text-white sm:text-2xl lg:text-3xl">
                  Snaga se ne čeka.
                  <span className="block text-white/60">Snaga se gradi.</span>
                </p>
                <p className="mt-4 max-w-lg text-base leading-relaxed text-white/65 sm:text-lg">
                  Profesionalni treninzi za sve uzraste i nivoe, uz ekipu koja te gura napred u svakom treningu.
                </p>
              </div>

              <div className="hero-actions hero-reveal hero-reveal-delay-4 mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:mt-10">
              <Button
                size="lg"
                asChild
                className="h-14 rounded-full bg-primary px-7 text-sm font-bold uppercase tracking-[0.12em] text-primary-foreground shadow-[0_14px_35px_rgba(211,55,86,0.3)] transition-all duration-300 hover:-translate-y-1 hover:bg-primary/90 hover:shadow-[0_18px_45px_rgba(211,55,86,0.42)]"
              >
                <a href="tel:+381690105213">
                  Zakaži trening danas
                  <Phone className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-14 rounded-full border-white/20 bg-white/[0.04] px-7 text-sm font-bold uppercase tracking-[0.12em] text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/40 hover:bg-white/10 hover:text-white"
              >
                <Link href="#programi">
                  <Play className="mr-2 h-4 w-4 fill-current" />
                  Istraži programe
                </Link>
              </Button>
              </div>

              <div className="hero-stats hero-reveal hero-reveal-delay-5 mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 border-t border-white/10 pt-5 text-left lg:justify-start">
                <div>
                  <p className="text-2xl font-bold text-white sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>70+</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">Aktivnih članova</p>
                </div>
                <div className="hidden h-8 w-px bg-white/15 sm:block" />
                <div>
                  <p className="text-2xl font-bold text-white sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>3</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">Borilačka programa</p>
                </div>
                <div className="hidden h-8 w-px bg-white/15 sm:block" />
                <div>
                  <p className="text-2xl font-bold text-white sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>Niš</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">Svetozara Miletića 10</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  )
}
