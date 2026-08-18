import { LoginForm } from "@/components/login-form"
import Link from "next/link"
import Image from "next/image"

export default function PrijavaPage() {
  return (
    <main className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary/20 via-background to-background border-r border-primary/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(143,21,40,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(143,21,40,0.1),transparent_50%)]" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <Image src="/images/image.png" alt="Gard 018 Logo" width={64} height={64} className="invert" />
          </Link>

          <div className="space-y-6 max-w-md">
            <div className="space-y-2">
              <div className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full mb-4">
                <span className="text-sm font-medium text-primary uppercase tracking-wider">
                  Boks • Kik Boks • Muay Thai
                </span>
              </div>
              <h1 className="text-5xl font-bold text-foreground leading-tight">
                Oslobodite svoju <span className="text-primary">snagu</span>
              </h1>
              <p className="text-xl text-muted-foreground">Prijavite se i nastavite svoju borbu ka savršenstvu</p>
            </div>

            <div className="flex gap-8 pt-6">
              <div className="space-y-1">
                <div className="text-3xl font-bold text-primary">150+</div>
                <div className="text-sm text-muted-foreground">Aktivnih članova</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-primary">3</div>
                <div className="text-sm text-muted-foreground">Programa treninga</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-primary">2023</div>
                <div className="text-sm text-muted-foreground">Godina osnivanja</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <Link href="/" className="inline-flex lg:hidden items-center gap-3 mb-8">
              <Image src="/images/image.png" alt="Gard 018 Logo" width={48} height={48} className="invert" />
            </Link>
            <h1 className="text-4xl font-bold text-foreground mb-3">Dobrodošli nazad</h1>
            <p className="text-lg text-muted-foreground">Prijavite se na svoj nalog i nastavite treninge</p>
          </div>

          <LoginForm />

          <div className="text-center">
            <p className="text-muted-foreground">
              Nemate nalog?{" "}
              <Link href="/registracija" className="text-primary hover:underline font-semibold transition-colors">
                Registrujte se besplatno
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
