"use client"

import { useEffect } from "react"

/** Adds a lightweight, accessible reveal when public sections enter the viewport. */
export function ScrollMotion() {
  useEffect(() => {
    const root = document.documentElement
    root.classList.add("motion-ready")

    const targets = new Set<HTMLElement>()
    const collectTargets = () => {
      document.querySelectorAll<HTMLElement>(".motion-section").forEach((target) => targets.add(target))
    }
    collectTargets()

    const revealAll = () => {
      collectTargets()
      targets.forEach((target) => target.classList.add("is-visible"))
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      revealAll()
      const mutations = new MutationObserver(revealAll)
      mutations.observe(document.body, { childList: true, subtree: true })
      return () => mutations.disconnect()
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible")
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    )

    const observeTargets = () => {
      collectTargets()
      targets.forEach((target) => {
        if (!target.classList.contains("is-visible")) observer.observe(target)
      })
    }

    observeTargets()

    // Fast Refresh and async sections can add markup after the first effect.
    const mutations = new MutationObserver(observeTargets)
    mutations.observe(document.body, { childList: true, subtree: true })

    // Never leave a section hidden if a browser pauses IntersectionObserver.
    const safetyReveal = window.setTimeout(() => {
      targets.forEach((target) => target.classList.add("is-visible"))
    }, 1800)

    return () => {
      observer.disconnect()
      mutations.disconnect()
      window.clearTimeout(safetyReveal)
    }
  }, [])

  return null
}
