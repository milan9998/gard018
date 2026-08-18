"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, KeyRound, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError("Nevažeći link za resetovanje lozinke")
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Lozinke se ne poklapaju")
      return
    }

    if (password.length < 8) {
      setError("Lozinka mora imati najmanje 8 karaktera")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/prijava")
        }, 3000)
      } else {
        setError(data.error || "Greška pri resetovanju lozinke")
      }
    } catch (error) {
      console.error("[v0] Reset password error:", error)
      setError("Greška pri resetovanju lozinke")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-black via-zinc-900 to-black">
        <Card className="w-full max-w-md border-primary/20 bg-card/50 backdrop-blur-sm shadow-xl">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Lozinka uspešno promenjena!</h2>
            <p className="text-muted-foreground">
              Vaša lozinka je uspešno resetovana. Bićete preusmereni na stranicu za prijavu...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-black via-zinc-900 to-black">
      <Card className="w-full max-w-md border-primary/20 bg-card/50 backdrop-blur-sm shadow-xl">
        <CardHeader className="space-y-2 text-center pb-4">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Nova lozinka</CardTitle>
          <p className="text-sm text-muted-foreground">Unesite vašu novu lozinku</p>
        </CardHeader>
        <CardContent className="p-8 pt-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3 mb-6">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-500 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2.5">
              <Label htmlFor="password" className="text-foreground font-medium text-sm">
                Nova lozinka
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 karaktera"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={!token || isLoading}
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

            <div className="space-y-2.5">
              <Label htmlFor="confirmPassword" className="text-foreground font-medium text-sm">
                Potvrdite lozinku
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Ponovite lozinku"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={!token || isLoading}
                  className="bg-background border-primary/20 text-foreground placeholder:text-muted-foreground pr-12 h-12 text-base focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={!token || isLoading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-wider h-12 text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Resetovanje...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5" />
                  Resetuj lozinku
                </span>
              )}
            </Button>

            <div className="text-center pt-2">
              <Link
                href="/prijava"
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Nazad na prijavu
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <ResetPasswordContent />
    </Suspense>
  )
}
