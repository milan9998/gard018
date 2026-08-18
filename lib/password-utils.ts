import bcrypt from "bcryptjs"

export async function hashPasswordSHA256(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

export async function verifyPassword(password: string, hash: string, hashType: string | null | undefined) {
  if (hashType === "sha256") {
    return (await hashPasswordSHA256(password)) === hash
  }

  return bcrypt.compare(password, hash)
}

export function hashPasswordBcrypt(password: string) {
  return bcrypt.hash(password, 10)
}
