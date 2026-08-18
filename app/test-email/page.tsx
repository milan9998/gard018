"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function TestEmailPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [testEmail, setTestEmail] = useState("")

  const sendTestEmail = async () => {
    if (!testEmail) {
      alert("Unesite email adresu")
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#1a0a0a] to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-black/50 backdrop-blur-sm border border-[#8f1528]/30 rounded-lg p-8">
        <h1 className="text-2xl font-bold text-[#8f1528] mb-6">Test Email</h1>

        <div className="space-y-4">
          <div>
            <Input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Unesite email adresu"
              className="bg-black/50 border-[#8f1528]/30 text-white"
              disabled={loading}
            />
          </div>

          <Button
            onClick={sendTestEmail}
            disabled={loading || !testEmail}
            className="w-full bg-[#8f1528] hover:bg-[#8f1528]/80"
          >
            {loading ? "Šalje se..." : "Pošalji test email"}
          </Button>

          {loading && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#8f1528] mb-4"></div>
              <p className="text-gray-400">Šaljem test email na {testEmail}...</p>
            </div>
          )}

          {result && (
            <div
              className={`p-4 rounded-lg ${result.success ? "bg-green-900/20 border border-green-500/30" : "bg-red-900/20 border border-red-500/30"}`}
            >
              <p className={`text-sm font-semibold mb-2 ${result.success ? "text-green-400" : "text-red-400"}`}>
                {result.success ? "✅ Email uspešno poslat!" : `❌ Greška pri slanju`}
              </p>
              <p className="text-xs text-gray-400">Email: {testEmail}</p>
              {result.error && <p className="text-xs text-red-400 mt-2">{result.error}</p>}
              {result.data && (
                <pre className="text-xs text-gray-400 mt-2 overflow-auto max-h-40">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              )}
            </div>
          )}

          <Button onClick={() => (window.location.href = "/")} variant="outline" className="w-full">
            Povratak na početnu
          </Button>
        </div>
      </div>
    </div>
  )
}
