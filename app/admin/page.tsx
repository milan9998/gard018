"use client"

import { useEffect, useState } from "react"
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
  membership_type?: string
  individual_training_paid?: boolean
  created_at: string
}

export default function AdminPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMembers()
  }, [])

  async function fetchMembers() {
    try {
      const response = await fetch("/api/members")
      if (response.ok) {
        const data = await response.json()
        setMembers(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching members:", error)
    } finally {
      setLoading(false)
    }
  }

  // Expose refresh function for form to use
  useEffect(() => {
    ;(window as any).refreshMembers = fetchMembers
  }, [])

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <AdminNavigation />
          <div className="backdrop-blur-md bg-card/10 border border-primary/20 rounded-lg p-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Admin Panel</h1>
            <p className="text-muted-foreground mb-8">Управљање члановима клуба Gard 018</p>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <MembersList members={members} />
                </div>
                <div>
                  <AddMemberForm />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminGuard>
  )
}
