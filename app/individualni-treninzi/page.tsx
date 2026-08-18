"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar, CheckCircle2, Clock, Loader2, LogIn, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserPageNavigation } from "@/components/user-page-navigation"

type Slot = {
  id: number
  starts_at: string
  ends_at: string
  booking_count: number
  my_booking_id: number | null
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("sr-RS", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function IndividualniTreninziPage() {
  const router = useRouter()
  const [slots, setSlots] = useState<Slot[]>([])
  const [checkingRole, setCheckingRole] = useState(true)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [requiresLogin, setRequiresLogin] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)

  const loadSlots = async () => {
    setLoading(true)
    setMessage("")
    try {
      const response = await fetch("/api/individual-trainings/slots", { cache: "no-store" })
      const data = await response.json().catch(() => ({}))
      if (response.status === 401) {
        setRequiresLogin(true)
        return
      }
      if (!response.ok) throw new Error(data.error || "Greška pri učitavanju termina")
      setSlots(data.slots || [])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Greška pri učitavanju termina")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    const initialize = async () => {
      let shouldLoadMemberView = true
      try {
        const response = await fetch("/api/auth/check-admin", { cache: "no-store" })
        const data = await response.json().catch(() => ({ isAdmin: false }))
        if (data.isAdmin) {
          shouldLoadMemberView = false
          router.replace("/admin/individualni-treninzi")
          return
        }
      } finally {
        if (active && shouldLoadMemberView) {
          setCheckingRole(false)
          await loadSlots()
        }
      }
    }

    void initialize()
    return () => {
      active = false
    }
  }, [router])

  const reserve = async (slotId: number) => {
    setBusyId(slotId)
    setMessage("")
    try {
      const response = await fetch("/api/individual-trainings/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Rezervacija nije uspela")
      await loadSlots()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Rezervacija nije uspela")
    } finally {
      setBusyId(null)
    }
  }

  const cancel = async (bookingId: number, slotId: number) => {
    setBusyId(slotId)
    setMessage("")
    try {
      const response = await fetch("/api/individual-trainings/bookings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Otkazivanje nije uspelo")
      await loadSlots()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Otkazivanje nije uspelo")
    } finally {
      setBusyId(null)
    }
  }

  if (checkingRole) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground"><Loader2 className="mr-3 h-6 w-6 animate-spin" /> Provera pristupa...</div>
  }

  return (
    <main className="min-h-screen bg-background px-4 py-24">
      <div className="mx-auto max-w-4xl">
        <UserPageNavigation />
        <div className="mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary">
            <Calendar className="h-4 w-4" />
            Individualni treninzi
          </div>
          <h1 className="text-4xl font-bold text-foreground md:text-5xl">Rezerviši svoj termin</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Termine mogu da rezervišu samo prijavljeni članovi kojima je admin označio da je individualni trening plaćen.
          </p>
        </div>

        {requiresLogin && (
          <div className="rounded-lg border border-primary/20 bg-card/40 p-8 text-center">
            <LogIn className="mx-auto mb-4 h-10 w-10 text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">Prijavite se da vidite termine</h2>
            <p className="mt-2 text-muted-foreground">Posle prijave sistem proverava vaše pravo na individualni trening.</p>
            <Link href="/prijava">
              <Button className="mt-6 bg-primary text-primary-foreground">Prijavi se</Button>
            </Link>
          </div>
        )}

        {!requiresLogin && message && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            <XCircle className="h-5 w-5 shrink-0" />
            {message}
          </div>
        )}

        {!requiresLogin && loading && (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-3 h-6 w-6 animate-spin" /> Učitavanje termina...
          </div>
        )}

        {!requiresLogin && !loading && slots.length === 0 && (
          <div className="rounded-lg border border-primary/20 bg-card/40 p-10 text-center text-muted-foreground">
            Trenutno nema slobodnih individualnih termina.
          </div>
        )}

        {!requiresLogin && !loading && slots.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {slots.map((slot) => {
              const isBooked = Boolean(slot.my_booking_id)
              return (
                <div key={slot.id} className="rounded-lg border border-primary/20 bg-card/40 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold capitalize text-foreground">{formatDateTime(slot.starts_at)}</p>
                      <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 text-primary" />
                        Do {new Date(slot.ends_at).toLocaleTimeString("sr-RS", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">{slot.booking_count} prijavljenih</span>
                  </div>

                  {isBooked ? (
                    <Button
                      variant="outline"
                      className="mt-6 w-full border-green-500/40 text-green-400 hover:bg-green-500/10"
                      disabled={busyId === slot.id}
                      onClick={() => cancel(slot.my_booking_id!, slot.id)}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {busyId === slot.id ? "Čuvanje..." : "Rezervisano — otkaži"}
                    </Button>
                  ) : (
                    <Button
                      className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      disabled={busyId === slot.id}
                      onClick={() => reserve(slot.id)}
                    >
                      {busyId === slot.id ? "Rezervisanje..." : "Rezerviši termin"}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
