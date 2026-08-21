import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth-helpers";
import { sql } from "@/lib/db-singleton";

function readText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function readPublished(value: unknown, fallback = true) {
  return typeof value === "boolean" ? value : fallback;
}

function readImageUrls(body: Record<string, unknown>): { imageUrls: string[] } | { error: string } {
  const raw = Array.isArray(body.image_urls)
    ? body.image_urls
    : body.image_url
      ? [body.image_url]
      : [];
  const imageUrls = raw
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim().slice(0, 500))
    .filter(Boolean);

  if (imageUrls.some((url) => !url.startsWith("/uploads/news/"))) {
    return { error: "Nevažeća putanja slike" };
  }
  return { imageUrls };
}

function validateNews(body: Record<string, unknown>): { title: string; imageUrls: string[]; description: string; content: string } | { error: string } {
  const title = readText(body.title, 180);
  const images = readImageUrls(body);
  const description = readText(body.description, 400);
  const content = readText(body.content, 30_000);

  if (title.length < 2) return { error: "Naslov mora imati najmanje 2 karaktera" };
  if (content.length < 2) return { error: "Tekst vesti ne može biti prazan" };
  if ("error" in images) return images;
  return { title, imageUrls: images.imageUrls, description, content };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const includeDrafts = url.searchParams.get("admin") === "1";

  if (includeDrafts) {
    const auth = await checkAdminAuth();
    if (!auth.isAdmin) {
      return NextResponse.json(
        { error: auth.error || "Nemate pristup" },
        { status: auth.isAuthenticated ? 403 : 401 },
      );
    }
  }

  const requestedLimit = Number(url.searchParams.get("limit") || 50);
  const limit = Number.isInteger(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 100)
    : 50;

  try {
    const news = includeDrafts
      ? await sql`
          SELECT id, title, image_url, image_urls, description, content, published, created_by, created_at, updated_at
          FROM news
          ORDER BY created_at DESC, id DESC
          LIMIT ${limit}
        `
      : await sql`
          SELECT id, title, image_url, image_urls, description, content, published, created_at, updated_at
          FROM news
          WHERE published = TRUE
          ORDER BY created_at DESC, id DESC
          LIMIT ${limit}
        `;

    return NextResponse.json({ news });
  } catch (error) {
    console.error("[GARD018] News fetch failed:", error);
    return NextResponse.json({ error: "Greška pri učitavanju vesti" }, { status: 500 });
  }
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
    const body = await request.json();
    const parsed = validateNews(body);
    if ("error" in parsed) return NextResponse.json(parsed, { status: 400 });

    const result = await sql`
      INSERT INTO news (title, image_url, image_urls, description, content, published, created_by)
      VALUES (
        ${parsed.title},
        ${parsed.imageUrls[0] || ""},
        ${parsed.imageUrls},
        ${parsed.description},
        ${parsed.content},
        ${readPublished(body.published)},
        ${auth.email || "admin"}
      )
      RETURNING id, title, image_url, image_urls, description, content, published, created_at, updated_at
    `;

    return NextResponse.json({ news: result[0] }, { status: 201 });
  } catch (error) {
    console.error("[GARD018] News creation failed:", error);
    return NextResponse.json({ error: "Greška pri kreiranju vesti" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await checkAdminAuth();
  if (!auth.isAdmin) {
    return NextResponse.json(
      { error: auth.error || "Nemate pristup" },
      { status: auth.isAuthenticated ? 403 : 401 },
    );
  }

  try {
    const body = await request.json();
    const id = Number(body.id);
    const parsed = validateNews(body);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Nevažeća vest" }, { status: 400 });
    }
    if ("error" in parsed) return NextResponse.json(parsed, { status: 400 });

    const result = await sql`
      UPDATE news
      SET
        title = ${parsed.title},
        image_url = ${parsed.imageUrls[0] || ""},
        image_urls = ${parsed.imageUrls},
        description = ${parsed.description},
        content = ${parsed.content},
        published = ${readPublished(body.published)},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, title, image_url, image_urls, description, content, published, created_at, updated_at
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Vest nije pronađena" }, { status: 404 });
    }
    return NextResponse.json({ news: result[0] });
  } catch (error) {
    console.error("[GARD018] News update failed:", error);
    return NextResponse.json({ error: "Greška pri čuvanju vesti" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await checkAdminAuth();
  if (!auth.isAdmin) {
    return NextResponse.json(
      { error: auth.error || "Nemate pristup" },
      { status: auth.isAuthenticated ? 403 : 401 },
    );
  }

  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Nevažeća vest" }, { status: 400 });
    }

    const result = await sql`DELETE FROM news WHERE id = ${id} RETURNING id`;
    if (result.length === 0) {
      return NextResponse.json({ error: "Vest nije pronađena" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[GARD018] News deletion failed:", error);
    return NextResponse.json({ error: "Greška pri brisanju vesti" }, { status: 500 });
  }
}
