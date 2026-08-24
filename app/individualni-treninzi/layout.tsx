import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Individualni treninzi | GARD 018",
  description: "Rezervacija individualnih treninga za prijavljene članove GARD 018 kluba.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function IndividualniTreninziLayout({ children }: { children: ReactNode }) {
  return children
}
