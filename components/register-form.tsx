"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, UserPlus, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

export function RegisterForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showUserExists, setShowUserExists] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [isResetting, setIsResetting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!acceptedTerms) {
      toast({
        title: "Uslovi korišćenja",
        description: "Morate prihvatiti uslove korišćenja",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    setIsLoading(true)
    setShowUserExists(false)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const responseData = await registerResponse.json().catch(() => ({}))

      if (!registerResponse.ok) {
        if (responseData.error?.includes("već postoji")) {
          setResetEmail(formData.email)
          setShowUserExists(true)
        } else {
          toast({
            title: "Greška",
            description: responseData.error || "Greška pri registraciji",
            variant: "destructive",
            duration: 5000,
          })
        }
        setIsLoading(false)
        return
      }

      toast({
        title: "Proverite email",
        description: responseData.message || "Poslali smo vam dugme za potvrdu naloga.",
        duration: 5000,
      })

      setTimeout(() => {
        router.push("/prijava?registered=1")
        router.refresh()
      }, 1000)
    } catch (error) {
      console.error("[v0] Registration error:", error)

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          toast({
            title: "Greška",
            description: "Registracija traje predugo. Proverite internet konekciju.",
            variant: "destructive",
            duration: 5000,
          })
        } else {
          toast({
            title: "Greška",
            description: "Došlo je do greške. Pokušajte ponovo ili kontaktirajte podršku.",
            variant: "destructive",
            duration: 5000,
          })
        }
      } else {
        toast({
          title: "Greška",
          description: "Neočekivana greška pri registraciji. Pokušajte ponovo.",
          variant: "destructive",
          duration: 5000,
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!resetEmail) return

    setShowUserExists(false)
    setShowForgotPassword(true)
  }

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsResetting(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      })

      if (response.ok) {
        setShowForgotPassword(false)
        toast({
          title: "Link poslat!",
          description: "Link za resetovanje je poslat na vašu email adresu.",
          duration: 5000,
        })
      } else {
        const data = await response.json()
        toast({
          title: "Greška",
          description: data.error || "Greška pri slanju email-a",
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("[v0] Forgot password error:", error)
      toast({
        title: "Greška",
        description: "Greška pri slanju email-a. Pokušajte ponovo.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <>
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {showUserExists && (
              <Alert className="border-yellow-500/20 bg-yellow-500/10">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <AlertDescription className="flex items-center justify-between gap-4">
                  <span className="text-sm text-yellow-500 font-medium">
                    Korisnik sa ovom email adresom već postoji.
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleForgotPassword}
                    className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 shrink-0 bg-transparent"
                  >
                    Resetuj lozinku
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-foreground">
                  Ime
                </Label>
                <Input
                  id="firstName"
                  name="given-name"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Vaše ime"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-foreground">
                  Prezime
                </Label>
                <Input
                  id="lastName"
                  name="family-name"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Vaše prezime"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email adresa
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="vas@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground">
                Broj telefona
              </Label>
              <Input
                id="phone"
                name="tel"
                type="tel"
                autoComplete="tel"
                placeholder="+381 6X XXX XXXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Lozinka
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Minimum 8 karaktera"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                className="mt-1 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                Slažem se sa <span className="text-primary hover:underline">uslovima korišćenja</span> i{" "}
                <span className="text-primary hover:underline">politikom privatnosti</span>
              </Label>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !acceptedTerms}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-wider disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Registracija...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Registruj se
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-foreground">Resetovanje lozinke</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Unesite vašu email adresu i poslaćemo vam instrukcije za promenu lozinke.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendResetEmail} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email-register" className="text-foreground font-medium text-sm">
                Email adresa
              </Label>
              <Input
                id="reset-email-register"
                type="email"
                placeholder="vas@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                disabled={isResetting}
                className="h-11 bg-background border-primary/20 text-foreground placeholder:text-muted-foreground focus:border-primary transition-colors"
              />
            </div>

            <Button
              type="submit"
              disabled={isResetting || !resetEmail}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 font-semibold shadow-md transition-all"
            >
              {isResetting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Slanje...
                </span>
              ) : (
                "Pošalji link"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
