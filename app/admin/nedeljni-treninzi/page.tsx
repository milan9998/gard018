"use client"

import { useEffect, useState, type FormEvent } from "react"
import { CalendarDays, CheckCircle2, Clock3, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react"

import { AdminGuard } from "@/components/admin/admin-guard"
import { AdminNavigation } from "@/components/admin/admin-navigation"
import { Button } from "@/components/ui/button"

type ScheduleItem = {
  id: number
  day_of_week: number
  start_time: string
  end_time: string
  program: string
}

const days = [
  { value: 1, label: "Ponedeljak", short: "PON" },
  { value: 2, label: "Utorak", short: "UTO" },
  { value: 3, label: "Sreda", short: "SRE" },
  { value: 4, label: "Četvrtak", short: "ČET" },
  { value: 5, label: "Petak", short: "PET" },
  { value: 6, label: "Subota", short: "SUB" },
  { value: 7, label: "Nedelja", short: "NED" },
]

const trimTime = (value: string) => value.slice(0, 5)
const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"))
const minutes = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0"))

function TimePicker({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [hour = "00", minute = "00"] = value.split(":")
  const normalizedMinute = minutes.includes(minute) ? minute : "00"

  return (
    <fieldset className="min-w-0">
      <legend className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        <Clock3 className="h-4 w-4 text-primary" /> {label}
      </legend>
      <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
        <select
          aria-label={`${label} - sat`}
          value={hour}
          onChange={(event) => onChange(`${event.target.value}:${normalizedMinute}`)}
          className="h-12 min-w-0 rounded-lg border border-primary/25 bg-background px-2 text-center font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
        >
          {hours.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <span aria-hidden="true" className="font-bold text-primary">:</span>
        <select
          aria-label={`${label} - minut`}
          value={normalizedMinute}
          onChange={(event) => onChange(`${hour}:${event.target.value}`)}
          className="h-12 min-w-0 rounded-lg border border-primary/25 bg-background px-2 text-center font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
        >
          {minutes.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
    </fieldset>
  )
}

export default function AdminNedeljniTreninziPage() {
  const [items, setItems] = useState<ScheduleItem[]>([])
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [startTime, setStartTime] = useState("20:00")
  const [endTime, setEndTime] = useState("21:00")
  const [program, setProgram] = useState("Boks, Kik Boks, Muay Thai")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/weekly-schedule", { cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Greška pri učitavanju rasporeda")
      setItems(data.schedule || [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Greška pri učitavanju rasporeda")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const resetForm = () => {
    setEditingId(null)
    setDayOfWeek(1)
    setStartTime("20:00")
    setEndTime("21:00")
    setProgram("Boks, Kik Boks, Muay Thai")
  }

  const editItem = (item: ScheduleItem) => {
    setEditingId(item.id)
    setDayOfWeek(item.day_of_week)
    setStartTime(trimTime(item.start_time))
    setEndTime(trimTime(item.end_time))
    setProgram(item.program)
    setMessage("")
    setError("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage("")
    setError("")
    if (endTime <= startTime) {
      setError("Kraj treninga mora biti posle početka.")
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/weekly-schedule", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, dayOfWeek, startTime, endTime, program }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Čuvanje nije uspelo")
      setMessage(editingId ? "Trening je uspešno izmenjen." : "Trening je dodat u nedeljni raspored.")
      resetForm()
      await load()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Čuvanje nije uspelo")
    } finally {
      setSaving(false)
    }
  }

  const remove = async (item: ScheduleItem) => {
    const day = days.find((value) => value.value === item.day_of_week)?.label || "termin"
    if (!window.confirm(`Obrisati trening: ${day}, ${trimTime(item.start_time)}?`)) return
    setMessage("")
    setError("")
    try {
      const response = await fetch("/api/weekly-schedule", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Brisanje nije uspelo")
      if (editingId === item.id) resetForm()
      setMessage("Trening je obrisan iz rasporeda.")
      await load()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Brisanje nije uspelo")
    }
  }

  return (
    <AdminGuard>
      <main className="min-h-screen bg-background px-3 pb-20 pt-20 sm:px-6 sm:pt-24 lg:px-8">
        <AdminNavigation />
        <div className="mx-auto max-w-6xl">
          <header className="mb-7 sm:mb-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              <CalendarDays className="h-4 w-4" /> Admin · nedeljni treninzi
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Nedeljni raspored</h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Izaberi dan, početak, kraj i program. Promena se odmah prikazuje u odeljku „Nedeljni raspored” na početnoj strani.
            </p>
          </header>

          {(message || error) && (
            <div className={`mb-6 flex items-start gap-3 rounded-xl border p-4 text-sm ${error ? "border-red-500/40 bg-red-500/10 text-red-200" : "border-primary/30 bg-primary/10 text-foreground"}`} role="status">
              <CheckCircle2 className={`mt-0.5 h-5 w-5 shrink-0 ${error ? "text-red-400" : "text-primary"}`} />
              <span>{error || message}</span>
            </div>
          )}

          <div className="grid items-start gap-6 lg:grid-cols-[360px_1fr] lg:gap-8">
            <form onSubmit={submit} className="rounded-2xl border border-primary/25 bg-card/50 p-4 shadow-xl shadow-black/10 sm:p-6 lg:sticky lg:top-28">
              <h2 className="mb-5 flex items-center gap-2 text-xl font-semibold text-foreground">
                {editingId ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
                {editingId ? "Izmeni trening" : "Dodaj trening"}
              </h2>

              <label className="block text-sm font-medium text-foreground">
                Dan
                <select value={dayOfWeek} onChange={(event) => setDayOfWeek(Number(event.target.value))} className="mt-2 h-12 w-full rounded-lg border border-primary/25 bg-background px-3 text-foreground outline-none focus:ring-2 focus:ring-primary">
                  {days.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
                </select>
              </label>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <TimePicker label="Početak" value={startTime} onChange={setStartTime} />
                <TimePicker label="Kraj" value={endTime} onChange={setEndTime} />
              </div>

              <label className="mt-4 block text-sm font-medium text-foreground">
                Program
                <textarea required maxLength={255} rows={3} value={program} onChange={(event) => setProgram(event.target.value)} className="mt-2 w-full resize-none rounded-lg border border-primary/25 bg-background p-3 text-foreground outline-none focus:ring-2 focus:ring-primary" placeholder="Na primer: Boks, Kik Boks, Muay Thai" />
              </label>

              <Button type="submit" disabled={saving} className="mt-5 h-12 w-full bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingId ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                {saving ? "Čuvanje..." : editingId ? "Sačuvaj izmene" : "Dodaj u raspored"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm} className="mt-2 h-11 w-full border-primary/30 text-foreground">
                  <X className="mr-2 h-4 w-4" /> Odustani od izmene
                </Button>
              )}
            </form>

            <section>
              <h2 className="mb-4 flex items-center gap-2 text-2xl font-semibold text-foreground"><CalendarDays className="h-6 w-6 text-primary" /> Objavljeni treninzi</h2>
              {loading ? (
                <div className="flex min-h-40 items-center justify-center rounded-2xl border border-primary/20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
              ) : items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-primary/30 p-8 text-center text-muted-foreground">Nema objavljenih nedeljnih treninga.</div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => {
                    const day = days.find((value) => value.value === item.day_of_week)
                    return (
                      <article key={item.id} className={`rounded-xl border bg-card/40 p-4 transition sm:p-5 ${editingId === item.id ? "border-primary ring-1 ring-primary/40" : "border-primary/20"}`}>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="rounded-md bg-primary/15 px-2 py-1 text-xs font-bold text-primary">{day?.short}</span>
                              <h3 className="font-semibold text-foreground">{day?.label}</h3>
                            </div>
                            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-primary"><Clock3 className="h-4 w-4" /> {trimTime(item.start_time)} – {trimTime(item.end_time)}</p>
                            <p className="mt-1 break-words text-sm text-foreground">{item.program}</p>
                          </div>
                          <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
                            <Button type="button" variant="outline" onClick={() => editItem(item)} className="h-10 border-primary/30 text-foreground"><Pencil className="mr-2 h-4 w-4" /> Izmeni</Button>
                            <Button type="button" variant="outline" onClick={() => remove(item)} className="h-10 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"><Trash2 className="mr-2 h-4 w-4" /> Obriši</Button>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </AdminGuard>
  )
}
