"use client"

import { useEffect, useRef, useState } from "react"
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser"
import { Camera, CheckCircle2, Keyboard, Loader2, RotateCcw, ScanLine, XCircle } from "lucide-react"

import { AdminGuard } from "@/components/admin/admin-guard"
import { AdminNavigation } from "@/components/admin/admin-navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type ScanResult = {
  allowed: boolean
  reason: string
  message: string
  checkedAt?: string
  member?: {
    id: number
    firstName: string
    lastName: string
    email: string
    expiryDate: string
  }
}

function formatDate(value?: string) {
  if (!value) return "—"
  const [year, month, day] = value.split("-")
  return year && month && day ? `${day}.${month}.${year}.` : value
}

export default function AdminQrSkenerPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const scanLockedRef = useRef(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [checking, setChecking] = useState(false)
  const [cameraError, setCameraError] = useState("")
  const [result, setResult] = useState<ScanResult | null>(null)
  const [manualCode, setManualCode] = useState("")

  const stopCamera = () => {
    controlsRef.current?.stop()
    controlsRef.current = null
    setCameraActive(false)
  }

  useEffect(() => stopCamera, [])

  const verifyCode = async (code: string) => {
    if (!code || scanLockedRef.current) return
    scanLockedRef.current = true
    stopCamera()
    setChecking(true)
    setCameraError("")

    try {
      const response = await fetch("/api/admin/qr-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
      const payload = await response.json().catch(() => ({ allowed: false, reason: "server_error", message: "Provera trenutno nije moguća" }))
      setResult(payload)
      if (typeof navigator.vibrate === "function") navigator.vibrate(payload.allowed ? 120 : [180, 80, 180])
    } catch {
      setResult({ allowed: false, reason: "network_error", message: "Provera trenutno nije moguća" })
    } finally {
      setChecking(false)
    }
  }

  const startCamera = async () => {
    stopCamera()
    setResult(null)
    setCameraError("")
    scanLockedRef.current = false

    try {
      const reader = new BrowserQRCodeReader(undefined, {
        delayBetweenScanAttempts: 150,
        delayBetweenScanSuccess: 800,
      })
      const controls = await reader.decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        videoRef.current ?? undefined,
        (decoded, _error, callbackControls) => {
          if (decoded) {
            callbackControls.stop()
            controlsRef.current = null
            setCameraActive(false)
            void verifyCode(decoded.getText())
          }
        },
      )
      if (scanLockedRef.current) {
        controls.stop()
        return
      }
      controlsRef.current = controls
      setCameraActive(true)
    } catch (error) {
      console.error("[GARD018] Camera start failed:", error)
      setCameraError("Kamera nije dostupna. Dozvoli pristup kameri ili unesi kod ručno.")
      setCameraActive(false)
    }
  }

  const scanNext = () => {
    setResult(null)
    setManualCode("")
    scanLockedRef.current = false
    void startCamera()
  }

  return (
    <AdminGuard>
      <main className="min-h-screen bg-background px-3 pb-16 pt-20 sm:px-6 sm:pt-24 lg:px-8">
        <AdminNavigation />
        <div className="mx-auto max-w-5xl">
          <header className="mb-6 sm:mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              <ScanLine className="h-4 w-4" /> Admin · redovni treninzi
            </div>
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">QR skener članarina</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Skeniraj članski QR kod. Zelena potvrda znači da član sme na redovni trening; crvena znači da je članarina istekla.
            </p>
          </header>

          {!result && !checking && (
            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <section className="overflow-hidden rounded-2xl border border-primary/25 bg-card/60">
                <div className="relative aspect-[3/4] max-h-[68vh] min-h-[360px] bg-black sm:aspect-video">
                  <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
                  {!cameraActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                      <Camera className="mb-4 h-14 w-14 text-primary" />
                      <p className="text-lg font-bold text-white">Kamera je spremna za pokretanje</p>
                      <p className="mt-2 max-w-sm text-sm text-zinc-300">Na telefonu će se koristiti zadnja kamera. Potrebno je da dozvoliš pristup.</p>
                    </div>
                  )}
                  {cameraActive && (
                    <div className="pointer-events-none absolute inset-[12%] rounded-3xl border-4 border-white/90 shadow-[0_0_0_999px_rgba(0,0,0,0.25)]">
                      <span className="absolute left-1/2 top-1/2 h-0.5 w-4/5 -translate-x-1/2 bg-primary shadow-[0_0_12px_rgba(220,38,70,0.9)]" />
                    </div>
                  )}
                </div>
                <div className="p-4 sm:p-5">
                  <Button type="button" onClick={cameraActive ? stopCamera : startCamera} className="h-12 w-full bg-primary text-base font-bold text-primary-foreground">
                    <Camera className="mr-2 h-5 w-5" /> {cameraActive ? "Zaustavi kameru" : "Pokreni kameru"}
                  </Button>
                  {cameraError && <p className="mt-3 text-sm font-medium text-red-300" role="alert">{cameraError}</p>}
                </div>
              </section>

              <aside className="rounded-2xl border border-primary/20 bg-card/50 p-4 sm:p-5">
                <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><Keyboard className="h-5 w-5 text-primary" /> Ručna provera</h2>
                <p className="mt-2 text-sm text-muted-foreground">Koristi samo ako kamera nije dostupna.</p>
                <Input value={manualCode} onChange={(event) => setManualCode(event.target.value)} placeholder="Nalepi QR sadržaj" className="mt-4 h-11 bg-background" />
                <Button type="button" variant="outline" disabled={!manualCode.trim()} onClick={() => void verifyCode(manualCode.trim())} className="mt-3 h-11 w-full border-primary/30">
                  Proveri kod
                </Button>
              </aside>
            </div>
          )}

          {checking && (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-primary/30 bg-card/70 text-foreground">
              <Loader2 className="mb-4 h-14 w-14 animate-spin text-primary" />
              <p className="text-xl font-bold">Provera članarine...</p>
            </div>
          )}

          {!checking && result && (
            <section className={`flex min-h-[480px] flex-col items-center justify-center rounded-3xl border-2 px-5 py-10 text-center shadow-2xl ${result.allowed ? "border-green-400 bg-green-500/15 shadow-green-950/50" : "border-red-400 bg-red-500/15 shadow-red-950/50"}`} role="status" aria-live="assertive">
              {result.allowed ? <CheckCircle2 className="h-24 w-24 text-green-400" /> : <XCircle className="h-24 w-24 text-red-400" />}
              <p className={`mt-5 text-3xl font-black sm:text-5xl ${result.allowed ? "text-green-300" : "text-red-300"}`}>
                {result.allowed ? "MOŽE DA TRENIRA" : "NE MOŽE DA TRENIRA"}
              </p>
              <p className="mt-4 text-xl font-bold text-foreground sm:text-2xl">
                {result.member ? `${result.member.firstName} ${result.member.lastName}` : result.message}
              </p>
              {result.member && (
                <div className="mt-5 rounded-2xl bg-black/30 px-6 py-4 text-foreground">
                  <p>{result.member.email}</p>
                  <p className="mt-1 font-bold">Članarina važi do {formatDate(result.member.expiryDate)}</p>
                </div>
              )}
              {!result.allowed && result.member && <p className="mt-4 text-lg font-semibold text-red-200">Članarina je istekla.</p>}
              <Button type="button" onClick={scanNext} className="mt-8 h-14 min-w-64 bg-primary px-8 text-lg font-bold text-primary-foreground">
                <RotateCcw className="mr-2 h-5 w-5" /> Skeniraj sledećeg
              </Button>
            </section>
          )}
        </div>
      </main>
    </AdminGuard>
  )
}
