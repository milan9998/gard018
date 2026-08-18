"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAdminStatus()
  }, [])

  async function checkAdminStatus() {
    try {
      const sessionResponse = await fetch("/api/auth/session")
      const sessionData = await sessionResponse.json()

      if (!sessionData.user) {
        router.push("/prijava")
        return
      }

      const adminResponse = await fetch("/api/auth/check-admin")
      const adminData = await adminResponse.json()

      if (!adminData.isAdmin) {
        router.push("/")
        return
      }

      setIsAdmin(true)
    } catch (error) {
      console.error("Error checking admin status:", error)
      router.push("/")
    } finally {
      setIsChecking(false)
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Provera pristupa...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return <>{children}</>
}
