import { readFile } from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
}

function getUploadRoot() {
  return path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"))
}

export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  try {
    const segments = (await context.params).path
    if (!segments?.length || segments.some((segment) => !/^[a-zA-Z0-9._-]+$/.test(segment))) {
      return new NextResponse("Not found", { status: 404 })
    }

    const uploadRoot = getUploadRoot()
    const requestedPath = path.resolve(uploadRoot, ...segments)
    if (!requestedPath.startsWith(`${uploadRoot}${path.sep}`)) return new NextResponse("Not found", { status: 404 })

    const contentType = CONTENT_TYPES[path.extname(requestedPath).toLowerCase()]
    if (!contentType) return new NextResponse("Not found", { status: 404 })

    const contents = await readFile(requestedPath)
    return new NextResponse(contents, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch {
    return new NextResponse("Not found", { status: 404 })
  }
}

