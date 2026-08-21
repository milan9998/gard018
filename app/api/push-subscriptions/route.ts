import { NextResponse } from "next/server";
import { sql } from "@/lib/db-singleton";
import { getSessionUser } from "@/lib/session-helpers";
import { getVapidConfig } from "@/lib/push-notifications";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Morate biti prijavljeni" }, { status: 401 });
  }

  try {
    const config = await getVapidConfig();
    return NextResponse.json({ configured: true, publicKey: config.publicKey });
  } catch (error) {
    console.error("[GARD018] VAPID configuration failed:", error);
    return NextResponse.json(
      { error: "Obaveštenja trenutno nisu dostupna" },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Morate biti prijavljeni" }, { status: 401 });
  }
  try {
    await getVapidConfig();
    const body = await request.json();
    const endpoint = typeof body.endpoint === "string" ? body.endpoint.trim() : "";
    const p256dh = typeof body.keys?.p256dh === "string" ? body.keys.p256dh : "";
    const auth = typeof body.keys?.auth === "string" ? body.keys.auth : "";

    if (!endpoint.startsWith("https://") || !p256dh || !auth) {
      return NextResponse.json(
        { error: "Nevažeća prijava uređaja" },
        { status: 400 },
      );
    }

    await sql`
      INSERT INTO push_subscriptions
        (owner_email, endpoint, p256dh, auth, user_agent)
      VALUES
        (${user.email.toLowerCase()}, ${endpoint}, ${p256dh}, ${auth}, ${request.headers.get("user-agent")})
      ON CONFLICT (endpoint)
      DO UPDATE SET
        owner_email = EXCLUDED.owner_email,
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        user_agent = EXCLUDED.user_agent,
        updated_at = CURRENT_TIMESTAMP
    `;

    return NextResponse.json({ subscribed: true });
  } catch (error) {
    console.error("[GARD018] Push subscription save failed:", error);
    return NextResponse.json(
      { error: "Greška pri uključivanju obaveštenja" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Morate biti prijavljeni" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
    if (!endpoint) {
      return NextResponse.json({ error: "Nevažeći uređaj" }, { status: 400 });
    }

    await sql`
      DELETE FROM push_subscriptions
      WHERE endpoint = ${endpoint} AND LOWER(owner_email) = LOWER(${user.email})
    `;
    return NextResponse.json({ subscribed: false });
  } catch (error) {
    console.error("[GARD018] Push subscription delete failed:", error);
    return NextResponse.json(
      { error: "Greška pri isključivanju obaveštenja" },
      { status: 500 },
    );
  }
}
