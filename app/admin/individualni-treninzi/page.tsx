"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { DayPicker } from "react-day-picker"
import { Calendar, CheckCircle2, Clock3, Loader2, Plus, Trash2, Users, XCircle } from "lucide-react"
import { AdminGuard } from "@/components/admin/admin-guard"
import { AdminNavigation } from "@/components/admin/admin-navigation"
import { Button } from "@/components/ui/button"
import { PushNotificationButton } from "@/components/push-notification-button"

type Slot = {
  id: number
  starts_at: string
  ends_at: string
  status: string
  booking_count?: number
}

type Booking = {
  id: number
  status: "pending" | "booked"
  starts_at: string
  ends_at: string
  first_name: string
  last_name: string
  email: string
}

const pad = (value: number) => String(value).padStart(2, "0")
const dateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const localDateFromValue = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : dateKey(date)
}
const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("sr-RS", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
const formatSelectedDate = (value: Date | undefined) =>
  value?.toLocaleDateString("sr-RS", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) || "Izaberi datum"

const hours = Array.from({ length: 24 }, (_, index) => pad(index))
const minutes = Array.from({ length: 60 }, (_, index) => pad(index))

function TimePicker({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [hour, minute] = value.split(":")

  const updatePart = (part: "hour" | "minute", nextValue: string) => {
    onChange(part === "hour" ? `${nextValue}:${minute}` : `${hour}:${nextValue}`)
  }

  return (
    <div className="min-w-0">
      <span className="flex items-center gap-1.5 text-sm text-foreground"><Clock3 className="h-4 w-4 text-primary" /> {label}</span>
      <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
        <select aria-label={`${label} - sat`} value={hour} onChange={(event) => updatePart("hour", event.target.value)} className="h-11 min-w-0 rounded-lg border border-primary/25 bg-background px-2 text-center text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary">
          {hours.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <span className="font-bold text-primary">:</span>
        <select aria-label={`${label} - minut`} value={minute} onChange={(event) => updatePart("minute", event.target.value)} className="h-11 min-w-0 rounded-lg border border-primary/25 bg-background px-2 text-center text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary">
          {minutes.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
    </div>
  )
}

export default function AdminIndividualniTreninziPage() {
  const today = useMemo(() => {
    const value = new Date()
    value.setHours(0, 0, 0, 0)
    return value
  }, [])
  const [slots, setSlots] = useState<Slot[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today)
  const [startTime, setStartTime] = useState("18:00")
  const [endTime, setEndTime] = useState("19:00")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyBookingId, setBusyBookingId] = useState<number | null>(null)
  const [message, setMessage] = useState("")

  const selectedDateKey = selectedDate ? dateKey(selectedDate) : ""
  const slotDates = useMemo(() => slots.map((slot) => new Date(`${localDateFromValue(slot.starts_at)}T00:00:00`)), [slots])
  const pendingBookings = bookings.filter((booking) => booking.status === "pending")
  const confirmedBookings = bookings.filter((booking) => booking.status === "booked")

  const load = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const [slotsResponse, bookingsResponse] = await Promise.all([
        fetch("/api/individual-trainings/slots", { cache: "no-store" }),
        fetch("/api/individual-trainings/bookings", { cache: "no-store" }),
      ])
      const slotsData = await slotsResponse.json().catch(() => ({}))
      const bookingsData = await bookingsResponse.json().catch(() => ({}))
      if (!slotsResponse.ok) throw new Error(slotsData.error || "Greška pri učitavanju termina")
      if (!bookingsResponse.ok) throw new Error(bookingsData.error || "Greška pri učitavanju rezervacija")
      setSlots(slotsData.slots || [])
      setBookings(bookingsData.bookings || [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Greška pri učitavanju podataka")
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") void load(false)
    }
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === "gard018-push-received") refresh()
    }
    const interval = window.setInterval(refresh, 5000)
    document.addEventListener("visibilitychange", refresh)
    window.addEventListener("focus", refresh)
    navigator.serviceWorker?.addEventListener("message", handleServiceWorkerMessage)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", refresh)
      window.removeEventListener("focus", refresh)
      navigator.serviceWorker?.removeEventListener("message", handleServiceWorkerMessage)
    }
  }, [])

  const createSlot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedDateKey) {
      setMessage("Izaberi datum treninga.")
      return
    }
    if (endTime <= startTime) {
      setMessage("Vreme završetka mora biti posle početka.")
      return
    }

    setSaving(true)
    setMessage("")
    try {
      const response = await fetch("/api/individual-trainings/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startsAt: `${selectedDateKey}T${startTime}`,
          endsAt: `${selectedDateKey}T${endTime}`,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Greška pri kreiranju termina")
      setMessage("Termin je uspešno dodat.")
      await load()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Greška pri kreiranju termina")
    } finally {
      setSaving(false)
    }
  }

  const cancelSlot = async (id: number) => {
    if (!window.confirm("Da li želite da otkažete ovaj termin?")) return
    const response = await fetch("/api/individual-trainings/slots", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) setMessage(data.error || "Greška pri otkazivanju termina")
    else {
      setMessage("Termin je otkazan.")
      await load()
    }
  }

  const reviewBooking = async (bookingId: number, action: "approve" | "reject" | "cancel") => {
    if (action === "cancel" && !window.confirm("Da li sigurno želiš da otkažeš ovaj potvrđeni individualni trening?")) return
    setBusyBookingId(bookingId)
    setMessage("")
    try {
      const response = await fetch("/api/individual-trainings/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, action }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Greška pri obradi zahteva")
      await load()
      setMessage(action === "approve" ? "Trening je potvrđen članu." : action === "cancel" ? "Potvrđeni trening je otkazan i član je obavešten." : "Zahtev je odbijen.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Greška pri obradi zahteva")
    } finally {
      setBusyBookingId(null)
    }
  }

  return (
    <AdminGuard>
      <main className="min-h-screen bg-background px-3 pb-20 pt-20 sm:px-6 sm:pt-24">
        <AdminNavigation />
        <div className="mx-auto max-w-6xl">
          <header className="mb-7 sm:mb-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary sm:px-4 sm:py-2 sm:text-sm">
              <Calendar className="h-4 w-4" /> Admin · individualni treninzi
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Termini i rezervacije</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:mt-3 sm:text-base">
              Klikni dan u kalendaru, izaberi vreme i objavi slobodan termin. Novi zahtevi članova čekaju tvoje odobrenje.
            </p>
          </header>

          <div className="mb-6">
            <PushNotificationButton />
          </div>

          {message && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm text-foreground" role="status">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> <span>{message}</span>
            </div>
          )}

          <div className="grid items-start gap-5 lg:grid-cols-[minmax(300px,360px)_1fr] lg:gap-8">
            <form onSubmit={createSlot} className="rounded-2xl border border-primary/25 bg-card/50 p-4 shadow-xl shadow-black/10 sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground sm:mb-5"><Plus className="h-5 w-5 text-primary" /> Novi termin</h2>

              <div className="rounded-xl border border-primary/20 bg-background/70 p-2 sm:p-3">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={{ before: today }}
                  modifiers={{ hasSlot: slotDates }}
                  modifiersClassNames={{ hasSlot: "font-bold underline decoration-primary decoration-2 underline-offset-4" }}
                  showOutsideDays
                  fixedWeeks
                  weekStartsOn={1}
                  aria-label="Izbor datuma individualnog treninga"
                  className="mx-auto w-full"
                  classNames={{
                    months: "flex w-full flex-col",
                    month: "w-full space-y-3",
                    month_caption: "relative flex h-9 items-center justify-center",
                    caption_label: "text-sm font-semibold capitalize text-foreground",
                    nav: "flex items-center gap-1",
                    button_previous: "absolute left-0 inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    button_next: "absolute right-0 inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    month_grid: "w-full border-collapse",
                    weekdays: "flex w-full",
                    weekday: "w-full text-center text-[0.68rem] font-semibold uppercase text-muted-foreground sm:text-xs",
                    week: "mt-1 flex w-full",
                    day: "relative w-full p-0 text-center",
                    day_button: "mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-sm text-foreground transition hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-10 sm:w-10",
                    selected: "bg-primary text-primary-foreground hover:bg-primary",
                    today: "font-bold ring-1 ring-primary/60 ring-inset",
                    outside: "text-muted-foreground/40",
                    disabled: "cursor-not-allowed text-muted-foreground/30 hover:bg-transparent",
                    hidden: "invisible",
                  }}
                />
              </div>

              <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Izabrani dan</p>
                <p className="mt-1 text-sm font-semibold capitalize text-foreground">{formatSelectedDate(selectedDate)}</p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <TimePicker label="Početak" value={startTime} onChange={setStartTime} />
                <TimePicker label="Kraj" value={endTime} onChange={setEndTime} />
              </div>

              <Button type="submit" disabled={saving || !selectedDate} className="mt-5 h-12 w-full bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {saving ? "Dodavanje..." : "Dodaj termin"}
              </Button>
            </form>

            <section className="min-w-0">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground sm:text-2xl"><Calendar className="h-5 w-5 text-primary" /> Slobodni termini</h2>
              {loading ? (
                <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-card/40 p-6 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Učitavanje...</div>
              ) : slots.length === 0 ? (
                <div className="rounded-xl border border-dashed border-primary/30 bg-card/40 p-6 text-sm text-muted-foreground sm:p-8">Nema kreiranih budućih termina.</div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {slots.map((slot) => (
                    <div key={slot.id} className="flex min-w-0 flex-col justify-between gap-4 rounded-xl border border-primary/20 bg-card/40 p-4 sm:p-5">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">{formatDateTime(slot.starts_at)}</p>
                        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="h-4 w-4 shrink-0" /> do {new Date(slot.ends_at).toLocaleTimeString("sr-RS", { hour: "2-digit", minute: "2-digit" })}</p>
                        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4 shrink-0" /> Prijavljenih: {slot.booking_count || 0}</p>
                      </div>
                      <Button variant="outline" className="h-10 w-full border-red-500/40 text-red-300 hover:bg-red-500/10 sm:w-auto" onClick={() => cancelSlot(slot.id)}><Trash2 className="mr-2 h-4 w-4" /> Otkaži</Button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="mt-10 sm:mt-12">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground sm:text-2xl"><Clock3 className="h-5 w-5 text-yellow-300" /> Zahtevi za odobrenje</h2>
            {pendingBookings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-primary/30 bg-card/40 p-6 text-sm text-muted-foreground sm:p-8">Nema zahteva koji čekaju odobrenje.</div>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {pendingBookings.map((booking) => (
                  <div key={booking.id} className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 sm:p-5">
                    <p className="font-semibold text-foreground">{booking.first_name} {booking.last_name}</p>
                    <p className="mt-1 break-all text-sm text-muted-foreground">{booking.email}</p>
                    <p className="mt-3 flex items-center gap-2 text-sm text-primary"><Calendar className="h-4 w-4" /> {formatDateTime(booking.starts_at)}</p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button disabled={busyBookingId === booking.id} onClick={() => reviewBooking(booking.id, "approve")} className="bg-green-600 text-white hover:bg-green-700"><CheckCircle2 className="mr-2 h-4 w-4" /> Prihvati</Button>
                      <Button disabled={busyBookingId === booking.id} onClick={() => reviewBooking(booking.id, "reject")} variant="outline" className="border-red-500/40 text-red-300 hover:bg-red-500/10"><XCircle className="mr-2 h-4 w-4" /> Odbij</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mt-10">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-foreground sm:text-2xl"><CheckCircle2 className="h-5 w-5 text-green-400" /> Potvrđeni treninzi</h2>
            {confirmedBookings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-primary/30 bg-card/40 p-6 text-sm text-muted-foreground sm:p-8">Nema budućih potvrđenih treninga.</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-primary/20 bg-card/40">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="border-b border-primary/20 text-muted-foreground"><tr><th className="p-4">Termin</th><th className="p-4">Član</th><th className="p-4">Email</th><th className="p-4">Status</th><th className="p-4">Akcija</th></tr></thead>
                  <tbody>
                    {confirmedBookings.map((booking) => <tr key={booking.id} className="border-b border-primary/10 last:border-0"><td className="p-4 text-foreground">{formatDateTime(booking.starts_at)}</td><td className="p-4 text-foreground">{booking.first_name} {booking.last_name}</td><td className="p-4 text-muted-foreground">{booking.email}</td><td className="p-4 text-green-400">Potvrđen</td><td className="p-4"><Button type="button" variant="outline" disabled={busyBookingId === booking.id} onClick={() => reviewBooking(booking.id, "cancel")} className="border-red-500/40 text-red-300 hover:bg-red-500/10"><Trash2 className="mr-2 h-4 w-4" /> Otkaži</Button></td></tr>)}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </AdminGuard>
  )
}
