import type { ReactNode } from "react"
import { redirect } from "next/navigation"

import { checkAdminAuth } from "@/lib/auth-helpers"

export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const auth = await checkAdminAuth()

  if (!auth.isAuthenticated) {
    redirect("/prijava")
  }

  if (!auth.isAdmin) {
    redirect("/")
  }

  return children
}
