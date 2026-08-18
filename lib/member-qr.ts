import { createHmac, timingSafeEqual } from "node:crypto"

const QR_PREFIX = "gard018:v1"
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function getQrSecret() {
  const secret = process.env.QR_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("QR_SECRET mora imati najmanje 32 karaktera")
  }
  return secret
}

function signatureFor(qrCodeId: string) {
  return createHmac("sha256", getQrSecret()).update(`v1:${qrCodeId.toLowerCase()}`).digest("base64url")
}

export function createMemberQrValue(qrCodeId: string) {
  const normalized = qrCodeId.toLowerCase()
  if (!UUID_PATTERN.test(normalized)) throw new Error("Nevažeći QR identifikator člana")
  return `${QR_PREFIX}:${normalized}:${signatureFor(normalized)}`
}

export function verifyMemberQrValue(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 300) return null

  const [club, version, qrCodeId, signature, extra] = value.trim().split(":")
  if (club !== "gard018" || version !== "v1" || !qrCodeId || !signature || extra) return null
  if (!UUID_PATTERN.test(qrCodeId)) return null

  const expected = signatureFor(qrCodeId)
  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null

  return qrCodeId.toLowerCase()
}
