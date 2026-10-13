"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, Loader2, Search, Users } from "lucide-react"

import { AdminGuard } from "@/components/admin/admin-guard"
import { AdminNavigation } from "@/components/admin/admin-navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

type MemberCount = {
  id: number
  first_name: string
  last_name: string
  email: string
  training_count: number
  overdue_count: number
}

type MonthCount = {
  month: string
  training_count: number
  overdue_count: number
}

type MemberDetail = {
  member: {
    id: number
    first_name: string
    last_name: string
    email: string
    start_date: string
    expiry_date: string
  }
  months: MonthCount[]
}

function formatMonth(value: string) {
  const [year, month] = value.split("-").map(Number)
  if (!year || !month) return value
  return new Intl.DateTimeFormat("sr-RS", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, 1)))
}

export default function BrojTreningaPage() {
  const [members, setMembers] = useState<MemberCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<MemberDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState("")

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const response = await fetch("/api/admin/training-counts", { cache: "no-store" })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error || "Broj treninga nije dostupan")
        if (active) {
          setMembers(data.members || [])
          setError("")
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Broj treninga nije dostupan")
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    const refresh = () => { if (document.visibilityState === "visible") void load() }
    document.addEventListener("visibilitychange", refresh)
    return () => { active = false; document.removeEventListener("visibilitychange", refresh) }
  }, [])

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("sr-RS")
    if (!term) return members
    return members.filter((member) =>
      `${member.first_name} ${member.last_name} ${member.email}`.toLocaleLowerCase("sr-RS").includes(term),
    )
  }, [members, query])

  const openDetail = async (memberId: number) => {
    setDetailOpen(true)
    setDetail(null)
    setDetailError("")
    setDetailLoading(true)
    try {
      const response = await fetch(`/api/admin/training-counts/${memberId}`, { cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Pregled treninga nije dostupan")
      setDetail(data)
    } catch (loadError) {
      setDetailError(loadError instanceof Error ? loadError.message : "Pregled treninga nije dostupan")
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <AdminGuard>
      <main className="min-h-screen bg-background px-3 pb-16 pt-20 sm:px-6 sm:pt-24 lg:px-8">
        <AdminNavigation />
        <div className="mx-auto max-w-5xl">
          <header className="mb-6">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              <CalendarDays className="h-4 w-4" /> Admin · dolasci
            </div>
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Broj treninga</h1>
            <p className="mt-2 text-sm text-muted-foreground">Evidencija počinje od uvođenja brojanja. Jedan dolazak po članu dnevno.</p>
          </header>

          <div className="relative mb-5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pretraži ime, prezime ili email"
              aria-label="Pretraži članove"
              className="h-12 bg-card pl-10"
            />
          </div>

          {loading && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Učitavanje...</div>}
          {error && <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-300" role="alert">{error}</p>}
          {!loading && !error && filtered.length === 0 && (
            <p className="rounded-xl border border-primary/20 bg-card/60 p-6 text-center text-muted-foreground">Nema članova za ovu pretragu.</p>
          )}
          {!loading && !error && filtered.length > 0 && (
            <div className="space-y-2">
              {filtered.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => void openDetail(member.id)}
                  className="flex w-full flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-card/60 p-4 text-left transition hover:border-primary/50 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Users className="h-5 w-5 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-foreground">{member.first_name} {member.last_name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{member.email}</span>
                  </span>
                  <span className="text-sm font-semibold text-foreground">Treninzi: {member.training_count}</span>
                  <span className="text-sm font-semibold text-red-300">Prekoračenja: {member.overdue_count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{detail ? `${detail.member.first_name} ${detail.member.last_name}` : "Treninzi člana"}</DialogTitle>
              <DialogDescription>Broj dolazaka po mesecima od početka evidencije.</DialogDescription>
            </DialogHeader>
            {detailLoading && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Učitavanje...</p>}
            {detailError && <p className="text-sm text-red-300" role="alert">{detailError}</p>}
            {detail && detail.months.length === 0 && <p className="text-sm text-muted-foreground">Još nema evidentiranih treninga.</p>}
            {detail && detail.months.length > 0 && (
              <div className="space-y-2">
                {detail.months.map((month) => (
                  <div key={month.month} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/20 bg-card/70 px-4 py-3">
                    <span className="font-semibold capitalize text-foreground">{formatMonth(month.month)}</span>
                    <span className="text-sm text-foreground">Treninzi: {month.training_count}</span>
                    <span className="text-sm text-red-300">Prekoračenja: {month.overdue_count}</span>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </AdminGuard>
  )
}
