"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AdminGuard } from "@/components/admin/admin-guard"
import { AdminNavigation } from "@/components/admin/admin-navigation"
import { isProtectedAdmin } from "@/lib/admin-constants"
import { Shield, Trash2, UserPlus } from "lucide-react"

type Admin = {
  id: number
  email: string
  granted_by: string
  created_at: string
}

export default function ManageAdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [newAdminEmail, setNewAdminEmail] = useState("")
  const [currentUserEmail, setCurrentUserEmail] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdmins()
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/auth/session")
      const data = await response.json()
      if (data.user) {
        setCurrentUserEmail(data.user.email)
      }
    } catch (error) {
      console.error("Error fetching current user:", error)
    }
  }

  const fetchAdmins = async () => {
    try {
      const response = await fetch("/api/admins")
      const data = await response.json()
      setAdmins(data.admins || [])
    } catch (error) {
      console.error("Error fetching admins:", error)
    } finally {
      setLoading(false)
    }
  }

  const addAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAdminEmail) return

    try {
      const response = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newAdminEmail, grantedBy: currentUserEmail }),
      })

      if (response.ok) {
        setNewAdminEmail("")
        fetchAdmins()
      } else {
        const data = await response.json()
        alert(data.error || "Greška prilikom dodavanja admina")
      }
    } catch (error) {
      console.error("Error adding admin:", error)
      alert("Greška prilikom dodavanja admina")
    }
  }

  const removeAdmin = async (email: string) => {
    if (!confirm(`Da li ste sigurni da želite da uklonite admin pristup za ${email}?`)) {
      return
    }

    try {
      const response = await fetch("/api/admins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        fetchAdmins()
      } else {
        const data = await response.json()
        alert(data.error || "Greška prilikom uklanjanja admina")
      }
    } catch (error) {
      console.error("Error removing admin:", error)
      alert("Greška prilikom uklanjanja admina")
    }
  }

  if (loading) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-background pb-12 pt-20 sm:py-12">
          <div className="container mx-auto px-4">
            <AdminNavigation />
            <p className="text-center text-muted-foreground">Učitavanje...</p>
          </div>
        </div>
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background pb-12 pt-20 sm:py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <AdminNavigation />
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2 sm:text-4xl">Upravljaj adminima</h1>
            <p className="text-muted-foreground">Dodaj ili ukloni admin pristup korisnicima</p>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-4 mb-8 sm:p-6">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2 sm:text-xl">
              <UserPlus className="w-5 h-5 text-primary" />
              Dodaj novog admina
            </h2>
            <form onSubmit={addAdmin} className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="Email adresa novog admina"
                className="bg-primary/5 border-primary/20 text-foreground flex-1 h-11"
                required
              />
              <Button type="submit" className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto">
                Dodaj admina
              </Button>
            </form>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-xl p-4 sm:p-6">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2 sm:text-xl">
              <Shield className="w-5 h-5 text-primary" />
              Trenutni admini ({admins.length})
            </h2>
            <div className="space-y-3">
              {admins.map((admin) => {
                const protectedAdmin = isProtectedAdmin(admin.email)
                return (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between gap-3 p-4 bg-background/50 rounded-lg border border-primary/10"
                  >
                    <div className="flex-1">
                      <p className="text-foreground font-medium">{admin.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {protectedAdmin ? "Trener · zaštićen admin" : `Dodelio: ${admin.granted_by}`} • {new Date(admin.created_at).toLocaleDateString("sr-RS")}
                      </p>
                    </div>
                    {protectedAdmin ? (
                      <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">Zaštićen</span>
                    ) : !isProtectedAdmin(currentUserEmail) ? (
                      <span className="shrink-0 rounded-full border border-primary/20 px-3 py-1.5 text-xs text-muted-foreground">Samo glavni trener može ukloniti</span>
                    ) : (
                      <Button
                        onClick={() => removeAdmin(admin.email)}
                        variant="outline"
                        size="sm"
                        className="border-red-500/20 text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  )
}
