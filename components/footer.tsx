import Link from "next/link"
import { Instagram, Facebook, Youtube, Phone, Mail, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-primary rounded-sm flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">G</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight text-foreground">GARD 018</span>
                <span className="text-[10px] text-muted-foreground tracking-widest uppercase">Niš, Srbija</span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Borilački klub Gard 018 - Vaš put do fizičke i mentalne snage počinje ovde.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 bg-secondary hover:bg-primary rounded-sm flex items-center justify-center transition-colors"
              >
                <Instagram className="w-5 h-5 text-foreground" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-secondary hover:bg-primary rounded-sm flex items-center justify-center transition-colors"
              >
                <Facebook className="w-5 h-5 text-foreground" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-secondary hover:bg-primary rounded-sm flex items-center justify-center transition-colors"
              >
                <Youtube className="w-5 h-5 text-foreground" />
              </a>
            </div>
          </div>

          <div>
            <h4
              className="text-foreground font-bold uppercase tracking-wider mb-6"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Brzi linkovi
            </h4>
            <nav className="flex flex-col gap-3">
              <Link href="#o-nama" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                O nama
              </Link>

              <Link href="#raspored" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Raspored
              </Link>
              <Link href="#galerija" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Galerija
              </Link>
              <Link href="#kontakt" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Kontakt
              </Link>
            </nav>
          </div>

          <div>
            <h4
              className="text-foreground font-bold uppercase tracking-wider mb-6"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Legal
            </h4>
            <nav className="flex flex-col gap-3">
              <Link href="#programi" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Boks
              </Link>
              <Link href="#programi" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Kik Boks
              </Link>
              <Link href="#programi" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Muay Thai
              </Link>
              <Link href="#programi" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                Personalni trening
              </Link>
            </nav>
          </div>

          <div>
            <h4
              className="text-foreground font-bold uppercase tracking-wider mb-6"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Kontakt
            </h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <span className="text-muted-foreground text-sm">Светозара Милетића 10, Ниш</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <span className="text-muted-foreground text-sm">069 010 5213</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <span className="text-muted-foreground text-sm">ognjen.boks19@gmail.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">© {new Date().getFullYear()} Gard 018. Sva prava zadržana.</p>
          <div className="flex gap-6">
            <Link
              href="/politika-privatnosti"
              className="text-muted-foreground hover:text-primary transition-colors text-sm"
            >
              Politika privatnosti
            </Link>
            <Link
              href="/uslovi-koriscenja"
              className="text-muted-foreground hover:text-primary transition-colors text-sm"
            >
              Uslovi korišćenja
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
