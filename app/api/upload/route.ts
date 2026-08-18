import { randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"

export const runtime = "nodejs"

const MAX_FILE_SIZE = 5 * 1024 * 1024
const FILE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
}
function getUploadRoot() {
  return path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"))
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Niste ulogovani" }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get("file")
    if (!(file instanceof File)) return NextResponse.json({ error: "Nema fajla" }, { status: 400 })

    const extension = FILE_EXTENSIONS[file.type]
    if (!extension) {
      return NextResponse.json({ error: "Dozvoljene su samo JPG, PNG, WebP i GIF slike" }, { status: 400 })
    }
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Slika mora biti manja od 5 MB" }, { status: 400 })
    }

    const avatarDirectory = path.join(getUploadRoot(), "avatars")
    await mkdir(avatarDirectory, { recursive: true })
    const filename = `${randomUUID()}.${extension}`
    await writeFile(path.join(avatarDirectory, filename), Buffer.from(await file.arrayBuffer()), { flag: "wx" })

    return NextResponse.json({ url: `/uploads/avatars/${filename}` })
  } catch (error) {
    console.error("[GARD018] Upload greška:", error)
    return NextResponse.json({ error: "Slika nije sačuvana. Pokušajte ponovo." }, { status: 500 })
  }
}
