"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, Copy, QrCode, Share2, BarChart3, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { toast } from "sonner";
import { QRModal } from "@/components/dashboard/QRModal";
import Link from "next/link";

const schema = z.object({
  original_url: z.string().url("Please enter a valid URL"),
});

type FormData = z.infer<typeof schema>;

export function LiveShortener() {
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setResult(null);
    try {
      const res = await api.post("/api/v1/urls", {
        original_url: data.original_url,
      });
      setResult(res.data);
      reset();
      toast.success("Short link created successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to shorten URL");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.short_url);
    setIsCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!result) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "NikkaLink",
          text: "Check out this link!",
          url: result.short_url,
        });
      } catch (err) {
        console.log(err);
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      
      <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 w-full mt-4">
        <div className="relative flex items-center shadow-lg rounded-2xl overflow-hidden ring-1 ring-border focus-within:ring-2 focus-within:ring-primary/50 transition-all bg-background/80">
          <Input
            placeholder="Paste your long link here..."
            className="h-16 pl-6 pr-36 bg-transparent text-lg border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
            {...register("original_url")}
          />
          <Button 
            type="submit" 
            disabled={isLoading} 
            className="absolute right-1.5 h-13 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-base transition-all"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Shorten
              </>
            )}
          </Button>
        </div>
        {errors.original_url && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -bottom-6 left-4 text-sm font-medium text-destructive"
          >
            {errors.original_url.message}
          </motion.p>
        )}
      </form>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 24 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="relative z-10 overflow-hidden"
          >
            <div className="bg-background/80 border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex-1 truncate">
                <p className="text-sm text-muted-foreground mb-1">Your link is ready!</p>
                <a 
                  href={result.short_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-lg font-semibold text-primary hover:underline truncate block"
                >
                  {result.short_url}
                </a>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="secondary" size="sm" onClick={handleCopy} className="gap-2">
                  {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={() => setQrOpen(true)} className="gap-2">
                  <QrCode className="h-4 w-4" />
                  QR Code
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
                <Link
                  href={`/analytics/${result.short_code}`}
                  className="inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-primary to-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow transition-opacity hover:opacity-90"
                >
                  <BarChart3 className="h-4 w-4" />
                  Stats
                </Link>
              </div>
            </div>
            
            {qrOpen && (
              <QRModal
                open={qrOpen}
                onOpenChange={setQrOpen}
                shortCode={result.short_code}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
