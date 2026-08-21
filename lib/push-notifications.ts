import webpush, { type PushSubscription } from "web-push";
import { sql } from "@/lib/db-singleton";

type NotificationPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
};

type StoredSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function getVapidConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (publicKey && privateKey) return { publicKey, privateKey };

  const existing = await sql`
    SELECT public_key, private_key
    FROM push_configuration
    WHERE singleton = TRUE
    LIMIT 1
  `;
  if (existing.length > 0) {
    return {
      publicKey: existing[0].public_key,
      privateKey: existing[0].private_key,
    };
  }

  const generated = webpush.generateVAPIDKeys();
  const inserted = await sql`
    INSERT INTO push_configuration (singleton, public_key, private_key)
    VALUES (TRUE, ${generated.publicKey}, ${generated.privateKey})
    ON CONFLICT (singleton) DO NOTHING
    RETURNING public_key, private_key
  `;
  if (inserted.length > 0) {
    return {
      publicKey: inserted[0].public_key,
      privateKey: inserted[0].private_key,
    };
  }

  const winner = await sql`
    SELECT public_key, private_key
    FROM push_configuration
    WHERE singleton = TRUE
    LIMIT 1
  `;
  if (winner.length === 0) throw new Error("VAPID ključevi nisu dostupni");
  return {
    publicKey: winner[0].public_key,
    privateKey: winner[0].private_key,
  };
}

async function configureWebPush() {
  const config = await getVapidConfig();
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:info@gard018.com",
    config.publicKey,
    config.privateKey,
  );
}

async function deliver(
  subscriptions: StoredSubscription[],
  payload: NotificationPayload,
) {
  if (subscriptions.length === 0) return;
  await configureWebPush();

  const expiredEndpoints: string[] = [];
  await Promise.allSettled(
    subscriptions.map(async (stored) => {
      const subscription: PushSubscription = {
        endpoint: stored.endpoint,
        keys: { p256dh: stored.p256dh, auth: stored.auth },
      };

      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload), {
          TTL: 60 * 60,
          timeout: 5_000,
          urgency: "high",
        });
      } catch (error) {
        const statusCode =
          typeof error === "object" && error && "statusCode" in error
            ? Number(error.statusCode)
            : 0;
        if (statusCode === 404 || statusCode === 410) {
          expiredEndpoints.push(stored.endpoint);
          return;
        }
        console.error("[GARD018] Push notification delivery failed:", error);
      }
    }),
  );

  if (expiredEndpoints.length > 0) {
    await sql.query(
      "DELETE FROM push_subscriptions WHERE endpoint = ANY($1::text[])",
      [expiredEndpoints],
    );
  }
}

export async function sendPushToAdmins(payload: NotificationPayload) {
  try {
    const subscriptions = await sql`
      SELECT DISTINCT ps.endpoint, ps.p256dh, ps.auth
      FROM push_subscriptions ps
      JOIN admins a ON LOWER(a.email) = LOWER(ps.owner_email)
    `;
    await deliver(subscriptions, payload);
  } catch (error) {
    console.error("[GARD018] Admin push preparation failed:", error);
  }
}

export async function sendPushToMember(
  email: string,
  payload: NotificationPayload,
) {
  try {
    const subscriptions = await sql`
      SELECT endpoint, p256dh, auth
      FROM push_subscriptions
      WHERE LOWER(owner_email) = LOWER(${email})
    `;
    await deliver(subscriptions, payload);
  } catch (error) {
    console.error("[GARD018] Member push preparation failed:", error);
  }
}

export function formatTrainingDate(value: unknown) {
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "izabrani termin";
  return new Intl.DateTimeFormat("sr-RS", {
    timeZone: "Europe/Belgrade",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
