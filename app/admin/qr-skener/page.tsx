"use client"

import { useEffect, useRef, useState } from "react"
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser"
import { Camera, CheckCircle2, Keyboard, Loader2, RotateCcw, ScanLine, XCircle } from "lucide-react"

import { AdminGuard } from "@/components/admin/admin-guard"
import { AdminNavigation } from "@/components/admin/admin-navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

type ScanResult = {
  allowed: boolean
  reason: string
  message: string
  checkedAt?: string
  checkInId?: string
  attendanceRecorded?: boolean
  alreadyRecorded?: boolean
  member?: {
    id: number
    firstName: string
    lastName: string
    email: string
    expiryDate: string | null
    membershipConfigured: boolean
    hasDebt?: boolean
  }
}

function formatDate(value?: string) {
  if (!value) return "—"
  const [year, month, day] = value.split("-")
  return year && month && day ? `${day}.${month}.${year}.` : value
}

export default function AdminQrSkenerPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const usbInputRef = useRef<HTMLInputElement | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const scanLockedRef = useRef(false)
  // Every camera start gets a new generation. This prevents an older
  // decodeFromConstraints promise from taking control back after "next scan".
  const cameraGenerationRef = useRef(0)
  const [cameraActive, setCameraActive] = useState(false)
  const [scanMode, setScanMode] = useState<"camera" | "usb">("camera")
  const [usbActive, setUsbActive] = useState(false)
  const [usbCode, setUsbCode] = useState("")
  const [cameraStarting, setCameraStarting] = useState(false)
  const [checking, setChecking] = useState(false)
  const [cameraError, setCameraError] = useState("")
  const [result, setResult] = useState<ScanResult | null>(null)
  const [manualCode, setManualCode] = useState("")
  const [approvalOpen, setApprovalOpen] = useState(false)
  const [approving, setApproving] = useState(false)
  const [approvalError, setApprovalError] = useState("")

  const stopCamera = () => {
    cameraGenerationRef.current += 1
    controlsRef.current?.stop()
    controlsRef.current = null
    setCameraActive(false)
    setCameraStarting(false)
  }

  useEffect(() => stopCamera, [])

  useEffect(() => {
    if (usbActive && !checking && !result) usbInputRef.current?.focus()
  }, [usbActive, checking, result])

  const verifyCode = async (code: string) => {
    if (!code || scanLockedRef.current) return
    scanLockedRef.current = true
    stopCamera()
    setUsbActive(false)
    setUsbCode("")
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
      if (response.ok && !payload.allowed && payload.member && payload.checkInId && !payload.alreadyRecorded) {
        setApprovalOpen(true)
      }
      if (typeof navigator.vibrate === "function") navigator.vibrate(payload.allowed ? 120 : [180, 80, 180])
    } catch {
      setResult({ allowed: false, reason: "network_error", message: "Provera trenutno nije moguća" })
    } finally {
      setChecking(false)
    }
  }

  const startCamera = async () => {
    setScanMode("camera")
    setUsbActive(false)
    setUsbCode("")
    const generation = cameraGenerationRef.current + 1
    cameraGenerationRef.current = generation
    controlsRef.current?.stop()
    controlsRef.current = null
    setCameraActive(false)
    setCameraStarting(true)
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
          if (generation !== cameraGenerationRef.current) {
            callbackControls.stop()
            return
          }

          if (decoded) {
            callbackControls.stop()
            if (controlsRef.current === callbackControls) controlsRef.current = null
            setCameraActive(false)
            void verifyCode(decoded.getText())
          }
        },
      )
      if (generation !== cameraGenerationRef.current || scanLockedRef.current) {
        controls.stop()
        return
      }
      controlsRef.current = controls
      setCameraActive(true)
      setCameraStarting(false)
    } catch (error) {
      console.error("[GARD018] Camera start failed:", error)
      if (generation === cameraGenerationRef.current) {
        setCameraError("Kamera nije dostupna. Dozvoli pristup kameri ili unesi kod ručno.")
        setCameraActive(false)
        setCameraStarting(false)
      }
    }
  }

  const startUsbScanner = () => {
    stopCamera()
    setScanMode("usb")
    setUsbCode("")
    setUsbActive(true)
    setResult(null)
    setCameraError("")
    scanLockedRef.current = false
  }

  const scanNext = () => {
    stopCamera()
    setResult(null)
    setManualCode("")
    setApprovalOpen(false)
    setApprovalError("")
    scanLockedRef.current = false
    if (scanMode === "usb") startUsbScanner()
    else void startCamera()
  }

  const allowTraining = async () => {
    if (!result?.checkInId || approving) return
    setApproving(true)
    setApprovalError("")
    try {
      const response = await fetch("/api/admin/qr-scan/allow-training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkInId: result.checkInId }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || "Trening nije evidentiran")
      setResult((current) => current ? {
        ...current,
        attendanceRecorded: payload.attendanceRecorded,
        alreadyRecorded: payload.alreadyRecorded,
        member: current.member ? { ...current.member, hasDebt: true, membershipConfigured: true,
          expiryDate: payload.expiryDate || current.member.expiryDate } : current.member,
      } : current)
      setApprovalOpen(false)
    } catch (error) {
      setApprovalError(error instanceof Error ? error.message : "Trening nije evidentiran")
    } finally {
      setApproving(false)
    }
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
              Skeniraj članski QR kod. Zeleni rezultat znači da je članarina plaćena, a crveni da nije plaćena ili nije podešena.
            </p>
          </header>

          {!checking && (
            <div
              className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"
              style={{ display: result ? "none" : "grid" }}
            >
              <section className="overflow-hidden rounded-2xl border border-primary/25 bg-card/60">
                <div className="relative aspect-[3/4] max-h-[68vh] min-h-[360px] bg-black sm:aspect-video">
                  <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
                  {cameraStarting && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 px-6 text-center">
                      <Loader2 className="mb-4 h-14 w-14 animate-spin text-primary" />
                      <p className="text-lg font-bold text-white">Pokretanje kamere...</p>
                      <p className="mt-2 max-w-sm text-sm text-zinc-300">Sačekaj trenutak, pripremamo skener.</p>
                    </div>
                  )}
                  {scanMode === "usb" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                      <ScanLine className="mb-4 h-14 w-14 text-primary" />
                      <p className="text-lg font-bold text-white">{usbActive ? "USB QR skener je spreman" : "USB QR skener je zaustavljen"}</p>
                      <p className="mt-2 max-w-sm text-sm text-zinc-300">Poveži skener sa laptopom, pa očitaj QR kod člana. Skener treba da pošalje Enter posle koda.</p>
                      {usbActive && (
                        <form className="mt-5 w-full max-w-sm" onSubmit={(event) => {
                          event.preventDefault()
                          if (usbCode.trim()) void verifyCode(usbCode.trim())
                        }}>
                          <label htmlFor="usb-qr-code" className="text-sm text-zinc-300">Kod sa USB skenera</label>
                          <Input ref={usbInputRef} id="usb-qr-code" value={usbCode} onChange={(event) => setUsbCode(event.target.value)} autoComplete="off" spellCheck={false} placeholder="Čekam očitavanje QR koda…" className="mt-2 h-12 bg-background text-foreground" />
                          <p className="mt-2 text-xs text-zinc-300">Ako si kliknuo van ovog polja, klikni u njega pre narednog očitavanja.</p>
                        </form>
                      )}
                    </div>
                  )}
                  {scanMode === "camera" && !cameraActive && !cameraStarting && (
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
                  <Button type="button" disabled={cameraStarting} onClick={cameraActive ? stopCamera : startCamera} className="h-12 w-full bg-primary text-base font-bold text-primary-foreground disabled:opacity-70">
                    {cameraStarting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Camera className="mr-2 h-5 w-5" />} {cameraStarting ? "Pokretanje kamere..." : cameraActive ? "Zaustavi kameru" : "Skeniraj kamerom"}
                  </Button>
                  <Button type="button" variant="outline" onClick={usbActive ? () => { setUsbActive(false); setUsbCode("") } : startUsbScanner} className="mt-3 h-12 w-full border-primary/30 text-base font-bold">
                    <ScanLine className="mr-2 h-5 w-5" /> {usbActive ? "Zaustavi USB QR skener" : "Pokreni USB QR skener"}
                  </Button>
                  <p className={`mt-3 flex items-center justify-center gap-2 text-sm font-semibold ${cameraActive || usbActive ? "text-green-400" : "text-muted-foreground"}`} aria-live="polite">
                    <span className={`h-2.5 w-2.5 rounded-full ${cameraActive || usbActive ? "bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.9)]" : "bg-muted-foreground/50"}`} />
                    {usbActive ? "USB skener je aktivan — očitaj QR kod člana" : cameraActive ? "Kamera je aktivna — usmeri QR kod u okvir" : cameraStarting ? "Kamera se uključuje..." : "Izaberi način skeniranja"}
                  </p>
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
                {result.allowed ? "ČLANARINA JE PLAĆENA" : result.member?.hasDebt ? "DUGOVANJE" : "ČLANARINA NIJE PLAĆENA"}
              </p>
              <p className="mt-4 text-xl font-bold text-foreground sm:text-2xl">
                {result.member ? `${result.member.firstName} ${result.member.lastName}` : result.message}
              </p>
              {result.member && (
                <div className="mt-5 rounded-2xl bg-black/30 px-6 py-4 text-foreground">
                  <p>{result.member.email}</p>
                  <p className="mt-1 font-bold">
                    {result.member.membershipConfigured
                      ? `Članarina važi do ${formatDate(result.member.expiryDate || undefined)}`
                      : "Članarina nije podešena"}
                  </p>
                </div>
              )}
              {result.member?.hasDebt && <p className="mt-3 flex items-center gap-2 font-bold text-yellow-300"><XCircle className="h-5 w-5" /> Dugovanje — uplata nije potvrđena.</p>}
              {result.attendanceRecorded && (
                <p className="mt-5 text-sm font-semibold text-green-200">
                  {result.allowed ? "Trening je evidentiran za danas." : "Dozvoljeni trening je evidentiran kao prekoračenje."}
                </p>
              )}
              {result.alreadyRecorded && (
                <p className="mt-5 text-sm font-semibold text-yellow-200">Trening je već evidentiran za danas. Broj dolazaka nije uvećan.</p>
              )}
              {!result.allowed && result.member && result.checkInId && !result.attendanceRecorded && !result.alreadyRecorded && (
                <Button type="button" variant="outline" onClick={() => setApprovalOpen(true)} className="mt-6 h-12 border-primary/40">
                  Dozvoli trening
                </Button>
              )}
              <Button type="button" onClick={scanNext} className="mt-8 h-14 min-w-64 bg-primary px-8 text-lg font-bold text-primary-foreground">
                <RotateCcw className="mr-2 h-5 w-5" /> Skeniraj sledećeg
              </Button>
            </section>
          )}
        </div>
        <Dialog open={approvalOpen} onOpenChange={(open) => { if (!approving) setApprovalOpen(open) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dozvoli trening bez potvrđene uplate?</DialogTitle>
              <DialogDescription>
                {result?.member ? `${result.member.firstName} ${result.member.lastName}` : "Ovaj član"} nema potvrđenu uplatu. Ako dozvoliš, trening se beleži kao prekoračenje. Ako je period istekao, novi mesec počinje danas uz oznaku dugovanja.
              </DialogDescription>
            </DialogHeader>
            {approvalError && <p className="text-sm text-red-300" role="alert">{approvalError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={approving} onClick={() => setApprovalOpen(false)}>Ne dozvoli</Button>
              <Button type="button" disabled={approving} onClick={() => void allowTraining()}>
                {approving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Dozvoli trening
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </AdminGuard>
  )
}
