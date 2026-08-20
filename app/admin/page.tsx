"use client"

import { useCallback, useEffect, useState } from "react"
import { MembersList } from "@/components/admin/members-list"
import { AddMemberForm } from "@/components/admin/add-member-form"
import { AdminGuard } from "@/components/admin/admin-guard"
import { AdminNavigation } from "@/components/admin/admin-navigation"
import { Loader2 } from "lucide-react"

interface Member {
  id: number
  first_name: string
  last_name: string
  email: string
  start_date: string
  expiry_date: string
  status: string
  membership_configured?: boolean
  membership_type?: string
  individual_training_paid?: boolean
  created_at: string
}

export default function AdminPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMembers = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const response = await fetch("/api/members", { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        setMembers(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching members:", error)
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchMembers(true)
    const refresh = () => {
      if (document.visibilityState === "visible") void fetchMembers()
    }
    const interval = window.setInterval(refresh, 10000)
    document.addEventListener("visibilitychange", refresh)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", refresh)
    }
  }, [fetchMembers])

  // Expose refresh function for form to use
  useEffect(() => {
    ;(window as any).refreshMembers = () => fetchMembers()
    return () => {
      delete (window as any).refreshMembers
    }
  }, [fetchMembers])

  return (
    <AdminGuard>
      <div className="min-h-screen overflow-x-hidden bg-background px-3 py-6 sm:px-4 sm:py-12">
        <div className="mx-auto min-w-0 max-w-7xl">
          <AdminNavigation />
          <div className="min-w-0 overflow-hidden rounded-lg border border-primary/20 bg-card/10 p-4 backdrop-blur-md sm:p-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Admin Panel</h1>
            <p className="text-muted-foreground mb-8">Upravljanje članovima kluba Gard 018</p>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <div className="flex min-w-0 flex-col gap-8">
                <AddMemberForm />
                <MembersList members={members} onMembersChanged={fetchMembers} />
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminGuard>
  )
}
