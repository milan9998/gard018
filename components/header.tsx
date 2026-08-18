"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"
import { UserNav } from "@/components/user-nav"

const navLinks = [
  { href: "#pocetna", label: "Početna" },
  { href: "#o-nama", label: "O Nama" },
  { href: "#programi", label: "Programi" },
  { href: "#raspored", label: "Raspored" },
  { href: "#galerija", label: "Galerija" },
  { href: "#kontakt", label: "Kontakt" },
]

export function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/image.png"
              alt="Gard 018 Logo"
              width={64}
              height={64}
              className="w-12 h-12 md:w-16 md:h-16 opacity-80 hover:opacity-100 transition-opacity"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-2 px-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider whitespace-nowrap px-2"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:block">
            <UserNav />
          </div>

          <button className="lg:hidden p-2 text-foreground" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isOpen && (
          <div className="lg:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-4 pt-4 border-t border-border">
                <UserNav />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
