"use client";

import { useEffect, useState } from "react";
import { Download, MoreVertical, Plus, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallAppButton({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean(
        (window.navigator as Navigator & { standalone?: boolean }).standalone,
      );
    setIsInstalled(standalone);

    const ios =
      /iPad|iPhone|iPod/.test(window.navigator.userAgent) ||
      (window.navigator.platform === "MacIntel" &&
        window.navigator.maxTouchPoints > 1);
    setIsIOS(ios);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => setIsInstalled(true);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    navigator.serviceWorker?.register("/sw.js").catch(() => undefined);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") setIsInstalled(true);
      setInstallPrompt(null);
      return;
    }

    setInstructionsOpen(true);
  };

  if (isInstalled) return null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleInstall}
        className={`inline-flex items-center gap-2 border-primary/35 bg-primary/10 text-primary hover:bg-primary/20 ${className}`}
        title="Dodaj GARD 018 na početni ekran"
      >
        <Download className="h-4 w-4" />
        <span>{compact ? "Dodaj" : "Dodaj na početni ekran"}</span>
      </Button>

      <Dialog open={instructionsOpen} onOpenChange={setInstructionsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj GARD 018 na početni ekran</DialogTitle>
            <DialogDescription>
              Aplikacija će se otvoriti kao posebna ikonica na telefonu.
            </DialogDescription>
          </DialogHeader>

          {isIOS ? (
            <ol className="space-y-4 py-3 text-sm text-foreground">
              <li className="flex items-start gap-3">
                <Share className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>
                  U Safari-ju pritisni <strong>Share</strong> (kvadrat sa
                  strelicom).
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Plus className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>
                  Izaberi <strong>Add to Home Screen</strong> ili{" "}
                  <strong>Dodaj na početni ekran</strong>.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Download className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>
                  Pritisni <strong>Add</strong> / <strong>Dodaj</strong>.
                </span>
              </li>
            </ol>
          ) : (
            <div className="space-y-4 py-3 text-sm text-foreground">
              <p>
                Browser bi trebalo da prikaže prozor za instalaciju. Potvrdi sa{" "}
                <strong>Install</strong>.
              </p>
              <p className="flex items-start gap-3 text-muted-foreground">
                <MoreVertical className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>
                  Ako se prozor ne pojavi, otvori meni browsera (tri tačke) i
                  izaberi <strong>Install app</strong> ili{" "}
                  <strong>Add to Home screen</strong>.
                </span>
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
