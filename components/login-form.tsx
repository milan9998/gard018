"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, EyeOff, LogIn, AlertCircle, Mail, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

export function LoginForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [isResetting, setIsResetting] = useState(false)
  const [isResendingVerification, setIsResendingVerification] = useState(false)
  const [emailNotVerified, setEmailNotVerified] = useState(false)
  const [canResendVerification, setCanResendVerification] = useState(false)
  const [notice, setNotice] = useState<{ type: "success" | "info" | "error"; text: string } | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("verified") === "1") {
      setNotice({ type: "success", text: "Email je uspešno potvrđen. Sada možete da se prijavite." })
    } else if (params.get("registered") === "1") {
      setNotice({ type: "info", text: "Registracija je sačuvana. Proverite email i kliknite na dugme za potvrdu naloga." })
      setCanResendVerification(true)
    } else if (params.get("verification") === "invalid") {
      setNotice({ type: "error", text: "Link za potvrdu nije važeći ili je istekao. Zatražite novi email." })
      setCanResendVerification(true)
    } else if (params.get("verification") === "error") {
      setNotice({ type: "error", text: "Potvrda trenutno nije uspela. Pokušajte ponovo." })
      setCanResendVerification(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setEmailNotVerified(false)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.email.split("@")[0],
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setCanResendVerification(false)
        window.location.href = data.mustChangePassword ? "/promena-lozinke" : "/"
      } else {
        setError(data.error || "Prijava nije uspela. Pokušajte ponovo.")
        setEmailNotVerified(data.code === "EMAIL_NOT_VERIFIED")
        setCanResendVerification(data.code === "EMAIL_NOT_VERIFIED")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Greška pri prijavi. Proverite internet konekciju.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!formData.email) {
      setError("Unesite email adresu da pošaljemo novu potvrdu.")
      return
    }
    setIsResendingVerification(true)
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Slanje nije uspelo")
      setError("")
      setEmailNotVerified(false)
      setCanResendVerification(false)
      setNotice({ type: "info", text: data.message || "Novi verifikacioni email je poslat." })
    } catch (resendError) {
      setError(resendError instanceof Error ? resendError.message : "Slanje nije uspelo")
    } finally {
      setIsResendingVerification(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsResetting(true)
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 20_000)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
        signal: controller.signal,
      })

      if (response.ok) {
        setShowForgotPassword(false)
        setResetEmail("")
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
        description:
          error instanceof DOMException && error.name === "AbortError"
            ? "Email servis nije odgovorio u roku od 20 sekundi. Pokušajte ponovo."
            : "Greška pri slanju email-a. Pokušajte ponovo.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      window.clearTimeout(timeoutId)
      setIsResetting(false)
    }
  }

  return (
    <>
      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm shadow-xl">
        <CardContent className="p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {notice && (
              <div className={`rounded-lg border p-4 text-sm font-medium ${notice.type === "success" ? "border-green-500/30 bg-green-500/10 text-green-400" : notice.type === "error" ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-primary/30 bg-primary/10 text-foreground"}`} role="status">
                {notice.text}
              </div>
            )}
            {canResendVerification && !emailNotVerified && (
              <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm text-foreground">
                <p className="mb-3">Niste dobili važeći verifikacioni email?</p>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isResendingVerification}
                  onClick={handleResendVerification}
                  className="w-full border-primary/40 bg-transparent text-foreground hover:bg-primary/10"
                >
                  {isResendingVerification ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                  {isResendingVerification ? "Slanje..." : "Pošalji potvrdu ponovo"}
                </Button>
              </div>
            )}
            {error && (
              <div className="space-y-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                  <p className="text-sm font-medium text-red-500">{error}</p>
                </div>
                {emailNotVerified && (
                  <Button type="button" variant="outline" disabled={isResendingVerification} onClick={handleResendVerification} className="w-full border-red-500/30 bg-transparent text-foreground hover:bg-red-500/10">
                    {isResendingVerification ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                    {isResendingVerification ? "Slanje..." : "Pošalji potvrdu ponovo"}
                  </Button>
                )}
              </div>
            )}

            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-foreground font-medium text-sm">
                Email adresa
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="vas@email.com"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value })
                  setEmailNotVerified(false)
                }}
                required
                className="bg-background border-primary/20 text-foreground placeholder:text-muted-foreground h-12 text-base focus:border-primary transition-colors"
              />
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="password" className="text-foreground font-medium text-sm">
                Lozinka
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="bg-background border-primary/20 text-foreground placeholder:text-muted-foreground pr-12 h-12 text-base focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Zaboravili ste lozinku?
              </button>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-wider h-12 text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Prijavljivanje...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-5 h-5" />
                  Prijavi se
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

          <form onSubmit={handleForgotPassword} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-foreground font-medium text-sm">
                Email adresa
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="vas@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  disabled={isResetting}
                  className="pl-10 h-11 bg-background border-primary/20 text-foreground placeholder:text-muted-foreground focus:border-primary transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isResetting || !resetEmail}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 font-semibold shadow-md transition-all"
            >
              {isResetting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Slanje...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Pošalji link
                </span>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
