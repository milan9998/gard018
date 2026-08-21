"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

async function withTimeout<T>(promise: Promise<T>, milliseconds: number, message: string) {
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), milliseconds);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  }
}

export function PushNotificationButton({ compact = false }: { compact?: boolean }) {
  const [supported, setSupported] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [publicKey, setPublicKey] = useState("");

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      const canPush =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;
      if (!canPush) {
        if (active) {
          setSupported(false);
          setBusy(false);
        }
        return;
      }

      // Push pretplata se čuva u browseru i ostaje aktivna posle zatvaranja
      // aplikacije. Učitaj je pri svakom otvaranju da dugme ne izgleda kao da
      // je obaveštenje isključeno.
      try {
        const registration = await withTimeout(
          navigator.serviceWorker.register("/sw.js").then(() => navigator.serviceWorker.ready),
          8_000,
          "Service worker nije spreman",
        );
        const existing = await withTimeout(
          registration.pushManager.getSubscription(),
          5_000,
          "Provera uređaja je istekla",
        );
        if (active) setSubscribed(Boolean(existing));
        // Ako je korisnik ponovo otvorio aplikaciju, osveži vezu pretplate sa
        // njegovim nalogom (npr. posle prijave na novom uređaju).
        if (existing) {
          void fetch("/api/push-subscriptions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(existing.toJSON()),
          }).catch(() => undefined);
        }
      } catch {
        // Provera se ponavlja na klik; ne blokiraj prikaz stranice zbog sporog SW-a.
      }

      try {
        const response = await withTimeout(
          fetch("/api/push-subscriptions", { cache: "no-store" }),
          8_000,
          "Provera obaveštenja je istekla. Osvežite stranicu i pokušajte ponovo.",
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Provera nije uspela");
        if (!data.configured || !data.publicKey) {
          if (active) setConfigured(false);
          return;
        }
        if (active) setPublicKey(data.publicKey);

      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "Provera obaveštenja nije uspela");
      } finally {
        if (active) setBusy(false);
      }
    };
    void initialize();
    return () => {
      active = false;
    };
  }, []);

  const toggle = async () => {
    setBusy(true);
    setMessage("");
    try {
      let vapidPublicKey = publicKey;
      if (!vapidPublicKey) {
        const configResponse = await withTimeout(
          fetch("/api/push-subscriptions", { cache: "no-store" }),
          8_000,
          "Server nije odgovorio. Pokušajte ponovo.",
        );
        const config = await configResponse.json().catch(() => ({}));
        if (!configResponse.ok || !config.publicKey) {
          throw new Error(config.error || "Obaveštenja trenutno nisu dostupna.");
        }
        vapidPublicKey = config.publicKey;
        setPublicKey(vapidPublicKey);
      }

      const registration = await withTimeout(
        navigator.serviceWorker.register("/sw.js").then(() => navigator.serviceWorker.ready),
        8_000,
        "Service worker nije spreman. Osvežite stranicu i pokušajte ponovo.",
      );
      const existing = await withTimeout(
        registration.pushManager.getSubscription(),
        5_000,
        "Browser nije završio proveru uređaja. Pokušajte ponovo.",
      );

      if (existing && subscribed) {
        const response = await withTimeout(
          fetch("/api/push-subscriptions", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: existing.endpoint }),
          }),
          8_000,
          "Isključivanje obaveštenja je isteklo. Pokušajte ponovo.",
        );
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Isključivanje nije uspelo");
        }
        await existing.unsubscribe();
        setSubscribed(false);
        setMessage("Obaveštenja su isključena na ovom telefonu.");
        return;
      }

      // Pretplata može već postojati u browseru iako je React komponenta tek
      // učitana. U tom slučaju samo je sačuvaj za trenutno prijavljenog korisnika.
      if (existing) {
        const response = await withTimeout(
          fetch("/api/push-subscriptions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(existing.toJSON()),
          }),
          8_000,
          "Čuvanje uređaja je isteklo. Pokušajte ponovo.",
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Uključivanje nije uspelo");
        setSubscribed(true);
        setMessage("Obaveštenja su već bila uključena na ovom telefonu.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Obaveštenja nisu dozvoljena u podešavanjima telefona.");
      }

      const subscription = await withTimeout(
        registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }),
        10_000,
        "Uključivanje obaveštenja je isteklo. Pokušajte ponovo.",
      );
      const response = await withTimeout(
        fetch("/api/push-subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription.toJSON()),
        }),
        8_000,
        "Čuvanje uređaja je isteklo. Pokušajte ponovo.",
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        await subscription.unsubscribe();
        throw new Error(data.error || "Uključivanje nije uspelo");
      }
      setSubscribed(true);
      setMessage("Obaveštenja su uključena na ovom telefonu.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Greška pri podešavanju obaveštenja");
    } finally {
      setBusy(false);
    }
  };

  if (!supported) {
    return compact ? null : <p className="text-sm text-muted-foreground">Ovaj browser ne podržava obaveštenja.</p>;
  }
  if (!configured) {
    return compact ? null : <p className="text-sm text-muted-foreground">Obaveštenja će biti dostupna nakon podešavanja servera.</p>;
  }

  const buttonClass = subscribed
    ? "border-green-500/40 bg-green-500/10 text-green-300 hover:bg-green-500/20"
    : compact
      ? "h-10 border-yellow-300 bg-yellow-400 px-3 text-xs font-bold text-black shadow-lg shadow-yellow-500/20 hover:bg-yellow-300"
      : "h-12 border-yellow-300 bg-yellow-400 px-5 text-base font-bold text-black shadow-lg shadow-yellow-500/25 hover:bg-yellow-300";

  return (
    <div className={compact ? "" : "rounded-xl border border-primary/25 bg-primary/5 p-4"}>
      {!compact && <p className="mb-3 text-sm text-muted-foreground">Uključi obaveštenja da odmah saznaš kada stigne zahtev ili potvrda treninga.</p>}
      <Button type="button" variant="outline" disabled={busy} onClick={toggle} className={buttonClass}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : subscribed ? <BellOff className="mr-2 h-4 w-4" /> : <Bell className="mr-2 h-4 w-4" />}
        {busy ? "Provera..." : subscribed ? "Isključi obaveštenja" : "Uključi obaveštenja"}
      </Button>
      {!compact && message && <p className="mt-3 text-sm text-foreground" role="status">{message}</p>}
    </div>
  );
}
