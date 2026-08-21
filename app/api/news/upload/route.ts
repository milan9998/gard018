import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth-helpers";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const FILE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function getUploadRoot() {
  return path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));
}

export async function POST(request: Request) {
  const auth = await checkAdminAuth();
  if (!auth.isAdmin) {
    return NextResponse.json(
      { error: auth.error || "Nemate pristup" },
      { status: auth.isAuthenticated ? 403 : 401 },
    );
  }

  try {
    const file = (await request.formData()).get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Izaberite sliku" }, { status: 400 });

    const extension = FILE_EXTENSIONS[file.type];
    if (!extension) return NextResponse.json({ error: "Dozvoljene su JPG, PNG, WebP i GIF slike" }, { status: 400 });
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Slika mora biti manja od 8 MB" }, { status: 400 });

    const directory = path.join(getUploadRoot(), "news");
    await mkdir(directory, { recursive: true });
    const filename = `${randomUUID()}.${extension}`;
    await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()), { flag: "wx" });
    return NextResponse.json({ url: `/uploads/news/${filename}` });
  } catch (error) {
    console.error("[GARD018] News image upload failed:", error);
    return NextResponse.json({ error: "Slika nije sačuvana" }, { status: 500 });
  }
}
