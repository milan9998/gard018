"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Phone, Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus("idle")
    setErrorMessage("")

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        setSubmitStatus("success")
        setFormData({ name: "", email: "", phone: "", message: "" })
      } else {
        const errorData = await response.json().catch(() => ({ error: "Nepoznata greška" }))
        setErrorMessage(errorData.error || "Server je vratio grešku. Pokušajte ponovo.")
        setSubmitStatus("error")
      }
    } catch (error) {
      console.error("[v0] Contact form error:", error)

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          setErrorMessage("Zahtev je istekao. Proverite internet konekciju i pokušajte ponovo.")
        } else if (error.message.includes("fetch")) {
          setErrorMessage("Nema internet konekcije. Proverite vašu mrežu.")
        } else {
          setErrorMessage("Došlo je do neočekivane greške. Molimo pokušajte ponovo.")
        }
      } else {
        setErrorMessage("Greška pri slanju poruke. Pokušajte ponovo kasnije.")
      }

      setSubmitStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="kontakt" className="py-24 relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-primary uppercase tracking-[0.3em] text-sm mb-4 font-medium">Kontakt</p>
          <h2
            className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            JAVI NAM SE
          </h2>
          <div className="w-20 h-1 bg-primary mx-auto mb-6" />
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Imaš pitanja? Kontaktiraj nas ili nas poseti u našoj sali
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-sm p-8 mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-6" style={{ fontFamily: "var(--font-heading)" }}>
                KONTAKT INFORMACIJE
              </h3>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-sm flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-foreground font-semibold mb-1">Adresa</p>
                    <p className="text-muted-foreground">
                      Светозара Милетића 10
                      <br />
                      18000 Ниш, Србија
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-sm flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-foreground font-semibold mb-1">Telefon</p>
                    <p className="text-muted-foreground">069 010 5213</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-sm flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-foreground font-semibold mb-1">Email</p>
                    <p className="text-muted-foreground">ognjen.boks19@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-sm overflow-hidden border border-primary/10 bg-background/50">
              <iframe
                src="https://maps.google.com/maps?q=GARD+018+Borilački+Klub,+Svetozara+Miletića+10,+Niš&t=&z=16&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="450"
                style={{ border: 0, borderRadius: 12, filter: "grayscale(20%) brightness(90%)" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="GARD 018 Borilački Klub lokacija"
              />
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-sm p-8">
            <h3 className="text-2xl font-bold text-foreground mb-6" style={{ fontFamily: "var(--font-heading)" }}>
              POŠALJI PORUKU
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="text-sm text-muted-foreground uppercase tracking-wider mb-2 block">
                  Ime i prezime
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-primary/5 border-primary/20 text-foreground"
                  placeholder="Unesite ime i prezime"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="text-sm text-muted-foreground uppercase tracking-wider mb-2 block">
                  Email adresa
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-primary/5 border-primary/20 text-foreground"
                  placeholder="vasa@email.com"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="text-sm text-muted-foreground uppercase tracking-wider mb-2 block">
                  Broj telefona
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-primary/5 border-primary/20 text-foreground"
                  placeholder="+381 63 123 4567"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="message" className="text-sm text-muted-foreground uppercase tracking-wider mb-2 block">
                  Poruka
                </label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="bg-primary/5 border-primary/20 text-foreground min-h-[150px]"
                  placeholder="Napišite vašu poruku..."
                  disabled={isSubmitting}
                  required
                />
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-wider disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Šalje se...
                  </span>
                ) : (
                  "Pošalji poruku"
                )}
              </Button>

              {submitStatus === "success" && (
                <Alert className="border-green-500/20 bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <AlertDescription className="text-green-500 font-medium">
                    Poruka je uspešno poslata! Odgovorićemo vam uskoro.
                  </AlertDescription>
                </Alert>
              )}

              {submitStatus === "error" && (
                <Alert className="border-red-500/20 bg-red-500/10">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <AlertDescription className="text-red-500 font-medium">
                    {errorMessage || "Greška prilikom slanja poruke. Pokušajte ponovo."}
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
