import { RegisterForm } from "@/components/register-form"
import Link from "next/link"

export default function RegistracijaPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-primary rounded-sm flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">G</span>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-xl tracking-tight text-foreground">GARD 018</span>
              <span className="text-xs text-muted-foreground tracking-widest uppercase">Niš, Srbija</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Pridruži se klubu</h1>
          <p className="text-muted-foreground">Napravi nalog i započni svoj put</p>
        </div>

        <RegisterForm />

        <p className="text-center text-muted-foreground mt-6">
          Već imate nalog?{" "}
          <Link href="/prijava" className="text-primary hover:underline font-medium">
            Prijavite se
          </Link>
        </p>
      </div>
    </main>
  )
}
