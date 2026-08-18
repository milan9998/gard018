"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings, UserIcon, Users, Shield, MessageSquare, Calendar, CalendarDays, AlertCircle, QrCode, ScanLine } from "lucide-react"

type User = {
  email: string
  name: string
  image: string
}

type Membership = {
  id: number
  first_name: string
  last_name: string
  email: string
  start_date: string
  expiry_date: string
  status: string
}

export function UserNav({ showAdminShortcut = true }: { showAdminShortcut?: boolean }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [membership, setMembership] = useState<Membership | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        console.log("[v0] Fetching session data...")

        const sessionResponse = await fetch("/api/auth/session")
        console.log("[v0] Session response status:", sessionResponse.status)
        console.log("[v0] Session response Content-Type:", sessionResponse.headers.get("Content-Type"))

        // Check if response is actually JSON
        const contentType = sessionResponse.headers.get("Content-Type")
        if (!contentType || !contentType.includes("application/json")) {
          console.error("[v0] Session endpoint returned non-JSON response")
          setIsLoading(false)
          return
        }

        const sessionData = await sessionResponse.json()
        console.log("[v0] Session data:", sessionData)

        const [adminData, membershipData] = await Promise.all([
          fetch("/api/auth/check-admin")
            .then((res) => res.json())
            .catch(() => ({ isAdmin: false })),
          fetch("/api/members/by-email")
            .then((res) => res.json())
            .catch(() => ({ membership: null })),
        ])

        setUser(sessionData.user || null)
        setIsAdmin(adminData.isAdmin || false)
        setMembership(membershipData.membership || null)
        setIsLoading(false)
      } catch (error) {
        console.error("[v0] Session fetch error:", error)
        setUser(null)
        setIsAdmin(false)
        setMembership(null)
        setIsLoading(false)
      }
    }

    fetchSessionData()
  }, [])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
    window.location.href = "/"
  }

  const getDaysUntilExpiry = () => {
    if (!membership || !membership.expiry_date) return null
    const today = new Date()
    const expiry = new Date(membership.expiry_date)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysLeft = getDaysUntilExpiry()
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0
  const isExpired = daysLeft !== null && daysLeft < 0

  if (isLoading) {
    return <div className="w-10 h-10" />
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/prijava"
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
        >
          Prijava
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link
          href="/registracija"
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
        >
          Registracija
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {isAdmin && showAdminShortcut && (
        <Link href="/admin" className="inline-flex h-10 items-center gap-2 rounded-lg border border-primary/35 bg-primary/10 px-3 text-sm font-semibold text-primary transition hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" title="Otvori admin panel">
          <Shield className="h-4 w-4" />
          <span>Admin</span>
        </Link>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger className="focus:outline-none">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-primary hover:border-primary/70 transition-colors">
          {user.image ? (
            <Image src={user.image || "/placeholder.svg"} alt={user.name || "User"} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-primary flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
          {(isExpiringSoon || isExpired) && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-background flex items-center justify-center">
              <AlertCircle className="w-3 h-3 text-white" />
            </div>
          )}
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-zinc-400">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          Podešavanja
        </DropdownMenuItem>
        {!isAdmin && (
          <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/individualni-treninzi")}>
            <Calendar className="mr-2 h-4 w-4" />
            Individualni treninzi
          </DropdownMenuItem>
        )}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/admin")}>
              <Users className="mr-2 h-4 w-4" />
              Pregled članarina
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/admin/messages")}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Poruke korisnika
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/admin/qr-skener")}>
              <ScanLine className="mr-2 h-4 w-4" />
              QR skener
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/admin/nedeljni-treninzi")}>
              <CalendarDays className="mr-2 h-4 w-4" />
              Nedeljni treninzi
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/admin/individualni-treninzi")}>
              <Calendar className="mr-2 h-4 w-4" />
              Individualni termini
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/admin/manage-admins")}>
              <Shield className="mr-2 h-4 w-4" />
              Upravljaj adminima
            </DropdownMenuItem>
          </>
        )}
        {membership && (
          <>
            <DropdownMenuSeparator />
            <button type="button" onClick={() => router.push("/moj-qr")} className="w-full rounded-md px-2 py-3 text-left transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <div className="flex items-start gap-2 text-xs">
                <QrCode className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-white">Članarina</p>
                  {isExpired ? (
                    <p className="text-red-500 font-semibold mt-1">Istekla!</p>
                  ) : isExpiringSoon ? (
                    <p className="text-yellow-500 font-semibold mt-1">
                      Ističe za {daysLeft} {daysLeft === 1 ? "dan" : "dana"}
                    </p>
                  ) : daysLeft !== null ? (
                    <p className="text-zinc-400 mt-1">
                      Ističe {new Date(membership.expiry_date).toLocaleDateString("sr-RS")}
                    </p>
                  ) : (
                    <p className="text-zinc-400 mt-1">Nema podataka</p>
                  )}
                  <p className="mt-2 font-semibold text-primary">Prikaži moj QR kod</p>
                </div>
              </div>
            </button>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Odjavi se
        </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
