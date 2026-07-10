"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, QrCode, Search, ExternalLink, Link2, Share2 } from "lucide-react";
import { useURLs } from "@/hooks/useURLs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { buildPublicShortUrl } from "@/lib/env";
import { urlService } from "@/services/urlService";

function QRCard({ url }: { url: { short_code: string; original_url: string; is_active: boolean; total_clicks: number } }) {
  const qrUrl = urlService.getQRCodeURL(url.short_code);
  const shortUrl = buildPublicShortUrl(url.short_code);

  const handleDownload = async () => {
    try {
      const res = await fetch(qrUrl);
      if (!res.ok) throw new Error("Failed to fetch QR code");
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `nikkalink-qr-${url.short_code}.png`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success("QR code downloaded!");
    } catch {
      toast.error("Failed to download QR code.");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "NikkaLink", url: shortUrl });
        return;
      } catch {
        /* fall through */
      }
    }
    try {
      await navigator.clipboard.writeText(shortUrl);
      toast.success("Link copied to clipboard!");
    } catch {
      window.open(shortUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border/50 rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* QR image */}
      <div className="flex justify-center">
        <div className="relative rounded-xl overflow-hidden border border-border/40 bg-white p-2 w-36 h-36 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt={`QR code for ${url.short_code}`}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm font-semibold text-primary truncate">/{url.short_code}</span>
          <Badge variant={url.is_active ? "default" : "secondary"} className="text-[10px] h-5">
            {url.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate" title={url.original_url}>
          {url.original_url}
        </p>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{url.total_clicks}</span> clicks
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button size="sm" className="flex-1 gap-1.5 h-8 text-xs" onClick={handleDownload}>
          <Download className="h-3 w-3" />
          Download
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0"
          title="Share link"
          onClick={() => void handleShare()}
        >
          <Share2 className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0"
          title="Open link"
          onClick={() => window.open(shortUrl, "_blank", "noopener,noreferrer")}
        >
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  );
}

export default function QRCodesPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useURLs({ page: 1, page_size: 100 });

  const urls = (data?.items ?? []).filter((u) =>
    search
      ? u.short_code.toLowerCase().includes(search.toLowerCase()) ||
        u.original_url.toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <QrCode className="h-6 w-6 text-primary" />
            QR Codes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate and download QR codes for all your NikkaLinks.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search links..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-[300px] rounded-2xl" />
          ))}
        </div>
      ) : urls.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
            <Link2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-lg">No links found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? "No links match your search." : "Create your first NikkaLink to get a QR code."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {urls.map((url) => (
            <QRCard key={url.id} url={url} />
          ))}
        </div>
      )}
    </div>
  );
}
