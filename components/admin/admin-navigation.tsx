"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  Home,
  MessageSquare,
  ScanLine,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { UserNav } from "@/components/user-nav";
import { InstallAppButton } from "@/components/install-app-button";

const links = [
  { href: "/admin", label: "Članovi", icon: Users },
  { href: "/admin/qr-skener", label: "QR skener", icon: ScanLine },
  { href: "/admin/messages", label: "Poruke", icon: MessageSquare },
  {
    href: "/admin/nedeljni-treninzi",
    label: "Nedeljni treninzi",
    icon: CalendarDays,
  },
  {
    href: "/admin/individualni-treninzi",
    label: "Individualni",
    icon: Calendar,
  },
  { href: "/admin/manage-admins", label: "Admini", icon: Shield },
  { href: "/settings", label: "Podešavanja", icon: Settings },
];

export function AdminNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  const goBack = () => {
    if (pathname === "/admin") router.push("/");
    else router.push("/admin");
  };

  return (
    <div className="sticky top-0 z-40 -mx-3 mb-6 border-b border-primary/20 bg-background/95 px-3 py-3 shadow-lg shadow-black/10 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-primary/25 bg-card/60 px-3 text-sm font-semibold text-foreground transition hover:border-primary/50 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">
            {pathname === "/admin" ? "Na sajt" : "Nazad"}
          </span>
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Admin panel</span>
        </button>
        <nav
          aria-label="Admin navigacija"
          className="grid w-full grid-cols-2 gap-1 border-t border-primary/15 pt-2 sm:ml-1 sm:flex sm:w-auto sm:min-w-0 sm:flex-1 sm:border-0 sm:pt-0 sm:overflow-x-auto sm:pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <button
                key={href}
                type="button"
                onClick={() => router.push(href)}
                aria-current={active ? "page" : undefined}
                className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${active ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"}`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2 border-l border-primary/20 pl-2">
          <InstallAppButton compact />
          <UserNav showAdminShortcut={false} />
        </div>
      </div>
    </div>
  );
}
