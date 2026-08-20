"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2, Maximize2, QrCode, X, XCircle } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

import { UserPageNavigation } from "@/components/user-page-navigation"

type QrData = {
  qrValue: string
  member: {
    id: number
    firstName: string
    lastName: string
    expiryDate: string | null
    allowed: boolean
    membershipConfigured: boolean
  }
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-")
  return year && month && day ? `${day}.${month}.${year}.` : value
}

export default function MojQrPage() {
  const router = useRouter()
  const [data, setData] = useState<QrData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showFullScreenQr, setShowFullScreenQr] = useState(false)
  const hasDataRef = useRef(false)

  useEffect(() => {
    let active = true
    const loadQr = async (showLoading: boolean) => {
      if (showLoading) setLoading(true)
      try {
        const response = await fetch("/api/member-qr", { cache: "no-store" })
        const payload = await response.json().catch(() => ({}))
        if (response.status === 401) {
          if (active) router.replace("/prijava")
          return
        }
        if (!response.ok) throw new Error(payload.error || "QR kod nije dostupan")
        if (active) {
          setData(payload)
          hasDataRef.current = true
          setError("")
        }
      } catch (loadError) {
        if (active && !hasDataRef.current) {
          setError(loadError instanceof Error ? loadError.message : "QR kod nije dostupan")
        }
      } finally {
        if (active && showLoading) setLoading(false)
      }
    }

    void loadQr(true)
    const refresh = () => {
      if (active && document.visibilityState === "visible") void loadQr(false)
    }
    const interval = window.setInterval(refresh, 10000)
    document.addEventListener("visibilitychange", refresh)
    return () => {
      active = false
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", refresh)
    }
  }, [router])

  useEffect(() => {
    if (!showFullScreenQr) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowFullScreenQr(false)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [showFullScreenQr])

  return (
    <main className="flex min-h-dvh items-center justify-center overflow-x-hidden bg-background px-4 py-6 sm:py-10">
      <div className="w-full max-w-md">
        <UserPageNavigation />

        <section className="overflow-hidden rounded-3xl border border-primary/30 bg-card/80 shadow-2xl shadow-black/40">
          <header className="border-b border-primary/20 bg-primary/10 px-5 py-5 text-center">
            <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <QrCode className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Moj QR kod</h1>
            <p className="mt-1 text-sm text-muted-foreground">Pokaži ovaj ekran treneru na ulazu.</p>
          </header>

          {loading && (
            <div className="flex min-h-[420px] items-center justify-center text-foreground">
              <Loader2 className="mr-3 h-7 w-7 animate-spin text-primary" /> Učitavanje QR koda...
            </div>
          )}

          {!loading && error && (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
              <XCircle className="mb-4 h-12 w-12 text-red-400" />
              <p className="text-lg font-semibold text-foreground">QR kod nije dostupan</p>
              <p className="mt-2 text-sm text-red-300">{error}</p>
            </div>
          )}

          {!loading && data && (
            <div className="px-5 py-6 text-center sm:px-7">
              <p className="text-xl font-bold text-foreground">{data.member.firstName} {data.member.lastName}</p>

              <div className="mx-auto mt-5 box-border aspect-square w-[min(80vw,300px)] max-w-full overflow-hidden rounded-3xl bg-white p-3 shadow-xl sm:w-[min(70vw,340px)] sm:p-5">
                <QRCodeSVG
                  value={data.qrValue}
                  title={`QR kod člana ${data.member.firstName} ${data.member.lastName}`}
                  size={1024}
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#000000"
                  className="block h-full w-full"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowFullScreenQr(true)}
                className="mx-auto mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Maximize2 className="h-4 w-4" />
                Prikaži QR preko celog ekrana
              </button>

              <div className={`mt-5 rounded-2xl border p-4 ${data.member.allowed ? "border-green-500/40 bg-green-500/10" : "border-red-500/40 bg-red-500/10"}`}>
                <p className={`flex items-center justify-center gap-2 text-base font-bold ${data.member.allowed ? "text-green-300" : "text-red-300"}`}>
                  {data.member.allowed ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  {data.member.allowed
                    ? "Članarina važi"
                    : data.member.membershipConfigured
                      ? "Članarina je istekla"
                      : "Članarina nije podešena"}
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {data.member.membershipConfigured
                    ? `Važi do ${formatDate(data.member.expiryDate || "")}`
                    : "Admin još nije uneo datum važenja članarine."}
                </p>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                QR samo identifikuje tvoj nalog. Trenerov skener uvek proverava trenutno stanje članarine u bazi.
              </p>
            </div>
          )}
        </section>
      </div>

      {showFullScreenQr && data && (
        <div
          className="fixed inset-0 z-50 flex min-h-dvh items-center justify-center overflow-y-auto bg-black/95 p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="QR kod preko celog ekrana"
        >
          <div className="flex min-h-[calc(100dvh-2rem)] w-full flex-col items-center justify-center gap-4 text-center sm:min-h-[calc(100dvh-3rem)]">
            <div className="flex w-full max-w-xl items-center justify-between gap-4">
              <p className="text-left text-lg font-bold text-white">{data.member.firstName} {data.member.lastName}</p>
              <button
                type="button"
                onClick={() => setShowFullScreenQr(false)}
                aria-label="Zatvori QR prikaz"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/30 text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div
              className="box-border aspect-square max-w-full overflow-hidden rounded-2xl bg-white p-3 shadow-2xl shadow-black sm:p-5"
              style={{ width: "min(92vw, 78dvh, 440px)" }}
            >
              <QRCodeSVG
                value={data.qrValue}
                title={`QR kod člana ${data.member.firstName} ${data.member.lastName}`}
                size={1024}
                level="H"
                bgColor="#ffffff"
                fgColor="#000000"
                className="block h-full w-full"
              />
            </div>

            <p className={`text-lg font-bold ${data.member.allowed ? "text-green-300" : "text-red-300"}`}>
              {data.member.allowed ? "Članarina važi" : "Članarina nije plaćena"}
            </p>
            <p className="max-w-md text-sm text-zinc-300">Drži ovaj ekran otvoren dok trener skenira kod.</p>
          </div>
        </div>
      )}
    </main>
  )
}
