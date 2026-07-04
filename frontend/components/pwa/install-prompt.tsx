"use client";

import { useState, useEffect } from "react";
import { X, Share, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes("android-app://");
    
    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) return;

    // Check if dismissed recently (7 days)
    const dismissedAt = localStorage.getItem("pwa-prompt-dismissed");
    if (dismissedAt) {
      const daysSinceDismissed =
        (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) return;
    }

    // Android Install Prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Wait a bit before showing to not annoy the user instantly
      setTimeout(() => setShowPrompt(true), 15000); // 15 seconds
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // iOS Detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    
    if (isIOSDevice) {
      setIsIOS(true);
      setTimeout(() => setShowPrompt(true), 15000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed", Date.now().toString());
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setShowPrompt(false);
      }
    }
  };

  if (isStandalone || !showPrompt) return null;

  if (isIOS) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe bg-background/80 backdrop-blur-xl border-t shadow-lg sm:hidden animate-in slide-in-from-bottom-full duration-500">
        <div className="flex flex-col gap-3 max-w-md mx-auto">
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <img src="/icon.png" alt="NikkaLink" className="w-12 h-12 rounded-xl shadow-sm" />
              <div>
                <h3 className="font-semibold text-foreground">Install NikkaLink</h3>
                <p className="text-sm text-muted-foreground leading-tight">
                  Install this app on your home screen for quick and easy access when you're on the go.
                </p>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-muted-foreground hover:bg-muted p-1 rounded-full shrink-0">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground/80 flex items-center justify-center gap-2">
            Tap <Share className="h-4 w-4 text-blue-500" /> then <PlusSquare className="h-4 w-4" /> Add to Home Screen
          </div>
        </div>
      </div>
    );
  }

  if (deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 bg-background/80 backdrop-blur-xl border shadow-2xl rounded-2xl p-4 sm:max-w-sm sm:left-auto sm:right-4 animate-in slide-in-from-bottom-8 duration-500">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex gap-3 items-center">
              <img src="/icon.png" alt="NikkaLink" className="w-12 h-12 rounded-xl shadow-sm" />
              <div>
                <h3 className="font-semibold text-foreground flex items-center gap-1">
                  🚀 Install NikkaLink
                </h3>
                <p className="text-sm text-muted-foreground leading-tight mt-0.5">
                  Access your links faster directly from your home screen. Works offline!
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleDismiss}>
              Maybe Later
            </Button>
            <Button className="flex-1" onClick={handleInstall}>
              Install App
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
