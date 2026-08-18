"use client"

import type React from "react"

import { Calendar, Mail, User, AlertCircle, CheckCircle, Trash2, Pencil, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface Member {
  id: number
  first_name: string
  last_name: string
  email: string
  start_date: string
  expiry_date: string
  status: string
  membership_type?: string
  individual_training_paid?: boolean
  created_at: string
}

export function MembersList({ members }: { members: Member[] }) {
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [newExpiryDate, setNewExpiryDate] = useState<string>("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [extendingId, setExtendingId] = useState<number | null>(null)
  const [updatingIndividualId, setUpdatingIndividualId] = useState<number | null>(null)
  const { toast } = useToast()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-500"
      case "expired":
        return "text-red-500"
      case "notified":
        return "text-yellow-500"
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-5 h-5" />
      case "expired":
        return <AlertCircle className="w-5 h-5" />
      default:
        return <AlertCircle className="w-5 h-5" />
    }
  }

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    expiry.setHours(0, 0, 0, 0)

    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    return `${day}.${month}.${year}.`
  }

  const parseDateToISO = (ddmmyyyy: string): string | null => {
    // Ukloni tačke
    const cleaned = ddmmyyyy.replace(/\./g, "")

    // Pokušaj da parsiraš različite formate
    let day: string, month: string, year: string

    if (cleaned.length === 8) {
      // Format: DDMMYYYY
      day = cleaned.substring(0, 2)
      month = cleaned.substring(2, 4)
      year = cleaned.substring(4, 8)
    } else if (cleaned.length === 7) {
      // Format: D.MM.YYYY ili DD.M.YYYY
      const parts = ddmmyyyy.split(".")
      if (parts.length === 3) {
        day = parts[0].padStart(2, "0")
        month = parts[1].padStart(2, "0")
        year = parts[2]
      } else {
        return null
      }
    } else if (cleaned.length === 6) {
      // Format: D.M.YYYY
      const parts = ddmmyyyy.split(".")
      if (parts.length === 3) {
        day = parts[0].padStart(2, "0")
        month = parts[1].padStart(2, "0")
        year = parts[2]
      } else {
        return null
      }
    } else {
      return null
    }

    const dayNum = Number.parseInt(day, 10)
    const monthNum = Number.parseInt(month, 10)
    const yearNum = Number.parseInt(year, 10)

    if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 2020) {
      return null
    }

    return `${year}-${month}-${day}`
  }

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value

    // Dozvoli samo brojeve i tačke
    value = value.replace(/[^\d.]/g, "")

    // Maksimalno 10 karaktera (DD.MM.YYYY)
    if (value.length > 10) {
      value = value.substring(0, 10)
    }

    setNewExpiryDate(value)
  }

  const handleDateBlur = () => {
    if (!newExpiryDate) return

    const value = newExpiryDate.replace(/\./g, "")

    // Ako ima tačno 8 cifara, formatiraj automatski
    if (value.length === 8) {
      const day = value.substring(0, 2)
      const month = value.substring(2, 4)
      const year = value.substring(4, 8)
      setNewExpiryDate(`${day}.${month}.${year}`)
      return
    }

    // Pokušaj da parsiraj trenutni format
    const parts = newExpiryDate.split(".")
    if (parts.length === 3) {
      let [day, month, year] = parts

      // Dodaj leading zero
      if (day && day.length === 1) day = "0" + day
      if (month && month.length === 1) month = "0" + month

      if (day && month && year) {
        setNewExpiryDate(`${day}.${month}.${year}`)
      }
    }
  }

  const handleOpenEditModal = (member: Member) => {
    setEditingMember(member)
    const date = new Date(member.expiry_date)
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    setNewExpiryDate(`${day}.${month}.${year}`)
  }

  const handleUpdateExpiryDate = async () => {
    if (!editingMember || !newExpiryDate) {
      console.log("[v0] Cannot update - missing data:", {
        hasEditingMember: !!editingMember,
        hasNewExpiryDate: !!newExpiryDate,
      })
      return
    }

    const expiryDateISO = parseDateToISO(newExpiryDate)

    if (!expiryDateISO) {
      toast({
        title: "Грешка",
        description: "Невалидан формат датума. Користите DD.MM.YYYY (нпр. 31.12.2026)",
        variant: "destructive",
      })
      return
    }

    setIsUpdating(true)

    const requestData = { expiry_date: expiryDateISO }
    const url = `/api/members/${editingMember.id}`

    console.log("[v0] ===== STARTING UPDATE REQUEST =====")
    console.log("[v0] Request details:", {
      memberId: editingMember.id,
      memberName: `${editingMember.first_name} ${editingMember.last_name}`,
      currentExpiryDate: editingMember.expiry_date,
      newExpiryDateDisplay: newExpiryDate,
      newExpiryDateISO: expiryDateISO,
      requestData,
      url,
      method: "PATCH",
    })

    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestData),
      })

      console.log("[v0] Response received:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url,
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("[v0] Non-JSON response received:", {
          contentType,
          text: text.substring(0, 500),
        })
        throw new Error("Server nije vratio JSON odgovor")
      }

      const data = await response.json()
      console.log("[v0] Response data parsed:", data)

      if (response.ok) {
        console.log("[v0] ===== UPDATE SUCCESSFUL =====")
        toast({
          title: "Успешно ажурирано",
          description: `Датум истека за ${editingMember.first_name} ${editingMember.last_name} је успешно ажуриран на ${newExpiryDate}.`,
        })
        setEditingMember(null)

        setTimeout(() => {
          console.log("[v0] Reloading page to show updated member...")
          window.location.reload()
        }, 1000)
      } else {
        console.error("[v0] ===== UPDATE FAILED =====", data)
        toast({
          title: "Greška",
          description: data.error || data.details || "Došlo je do greške pri ažuriranju datuma.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] ===== UPDATE ERROR =====", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      })
      toast({
        title: "Grešка",
        description: error instanceof Error ? error.message : "Došlo je do greške pri ažuriranju datuma.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
      console.log("[v0] ===== UPDATE REQUEST COMPLETE =====")
    }
  }

  const handleDeleteMember = async (memberId: number, memberName: string) => {
    if (!confirm(`Da li ste sigurni da želite da obrišete člana ${memberName}?`)) {
      return
    }

    setDeletingId(memberId)
    try {
      const response = await fetch("/api/members/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      })

      if (response.ok) {
        toast({
          title: "Uspešno obrisano",
          description: `Član ${memberName} je uspešno obrisan iz sistema.`,
        })
        if ((window as any).refreshMembers) {
          ;(window as any).refreshMembers()
        }
      } else {
        const data = await response.json()
        toast({
          title: "Greška",
          description: data.error || "Došlo je do greške pri brisanju člana.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error deleting member:", error)
      toast({
        title: "Greška",
        description: "Došlo je do greške pri brisanju člana.",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handleIndividualPaymentToggle = async (member: Member, paid: boolean) => {
    setUpdatingIndividualId(member.id)
    try {
      const response = await fetch(`/api/members/${member.id}/individual-payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Greška pri ažuriranju uplate")
      }

      toast({
        title: paid ? "Individualni trening označen kao plaćen" : "Individualna uplata poništena",
        description: `${member.first_name} ${member.last_name}`,
      })

      if ((window as any).refreshMembers) await (window as any).refreshMembers()
    } catch (error) {
      toast({
        title: "Greška",
        description: error instanceof Error ? error.message : "Greška pri ažuriranju uplate",
        variant: "destructive",
      })
    } finally {
      setUpdatingIndividualId(null)
    }
  }

  const handleExtendMembership = async (member: Member) => {
    if (!confirm(`Produžiti članarinu za ${member.first_name} ${member.last_name} za još jedan mesec?`)) return

    setExtendingId(member.id)
    try {
      const response = await fetch(`/api/members/${member.id}/extend-membership`, { method: "POST" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Greška pri produženju članarine")

      toast({
        title: "Članarina produžena",
        description: `${member.first_name} ${member.last_name}: ${data.message || "produženje je sačuvano."}`,
      })
      if ((window as any).refreshMembers) await (window as any).refreshMembers()
    } catch (error) {
      toast({
        title: "Greška",
        description: error instanceof Error ? error.message : "Greška pri produženju članarine",
        variant: "destructive",
      })
    } finally {
      setExtendingId(null)
    }
  }

  const getDisplayStatus = (expiryDate: string): string => {
    const expiry = new Date(expiryDate)
    const today = new Date()
    expiry.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)

    // If expiry date is today or in the past, it's expired
    if (expiry.getTime() <= today.getTime()) {
      return "expired"
    }

    return "active"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Чланови</h2>
        <span className="text-muted-foreground">{members.length} укупно</span>
      </div>

      <div className="space-y-3">
        {members.map((member) => {
          return (
            <div
              key={member.id}
              className="backdrop-blur-md bg-card/20 border border-primary/20 rounded-lg p-6 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <User className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-semibold text-foreground">
                      {member.first_name} {member.last_name}
                    </h3>
                    <span
                      className={`flex items-center gap-1 text-sm ${getStatusColor(getDisplayStatus(member.expiry_date))}`}
                    >
                      {getStatusIcon(getDisplayStatus(member.expiry_date))}
                      {getDisplayStatus(member.expiry_date)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{member.email}</span>
                  </div>

                  <label className="inline-flex items-center gap-3 rounded-md border border-primary/20 bg-background/30 px-3 py-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={Boolean(member.individual_training_paid)}
                      disabled={updatingIndividualId === member.id}
                      onChange={(event) => handleIndividualPaymentToggle(member, event.target.checked)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span>Individualni trening plaćen</span>
                    {updatingIndividualId === member.id && <span className="text-xs text-muted-foreground">Čuvanje...</span>}
                  </label>

                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Истиче:{" "}
                        <span
                          className={
                            isExpiringSoon(member.expiry_date) ? "text-yellow-500 font-semibold" : "text-foreground"
                          }
                        >
                          {formatDate(member.expiry_date)}
                        </span>
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleOpenEditModal(member)}
                      title="Izmeni datum isteka"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-primary/30 text-primary hover:bg-primary/10"
                      onClick={() => handleExtendMembership(member)}
                      disabled={extendingId === member.id}
                      title="Produži članarinu za jedan mesec"
                    >
                      <Plus className="mr-1.5 h-4 w-4" />
                      {extendingId === member.id ? "Produžujem..." : "Produži"}
                    </Button>
                  </div>

                  {isExpiringSoon(member.expiry_date) && getDisplayStatus(member.expiry_date) === "active" && (
                    <div className="flex items-center gap-2 text-yellow-500 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>Чланарина ускоро истиче!</span>
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteMember(member.id, `${member.first_name} ${member.last_name}`)}
                  disabled={deletingId === member.id}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )
        })}

        {members.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Нема регистрованих чланова</p>
          </div>
        )}
      </div>

      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Измени datum истека</DialogTitle>
            <DialogDescription>
              Изаберите нови датум истека чланарине за {editingMember?.first_name} {editingMember?.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="expiry-date" className="text-sm font-medium">
                Нови датум истека
              </label>
              <p className="text-xs text-muted-foreground">Унесите датум у формату DD.MM.YYYY (нпр. 31.12.2026)</p>
              <input
                id="expiry-date"
                type="text"
                placeholder="DD.MM.YYYY"
                value={newExpiryDate}
                onChange={handleDateInput}
                onBlur={handleDateBlur}
                maxLength={10}
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
              />
              {newExpiryDate.length >= 6 && parseDateToISO(newExpiryDate) && (
                <p className="text-sm font-medium text-green-600">✓ Валидан датум</p>
              )}
              {newExpiryDate.length >= 6 && !parseDateToISO(newExpiryDate) && (
                <p className="text-sm font-medium text-red-600">✗ Невалидан формат</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)} disabled={isUpdating}>
              Откажи
            </Button>
            <Button onClick={handleUpdateExpiryDate} disabled={isUpdating || !newExpiryDate}>
              {isUpdating ? "Чување..." : "Сачувај"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
