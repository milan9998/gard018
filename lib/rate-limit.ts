import { NextResponse } from "next/server"

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

const CLEANUP_INTERVAL = 60000 // 1 minut

setInterval(() => {
  const now = Date.now()
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  }
}, CLEANUP_INTERVAL)

export interface RateLimitConfig {
  limit: number
  windowMs: number
}

export function rateLimit(config: RateLimitConfig) {
  const { limit, windowMs } = config

  return async function checkRateLimit(identifier: string): Promise<{
    success: boolean
    remaining: number
    reset: number
  }> {
    const now = Date.now()
    const key = identifier

    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      }
      return {
        success: true,
        remaining: limit - 1,
        reset: store[key].resetTime,
      }
    }

    store[key].count++

    if (store[key].count > limit) {
      return {
        success: false,
        remaining: 0,
        reset: store[key].resetTime,
      }
    }

    return {
      success: true,
      remaining: limit - store[key].count,
      reset: store[key].resetTime,
    }
  }
}

export function rateLimitResponse(reset: number) {
  const secondsUntilReset = Math.ceil((reset - Date.now()) / 1000)

  return NextResponse.json(
    {
      error: "Previše zahteva. Pokušajte ponovo kasnije.",
      retryAfter: secondsUntilReset,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(secondsUntilReset),
        "X-RateLimit-Reset": String(reset),
      },
    },
  )
}
