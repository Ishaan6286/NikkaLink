"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Link2,
  QrCode,
  Copy,
  ExternalLink,
  Share2,
  Check,
  Download,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { buildPublicShortUrl, getApiUrl } from "@/lib/env";
import { fetchQrBlobUrl, revokeQrBlobUrl } from "@/lib/qr-utils";
import { toast } from "sonner";
import Image from "next/image";
import { SmartUrlInput, type SmartUrlInputHandle } from "@/components/shared/SmartUrlInput";
import { normalizeUrlInput, isValidUrl } from "@/lib/url-utils";
import { useRecentLinks } from "@/hooks/useRecentLinks";
import { useCopyHistory } from "@/hooks/useCopyHistory";
import { RecentLinksSection } from "@/components/shared/RecentLinksSection";
import { scaleIn } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface ShortenResult {
  short_code: string;
  original_url: string;
}

// ─── Shorten Tab ───────────────────────────────────────────────────────────────

function ShortenTab({
  initialUrl,
  onUrlConsumed,
}: {
  initialUrl?: string;
  onUrlConsumed?: () => void;
}) {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ShortenResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const inputRef = useRef<SmartUrlInputHandle>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const shortUrlRef = useRef<HTMLSpanElement>(null);
  const { addLink, links, removeLink, toggleFavorite, togglePin } = useRecentLinks();
  const { recordCopy } = useCopyHistory();
  const latestResult = useRef<ShortenResult | null>(null);

  useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl);
      onUrlConsumed?.();
    }
  }, [initialUrl, onUrlConsumed]);

  useEffect(() => {
    const onShortenUrl = (e: Event) => {
      const url = (e as CustomEvent<string>).detail;
      if (url) {
        setUrl(url);
        setTimeout(() => {
          const normalized = normalizeUrlInput(url);
          if (isValidUrl(normalized)) {
            void (async () => {
              setError("");
              setIsLoading(true);
              setProgress(0);
              setResult(null);
              try {
                const res = await api.post("/api/v1/urls", { original_url: normalized });
                const data = res.data as ShortenResult;
                setResult(data);
                const shortUrl = buildPublicShortUrl(data.short_code);
                addLink({
                  short_code: data.short_code,
                  original_url: data.original_url,
                  short_url: shortUrl,
                });
                toast.success("Short link created!");
              } catch (err: unknown) {
                const detail =
                  (err as { response?: { data?: { detail?: string } } })?.response?.data
                    ?.detail || "Failed to shorten URL";
                setError(typeof detail === "string" ? detail : "Failed to shorten URL");
                toast.error(typeof detail === "string" ? detail : "Failed to shorten URL");
              } finally {
                setIsLoading(false);
              }
            })();
          }
        }, 0);
      }
    };
    window.addEventListener("nikkalink:shorten-url", onShortenUrl);
    return () => window.removeEventListener("nikkalink:shorten-url", onShortenUrl);
  }, [addLink]);

  useEffect(() => {
    latestResult.current = result;
  }, [result]);

  useEffect(() => {
    const onCopyLatest = async () => {
      const r = latestResult.current;
      if (!r) return;
      const shortUrl = buildPublicShortUrl(r.short_code);
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      recordCopy(shortUrl);
      toast.success("Copied!");
      setTimeout(() => setCopied(false), 1500);
    };
    window.addEventListener("nikkalink:copy-latest", onCopyLatest);
    return () => window.removeEventListener("nikkalink:copy-latest", onCopyLatest);
  }, [recordCopy]);

  const handleShorten = useCallback(async () => {
    const normalized = normalizeUrlInput(url);
    if (!isValidUrl(normalized)) {
      setError("Please enter a valid URL");
      return;
    }

    setError("");
    setIsLoading(true);
    setProgress(0);
    setResult(null);

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 12, 85));
    }, 80);

    try {
      const res = await api.post("/api/v1/urls", { original_url: normalized });
      setProgress(100);
      const data = res.data as ShortenResult;
      setResult(data);

      const shortUrl = buildPublicShortUrl(data.short_code);
      addLink({
        short_code: data.short_code,
        original_url: data.original_url,
        short_url: shortUrl,
      });

      toast.success("Short link created!");

      requestAnimationFrame(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        const range = document.createRange();
        const el = shortUrlRef.current;
        if (el) {
          range.selectNodeContents(el);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      });
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to shorten URL";
      setError(typeof detail === "string" ? detail : "Failed to shorten URL");
      toast.error(typeof detail === "string" ? detail : "Failed to shorten URL");
    } finally {
      clearInterval(progressInterval);
      setIsLoading(false);
    }
  }, [url, addLink]);

  const shortUrl = result ? buildPublicShortUrl(result.short_code) : "";

  const handleCopy = useCallback(async () => {
    if (!result) return;
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    recordCopy(shortUrl);
    if (navigator.vibrate) navigator.vibrate(10);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 1500);
  }, [result, shortUrl, recordCopy]);

  const handleShare = useCallback(async () => {
    if (!result) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "NikkaLink", url: shortUrl });
        return;
      } catch {
        /* fall through */
      }
    }
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`NikkaLink: ${shortUrl}`)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }, [result, shortUrl]);

  useEffect(() => {
    return () => revokeQrBlobUrl(qrImageUrl);
  }, [qrImageUrl]);

  const handleReset = () => {
    revokeQrBlobUrl(qrImageUrl);
    setQrImageUrl(null);
    setQrLoading(false);
    setResult(null);
    setUrl("");
    setError("");
    inputRef.current?.focus();
  };

  const handleShowQr = useCallback(async () => {
    if (!result) return;
    if (qrImageUrl) {
      setQrImageUrl((prev) => {
        revokeQrBlobUrl(prev);
        return null;
      });
      return;
    }

    setQrLoading(true);
    try {
      const blobUrl = await fetchQrBlobUrl(shortUrl);
      setQrImageUrl(blobUrl);
    } catch {
      toast.error("Failed to generate QR code");
    } finally {
      setQrLoading(false);
    }
  }, [result, qrImageUrl, shortUrl]);

  const canSubmit = isValidUrl(url) && !isLoading;

  return (
    <div className="p-6">
      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div key="form" {...scaleIn} className="space-y-4">
            <div>
              <label
                htmlFor="url-input"
                className="flex items-center gap-2 text-sm font-semibold mb-2"
              >
                <ArrowRight className="h-4 w-4 text-primary" /> Long URL
              </label>
              <SmartUrlInput
                ref={inputRef}
                value={url}
                onChange={setUrl}
                onSubmit={handleShorten}
                isLoading={isLoading}
                error={error}
              />
            </div>

            {isLoading && (
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut" }}
                />
              </div>
            )}

            <Button
              type="button"
              disabled={!canSubmit}
              onClick={handleShorten}
              className={cn(
                "w-full h-11 text-sm font-semibold transition-all",
                canSubmit && "hover:shadow-lg hover:shadow-primary/20 active:scale-[0.99]"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Shortening…
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" /> Shorten Link
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            ref={resultRef}
            {...scaleIn}
            className="space-y-4"
          >
            <div className="rounded-xl border border-green-500/30 bg-green-500/5 px-4 py-3 flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-green-500/15 flex items-center justify-center">
                <Check className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                  Link shortened successfully
                </p>
                <p className="text-xs text-muted-foreground">Ready to share</p>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1.5">
                <ArrowRight className="h-3.5 w-3.5" /> Long URL
              </label>
              <div className="h-10 rounded-lg border border-border bg-muted/30 px-3 flex items-center">
                <span className="text-sm text-muted-foreground truncate">
                  {result.original_url}
                </span>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1.5">
                <Link2 className="h-3.5 w-3.5" /> NikkaLink Short Link
              </label>
              <div className="h-11 rounded-lg border-2 border-primary bg-primary/5 px-3 flex items-center justify-between gap-2">
                <span
                  ref={shortUrlRef}
                  className="text-sm font-semibold text-primary truncate select-all"
                >
                  {shortUrl}
                </span>
                <motion.button
                  type="button"
                  onClick={handleCopy}
                  whileTap={{ scale: 0.9 }}
                  className="shrink-0 text-primary hover:text-primary/70 transition-colors"
                  aria-label="Copy link"
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.span
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Check className="h-4 w-4 text-green-500" />
                      </motion.span>
                    ) : (
                      <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <Copy className="h-4 w-4" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 h-11 hover:border-primary/40"
                onClick={() => window.open(shortUrl, "_blank", "noopener,noreferrer")}
              >
                <ExternalLink className="h-4 w-4" /> Visit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 h-11 hover:border-primary/40"
                onClick={() => void handleShowQr()}
                disabled={qrLoading}
              >
                {qrLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <QrCode className="h-4 w-4" />
                )}
                {qrImageUrl ? "Hide QR" : "QR Code"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 h-11 hover:border-primary/40"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" /> Share
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 h-11 hover:border-primary/40"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>

            {qrImageUrl && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-4"
              >
                <div className="rounded-2xl border-2 border-primary/20 bg-white p-3 shadow-lg">
                  <Image
                    src={qrImageUrl}
                    alt="QR Code for short link"
                    width={180}
                    height={180}
                    className="rounded-lg"
                    unoptimized
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = qrImageUrl;
                    a.download = `${result.short_code}-qr.png`;
                    a.click();
                    toast.success("QR Code downloaded!");
                  }}
                >
                  <Download className="h-4 w-4" /> Download PNG
                </Button>
              </motion.div>
            )}

            <Button
              type="button"
              onClick={handleReset}
              className="w-full h-11 text-sm font-semibold gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Shorten Another Link
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div id="recent-links">
        <RecentLinksSection
          links={links}
          onRemove={removeLink}
          onToggleFavorite={toggleFavorite}
          onTogglePin={togglePin}
        />
      </div>
    </div>
  );
}

// ─── QR Code Tab ───────────────────────────────────────────────────────────────

function QRTab() {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputUrl, setInputUrl] = useState("");
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const inputRef = useRef<SmartUrlInputHandle>(null);

  useEffect(() => {
    const openQr = () => inputRef.current?.focus();
    window.addEventListener("nikkalink:open-qr", openQr);
    return () => window.removeEventListener("nikkalink:open-qr", openQr);
  }, []);

  const handleGenerate = async () => {
    const normalized = normalizeUrlInput(inputUrl);
    if (!isValidUrl(normalized)) {
      setError("Please enter a valid URL");
      return;
    }
    setError("");
    setIsLoading(true);
    setQrUrl(null);
    try {
      const res = await fetch(
        `${getApiUrl()}/api/v1/urls/qr/generate?url=${encodeURIComponent(normalized)}`
      );
      if (!res.ok) throw new Error("QR generation failed");
      const blob = await res.blob();
      setQrUrl(URL.createObjectURL(blob));
      toast.success("QR Code generated!");
    } catch {
      toast.error("Failed to generate QR code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!qrUrl) return;
    setDownloading(true);
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = "nikkalink-qr.png";
    a.click();
    if (navigator.vibrate) navigator.vibrate(10);
    toast.success("QR Code downloaded!");
    setTimeout(() => setDownloading(false), 600);
  };

  const handleReset = () => {
    setQrUrl(null);
    setInputUrl("");
    setError("");
    inputRef.current?.focus();
  };

  return (
    <div className="p-6">
      <AnimatePresence mode="wait">
        {!qrUrl ? (
          <motion.div key="qr-form" {...scaleIn} className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                <ArrowRight className="h-4 w-4 text-primary" /> Enter URL
              </label>
              <SmartUrlInput
                ref={inputRef}
                value={inputUrl}
                onChange={setInputUrl}
                onSubmit={handleGenerate}
                isLoading={isLoading}
                error={error}
                id="qr-url-input"
              />
            </div>
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading || !isValidUrl(inputUrl)}
              className="w-full h-11 text-sm font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <QrCode className="mr-2 h-4 w-4" /> Generate QR Code
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          <motion.div key="qr-result" {...scaleIn} className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
              <p className="text-xs text-muted-foreground mb-0.5">URL</p>
              <p className="text-sm font-medium truncate">{inputUrl}</p>
            </div>

            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="rounded-2xl border-2 border-primary/20 bg-white p-3 shadow-lg">
                <Image
                  src={qrUrl}
                  alt="QR Code"
                  width={200}
                  height={200}
                  className="rounded-lg"
                  unoptimized
                />
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="h-11 gap-2 text-sm"
              >
                {downloading ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download PNG
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="h-11 gap-2 text-sm"
              >
                <RefreshCw className="h-4 w-4" /> Generate New
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main exported component ───────────────────────────────────────────────────

export function LiveShortener({
  initialUrl,
  onInitialUrlConsumed,
}: {
  initialUrl?: string;
  onInitialUrlConsumed?: () => void;
} = {}) {
  const [tab, setTab] = useState<"shorten" | "qr">("shorten");

  useEffect(() => {
    const openQr = () => setTab("qr");
    window.addEventListener("nikkalink:open-qr", openQr);
    return () => window.removeEventListener("nikkalink:open-qr", openQr);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "c" && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        window.dispatchEvent(new Event("nikkalink:copy-latest"));
      }
      if (e.key === "q" && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        window.dispatchEvent(new Event("nikkalink:open-qr"));
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto mt-8 sm:mt-10">
      <div className="rounded-2xl border border-border/60 bg-card/90 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="grid grid-cols-2 border-b border-border/50">
          {(["shorten", "qr"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold transition-all",
                tab === t
                  ? "bg-card text-foreground border-b-2 border-primary"
                  : "bg-muted/30 text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "shorten" ? (
                <>
                  <Link2 className="h-4 w-4" /> Shorten a Link
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4" /> Generate QR Code
                </>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "shorten" ? (
            <motion.div
              key="shorten"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.15 }}
            >
              <ShortenTab
                initialUrl={initialUrl}
                onUrlConsumed={onInitialUrlConsumed}
              />
            </motion.div>
          ) : (
            <motion.div
              key="qr"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
            >
              <QRTab />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="border-t border-border/40 bg-muted/20 px-6 py-3 text-center">
          <p className="text-xs text-muted-foreground">
            No account required · Instant · Free forever
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            <kbd className="rounded border border-border/60 px-1">/</kbd> focus ·{" "}
            <kbd className="rounded border border-border/60 px-1">⌘K</kbd> commands
          </p>
        </div>
      </div>
    </div>
  );
}
