"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { buildApiDocsUrl, buildPublicShortUrl, getApiUrl } from "@/lib/env";
import { toast } from "sonner";
import Image from "next/image";

const urlSchema = z.object({
  url: z.string().url("Please enter a valid URL (include https://)"),
});

type UrlForm = z.infer<typeof urlSchema>;

// ─── Shorten Tab ───────────────────────────────────────────────────────────────

function ShortenTab() {
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<UrlForm>({
    resolver: zodResolver(urlSchema),
  });

  const originalUrl = watch("url");

  const onSubmit = async (data: UrlForm) => {
    setIsLoading(true);
    setResult(null);
    try {
      const res = await api.post("/api/v1/urls", { original_url: data.url });
      setResult(res.data);
      toast.success("Short link created!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to shorten URL");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(buildPublicShortUrl(result.short_code));
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!result) return;
    const publicShortUrl = buildPublicShortUrl(result.short_code);
    const whatsappMessage = `NikkaLink: ${publicShortUrl}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleReset = () => {
    setResult(null);
    reset();
  };

  return (
    <div className="p-6">
      {!result ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-2">
              <ArrowRight className="h-4 w-4 text-primary" /> Long URL
            </label>
            <Input
              placeholder="https://www.example.com/very/long/link?with=params"
              className="h-11 bg-background"
              {...register("url")}
            />
            {errors.url && (
              <p className="text-xs text-destructive mt-1">{errors.url.message}</p>
            )}
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 text-sm font-semibold"
          >
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Shortening...</>
            ) : (
              <><Link2 className="mr-2 h-4 w-4" /> Shorten Link</>
            )}
          </Button>
        </form>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Original URL */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1.5">
                <ArrowRight className="h-3.5 w-3.5" /> Long URL
              </label>
              <div className="h-10 rounded-lg border border-border bg-muted/30 px-3 flex items-center">
                <span className="text-sm text-muted-foreground truncate">{result.original_url}</span>
              </div>
            </div>

            {/* Short URL */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1.5">
                <Link2 className="h-3.5 w-3.5" /> NikkaLink Short Link
              </label>
              <div className="h-11 rounded-lg border-2 border-primary bg-primary/5 px-3 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-primary truncate">{buildPublicShortUrl(result.short_code)}</span>
                <button type="button" onClick={handleCopy} className="shrink-0 text-primary hover:text-primary/70 transition-colors">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 h-11"
                onClick={() => window.open(buildPublicShortUrl(result.short_code), "_blank", "noopener,noreferrer")}
              >
                <ExternalLink className="h-4 w-4" /> Visit URL
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 h-11"
                onClick={() => window.open(`${getApiUrl()}/api/v1/urls/qr/generate?url=${encodeURIComponent(buildPublicShortUrl(result.short_code))}`, "_blank", "noopener,noreferrer")}
              >
                <QrCode className="h-4 w-4" /> QR Code
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 h-11"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" /> Share
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 h-11"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                Copy
              </Button>
            </div>

            {/* Shorten another */}
            <Button
              type="button"
              onClick={handleReset}
              className="w-full h-11 text-sm font-semibold gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Shorten Another Link
            </Button>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

// ─── QR Code Tab ───────────────────────────────────────────────────────────────

function QRTab() {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputUrl, setInputUrl] = useState("");
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setError("");
    try { new URL(inputUrl); } catch {
      setError("Please enter a valid URL (include https://)");
      return;
    }
    setIsLoading(true);
    setQrUrl(null);
    try {
      // Use the public QR endpoint — returns a PNG image blob
      const res = await fetch(
        `${getApiUrl()}/api/v1/urls/qr/generate?url=${encodeURIComponent(inputUrl)}`
      );
      if (!res.ok) throw new Error("QR generation failed");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      setQrUrl(objectUrl);
      toast.success("QR Code generated!");
    } catch {
      toast.error("Failed to generate QR code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrUrl) return;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = "nikkalink-qr.png";
    a.click();
    toast.success("QR Code downloaded!");
  };

  const handleReset = () => {
    setQrUrl(null);
    setInputUrl("");
    setError("");
  };

  return (
    <div className="p-6">
      {!qrUrl ? (
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold mb-2">
              <ArrowRight className="h-4 w-4 text-primary" /> Enter URL
            </label>
            <Input
              placeholder="https://www.example.com/link-you-want-as-qr"
              className="h-11 bg-background"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading || !inputUrl}
            className="w-full h-11 text-sm font-semibold"
          >
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
            ) : (
              <><QrCode className="mr-2 h-4 w-4" /> Generate QR Code</>
            )}
          </Button>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key="qr-result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* URL label */}
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
              <p className="text-xs text-muted-foreground mb-0.5">URL</p>
              <p className="text-sm font-medium truncate">{inputUrl}</p>
            </div>

            {/* QR Image */}
            <div className="flex justify-center">
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
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                onClick={handleDownload}
                className="h-11 gap-2 text-sm"
              >
                <Download className="h-4 w-4" /> Download PNG
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
        </AnimatePresence>
      )}
    </div>
  );
}

// ─── Main exported component ───────────────────────────────────────────────────

export function LiveShortener() {
  const [tab, setTab] = useState<"shorten" | "qr">("shorten");

  return (
    <div className="w-full max-w-lg mx-auto mt-10">
      <div className="rounded-2xl border border-border/60 bg-card/90 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Tab Header */}
        <div className="grid grid-cols-2 border-b border-border/50">
          <button
            type="button"
            onClick={() => setTab("shorten")}
            className={`flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold transition-all ${
              tab === "shorten"
                ? "bg-card text-foreground border-b-2 border-primary"
                : "bg-muted/30 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Link2 className="h-4 w-4" /> Shorten a Link
          </button>
          <button
            type="button"
            onClick={() => setTab("qr")}
            className={`flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold transition-all ${
              tab === "qr"
                ? "bg-card text-foreground border-b-2 border-primary"
                : "bg-muted/30 text-muted-foreground hover:text-foreground"
            }`}
          >
            <QrCode className="h-4 w-4" /> Generate QR Code
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {tab === "shorten" ? (
            <motion.div
              key="shorten"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
            >
              <ShortenTab />
            </motion.div>
          ) : (
            <motion.div
              key="qr"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <QRTab />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="border-t border-border/40 bg-muted/20 px-6 py-3 text-center">
          <p className="text-xs text-muted-foreground">
            No account required · Instant · Free forever
          </p>
        </div>
      </div>
    </div>
  );
}
