import { useEffect, useState } from "react";
import { Download, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/trackindia-official-logo.jpg.asset.json";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallPrompt() {
  const [offer, setOffer] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)");
    const isInstalled = () => standalone.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(isInstalled());
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) && !isInstalled());
    const onOffer = (event: Event) => {
      event.preventDefault();
      if (!isInstalled()) setOffer(event as InstallEvent);
    };
    const onInstalled = () => { setInstalled(true); setOffer(null); };
    const onModeChange = () => setInstalled(isInstalled());
    window.addEventListener("beforeinstallprompt", onOffer);
    window.addEventListener("appinstalled", onInstalled);
    standalone.addEventListener("change", onModeChange);
    return () => {
      window.removeEventListener("beforeinstallprompt", onOffer);
      window.removeEventListener("appinstalled", onInstalled);
      standalone.removeEventListener("change", onModeChange);
    };
  }, []);

  if (installed || dismissed || (!offer && !ios)) return null;

  return (
    <aside role="dialog" aria-label="Add TrackIndia to your home screen" className="fixed bottom-20 md:bottom-5 inset-x-3 md:left-auto md:right-5 md:w-80 z-[60] glass-strong rounded-lg p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <img src={logo.url} alt="" className="h-11 w-11 rounded-md object-contain bg-card shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold text-foreground">Add TrackIndia</p>
          <p className="text-xs text-muted-foreground mt-1">Keep TrackIndia on your home screen.</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setDismissed(true)} aria-label="Close install prompt" title="Close" className="shrink-0"><X size={16} /></Button>
      </div>
      {offer ? (
        <Button className="w-full mt-3" onClick={async () => {
          await offer.prompt();
          const choice = await offer.userChoice;
          setOffer(null);
          if (choice.outcome !== "accepted") setDismissed(true);
        }}><Download size={16} /> Add to home screen</Button>
      ) : (
        <p className="mt-3 text-sm text-foreground flex items-center gap-2"><Share2 size={16} className="shrink-0" /> Tap Share, then Add to Home Screen.</p>
      )}
    </aside>
  );
}