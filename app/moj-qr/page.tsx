"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2, QrCode, XCircle } from "lucide-react"
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

  useEffect(() => {
    const loadQr = async () => {
      try {
        const response = await fetch("/api/member-qr", { cache: "no-store" })
        const payload = await response.json().catch(() => ({}))
        if (response.status === 401) {
          router.replace("/prijava")
          return
        }
        if (!response.ok) throw new Error(payload.error || "QR kod nije dostupan")
        setData(payload)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "QR kod nije dostupan")
      } finally {
        setLoading(false)
      }
    }

    void loadQr()
  }, [router])

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-6 sm:py-10">
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

              <div className="mx-auto mt-5 aspect-square w-full max-w-[320px] rounded-3xl bg-white p-4 shadow-xl sm:p-5">
                <QRCodeSVG
                  value={data.qrValue}
                  title={`QR kod člana ${data.member.firstName} ${data.member.lastName}`}
                  size={1024}
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#000000"
                  className="h-full w-full"
                />
              </div>

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
    </main>
  )
}
