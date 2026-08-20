"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserPageNavigation } from "@/components/user-page-navigation"

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          router.push("/prijava")
          return
        }
        setUser(data.user)
        setName(data.user.name || "")
        setIsLoading(false)
      })
      .catch(() => {
        router.push("/prijava")
      })
  }, [router])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })

      if (res.ok) {
        alert("Profil uspešno ažuriran!")
        window.location.reload()
      } else {
        alert("Greška pri čuvanju profila")
      }
    } catch (error) {
      alert("Greška pri čuvanju profila")
    }
    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Učitavanje...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4 max-w-2xl">
        <UserPageNavigation />

        <div className="bg-card/50 backdrop-blur-sm border border-primary/20 rounded-lg p-8">
          <h1 className="text-3xl font-bold text-foreground mb-6">Podešavanja profila</h1>

          {/* Name */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-foreground mb-3">Ime i prezime</label>
            <Input
              type="text"
              placeholder="Vaše ime"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background/50 border-primary/20"
            />
          </div>

          {/* Email (read-only) */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-foreground mb-3">Email adresa</label>
            <Input
              type="email"
              value={user?.email || ""}
              disabled
              className="bg-background/30 border-primary/20 opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-2">Email adresa se ne može promeniti</p>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mb-4"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Čuvanje..." : "Sačuvaj promene"}
          </Button>

          {/* Account deletion is intentionally admin-only. */}
          <div className="pt-8 border-t border-primary/20">
            <h2 className="text-xl font-semibold text-foreground mb-4">Brisanje naloga</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Članovi i admini ne mogu sami obrisati nalog. Za brisanje se obratite treneru ili ovlašćenom adminu.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
