"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { urlService } from "@/services/urlService";
import api from "@/lib/api";

interface QRModalProps {
  shortCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QRModal({ shortCode, open, onOpenChange }: QRModalProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setImgSrc(null);

    api
      .get(`/api/v1/urls/${shortCode}/qr`, { responseType: "blob" })
      .then((res) => {
        const url = URL.createObjectURL(res.data);
        setImgSrc(url);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, shortCode]);

  const handleDownload = () => {
    if (!imgSrc) return;
    const a = document.createElement("a");
    a.href = imgSrc;
    a.download = `${shortCode}-qr.png`;
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs text-center">
        <DialogHeader>
          <DialogTitle>QR Code — {shortCode}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center py-4 min-h-[200px]">
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : imgSrc ? (
            <img
              src={imgSrc}
              alt={`QR for ${shortCode}`}
              className="h-48 w-48 rounded-md border border-border"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Failed to load QR code.
            </p>
          )}
        </div>
        <Button
          onClick={handleDownload}
          disabled={!imgSrc}
          className="w-full"
        >
          <Download className="mr-2 h-4 w-4" />
          Download PNG
        </Button>
      </DialogContent>
    </Dialog>
  );
}
