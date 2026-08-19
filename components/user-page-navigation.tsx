import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { UserNav } from "@/components/user-nav";
import { InstallAppButton } from "@/components/install-app-button";

export function UserPageNavigation() {
  return (
    <div className="mb-6 flex min-h-11 flex-wrap items-center justify-between gap-3">
      <Link
        href="/"
        className="inline-flex h-11 items-center gap-2 rounded-lg border border-primary/30 bg-card/60 px-3 text-sm font-semibold text-foreground transition hover:border-primary/50 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Nazad na sajt
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <InstallAppButton compact />
        <UserNav />
      </div>
    </div>
  );
}
