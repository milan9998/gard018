import { CheckCircle2, CreditCard, XCircle } from "lucide-react"
import { redirect } from "next/navigation"

import { UserPageNavigation } from "@/components/user-page-navigation"
import { sql } from "@/lib/db-singleton"
import { getMembershipAccess } from "@/lib/membership-status"
import { getSessionUser } from "@/lib/session-helpers"

export const dynamic = "force-dynamic"

function formatDate(value: string) {
  const [year, month, day] = value.split("-")
  return year && month && day ? `${day}.${month}.${year}.` : value
}

export default async function ClanarinaPage() {
  const user = await getSessionUser()
  if (!user) redirect("/prijava?next=%2Fclanarina")

  const members = await sql`
    SELECT expiry_date, membership_configured
    FROM members
    WHERE email = ${user.email}
    LIMIT 1
  `
  const member = members[0]
  const configured = Boolean(member?.membership_configured)
  const access = configured ? getMembershipAccess(member.expiry_date) : null
  const allowed = Boolean(access?.allowed)

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-6 sm:py-10">
      <div className="w-full max-w-md">
        <UserPageNavigation />

        <section className="overflow-hidden rounded-3xl border border-primary/30 bg-card/80 shadow-2xl shadow-black/40">
          <header className="border-b border-primary/20 bg-primary/10 px-5 py-5 text-center">
            <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <CreditCard className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Članarina</h1>
          </header>

          <div className="px-5 py-6 text-center sm:px-7">
            {!member ? (
              <p className="text-sm text-muted-foreground">Nalog nije povezan sa članom kluba.</p>
            ) : (
              <div className={`rounded-2xl border p-4 ${allowed ? "border-green-500/40 bg-green-500/10" : "border-red-500/40 bg-red-500/10"}`}>
                <p className={`flex items-center justify-center gap-2 text-base font-bold ${allowed ? "text-green-300" : "text-red-300"}`}>
                  {allowed ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  {allowed ? "Članarina važi" : configured ? "Članarina je istekla" : "Članarina nije podešena"}
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {configured
                    ? `Važi do ${formatDate(access?.expiryDate || "")}`
                    : "Admin još nije uneo datum važenja članarine."}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
