/**
 * Returns the URL users can actually open from the current request.
 * `NEXT_PUBLIC_BASE_URL=auto` is useful for local testing: localhost requests
 * produce localhost links, while a Cloudflare tunnel produces its hostname.
 */
export function getPublicBaseUrl(request?: Request) {
  const configured = (process.env.NEXT_PUBLIC_BASE_URL || "").trim().replace(/\/+$/, "")

  if (configured && configured !== "auto" && configured !== "http://localhost:3000") {
    return configured
  }

  if (request) {
    const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()
    const host = forwardedHost || request.headers.get("host")?.trim()
    if (host) {
      const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()
      const protocol = forwardedProtocol || new URL(request.url).protocol.replace(":", "")
      return `${protocol}://${host}`.replace(/\/+$/, "")
    }

    return new URL(request.url).origin.replace(/\/+$/, "")
  }

  return configured || "http://localhost:3000"
}
