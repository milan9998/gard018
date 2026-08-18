"use client"

import type React from "react"

import { useMemo, useState } from "react"
import { DayPicker } from "react-day-picker"
import { srLatn } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { UserPlus, AlertCircle, CalendarDays, CheckCircle, ChevronDown, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function AddMemberForm() {
  const [loading, setLoading] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [calendarOpen, setCalendarOpen] = useState(false)
  const tomorrow = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() + 1)
    return date
  }, [])

  const dateToISO = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const formatSelectedDate = (date: Date | undefined) =>
    date ? date.toLocaleDateString("sr-RS", { day: "2-digit", month: "2-digit", year: "numeric" }) : "Izaberi datum"

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setSubmitStatus("idle")
    setErrorMessage("")
    setSuccessMessage("")

    const formData = new FormData(e.currentTarget)

    const expiryDateISO = selectedDate ? dateToISO(selectedDate) : null

    if (!expiryDateISO) {
      setErrorMessage("Izaberite datum isteka u kalendaru")
      setSubmitStatus("error")
      setLoading(false)
      return
    }

    const data = {
      first_name: formData.get("firstName"),
      last_name: formData.get("lastName"),
      email: formData.get("email"),
      expiry_date: expiryDateISO,
      status: "active",
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const responseData = await response.json().catch(() => ({}))

      if (response.ok) {
        setSubmitStatus("success")
        setSuccessMessage(
          responseData.accountCreated
            ? `Član je dodat. Privremena lozinka: ${responseData.temporaryPassword}. Pri prvom ulasku mora da postavi svoju lozinku.`
            : responseData.message || "Član je uspešno dodat.",
        )
        ;(e.target as HTMLFormElement).reset()
        setSelectedDate(undefined)
        setCalendarOpen(false)

        if ((window as any).refreshMembers) {
          try {
            await (window as any).refreshMembers()
          } catch (refreshError) {
            console.error("[v0] Failed to refresh members list:", refreshError)
          }
        }
      } else {
        setErrorMessage(responseData.error || "Server greška")
        setSubmitStatus("error")
      }
    } catch (error) {
      console.error("[v0] Add member error:", error)

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          setErrorMessage("Zahtev je istekao. Proverite konekciju.")
        } else {
          setErrorMessage("Greška pri dodavanju člana. Pokušajte ponovo.")
        }
      } else {
        setErrorMessage("Neočekivana greška")
      }

      setSubmitStatus("error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="backdrop-blur-md bg-card/20 border border-primary/20 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <UserPlus className="w-6 h-6 text-primary" />
        Додај члана
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Име</label>
          <input
            type="text"
            name="firstName"
            required
            disabled={loading}
            className="w-full px-4 py-2 bg-background/50 border border-primary/20 rounded-lg text-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Презиме</label>
          <input
            type="text"
            name="lastName"
            required
            disabled={loading}
            className="w-full px-4 py-2 bg-background/50 border border-primary/20 rounded-lg text-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Email</label>
          <input
            type="email"
            name="email"
            required
            disabled={loading}
            className="w-full px-4 py-2 bg-background/50 border border-primary/20 rounded-lg text-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Датум истека чланарине</label>
          <button
            type="button"
            disabled={loading}
            onClick={() => setCalendarOpen((open) => !open)}
            aria-expanded={calendarOpen}
            className="flex h-12 w-full items-center justify-between rounded-lg border border-primary/25 bg-background/50 px-4 text-left text-foreground transition hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          >
            <span className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span className={selectedDate ? "font-semibold" : "text-muted-foreground"}>{formatSelectedDate(selectedDate)}</span>
            </span>
            <ChevronDown className={`h-4 w-4 transition ${calendarOpen ? "rotate-180" : ""}`} />
          </button>

          {calendarOpen && (
            <div className="mt-2 rounded-xl border border-primary/25 bg-background p-2 shadow-xl">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date)
                  if (date) setCalendarOpen(false)
                }}
                disabled={{ before: tomorrow }}
                defaultMonth={selectedDate || tomorrow}
                weekStartsOn={1}
                locale={srLatn}
                showOutsideDays
                fixedWeeks
                aria-label="Izbor datuma isteka članarine"
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
                  weekday: "w-full text-center text-[0.68rem] font-semibold uppercase text-muted-foreground",
                  week: "mt-1 flex w-full",
                  day: "relative w-full p-0 text-center",
                  day_button: "mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-sm text-foreground transition hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  selected: "bg-primary text-primary-foreground hover:bg-primary",
                  today: "font-bold ring-1 ring-primary/60 ring-inset",
                  outside: "text-muted-foreground/40",
                  disabled: "cursor-not-allowed text-muted-foreground/25 hover:bg-transparent",
                  hidden: "invisible",
                }}
              />
            </div>
          )}
          <p className="mt-1 text-xs text-muted-foreground">Kliknite i izaberite poslednji dan važenja članarine.</p>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Додавање...
            </span>
          ) : (
            "Додај члана"
          )}
        </Button>

        {submitStatus === "success" && (
          <Alert className="border-green-500/20 bg-green-500/10">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <AlertDescription className="text-green-500 font-medium">{successMessage || "Član je uspešno dodat!"}</AlertDescription>
          </Alert>
        )}

        {submitStatus === "error" && (
          <Alert className="border-red-500/20 bg-red-500/10">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <AlertDescription className="text-red-500 font-medium">
              {errorMessage || "Грешка при додавању члана"}
            </AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  )
}
