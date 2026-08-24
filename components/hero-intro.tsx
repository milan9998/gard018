"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export function HeroIntro() {
  const [isVisible, setIsVisible] = useState(true)
  const [isClosing, setIsClosing] = useState(false)
  const isClosingRef = useRef(false)
  const hideTimerRef = useRef<number | undefined>(undefined)
  const endedTimerRef = useRef<number | undefined>(undefined)

  const closeIntro = useCallback(() => {
    if (isClosingRef.current) return

    isClosingRef.current = true
    setIsClosing(true)
    hideTimerRef.current = window.setTimeout(() => {
      setIsVisible(false)
      document.body.classList.remove("hero-intro-active")
    }, 520)
  }, [])

  useEffect(() => {
    document.body.classList.add("hero-intro-active")
    const fallbackTimer = window.setTimeout(closeIntro, 3600)

    return () => {
      window.clearTimeout(fallbackTimer)
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
      if (endedTimerRef.current) window.clearTimeout(endedTimerRef.current)
      document.body.classList.remove("hero-intro-active")
    }
  }, [closeIntro])

  const handleEnded = () => {
    endedTimerRef.current = window.setTimeout(closeIntro, 220)
  }

  if (!isVisible) return null

  return (
    <div
      id="hero-intro"
      className={`hero-intro${isClosing ? " hero-intro-closing" : ""}`}
      role="presentation"
      onClick={closeIntro}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        backgroundColor: "#050505",
        opacity: 1,
      }}
    >
      <video
        className="hero-intro-video"
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-label="GARD 018 animirani logo"
        onEnded={handleEnded}
        onError={closeIntro}
      >
        <source src="/gard018-logo-intro.mp4" type="video/mp4" />
      </video>
    </div>
  )
}
