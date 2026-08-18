"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { KeyRound, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function PromenaLozinkePage() {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/auth/session")
      .then((response) => response.json())
      .then((data) => {
        if (!data.user) router.replace("/prijava")
        else setLoading(false)
      })
      .catch(() => router.replace("/prijava"))
  }, [router])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Popunite sva tri polja")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Nova lozinka i potvrda se ne poklapaju")
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Promena lozinke nije uspela")
      router.replace("/")
      router.refresh()
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : "Promena lozinke nije uspela")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md rounded-lg border border-primary/20 bg-card/40 p-8">
        <div className="mb-8 text-center">
          <KeyRound className="mx-auto mb-4 h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Promenite privremenu lozinku</h1>
          <p className="mt-3 text-muted-foreground">Pre nastavka morate postaviti svoju ličnu lozinku.</p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          {error && <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
          <div className="space-y-2"><Label htmlFor="current-password">Privremena lozinka</Label><Input id="current-password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="new-password">Nova lozinka</Label><Input id="new-password" type="password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required /><p className="text-xs text-muted-foreground">Minimum 8 karaktera.</p></div>
          <div className="space-y-2"><Label htmlFor="confirm-password">Potvrdi novu lozinku</Label><Input id="confirm-password" type="password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></div>
          <Button type="submit" disabled={saving} className="w-full bg-primary text-primary-foreground">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{saving ? "Čuvanje..." : "Sačuvaj novu lozinku"}</Button>
        </form>
      </div>
    </main>
  )
}
