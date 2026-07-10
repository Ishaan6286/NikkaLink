"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateURL } from "@/hooks/useURLs";
import { useMetadataPreview, useDuplicateCheck, useAliasSuggestions } from "@/hooks/useIntelligence";
import { useLinkEvents } from "@/hooks/useLinkEvents";
import { getPublicAppUrl } from "@/lib/env";
import { Loader2, Link2, Sparkles, Wand2, CheckCircle2 } from "lucide-react";
import { LinkPreview } from "@/components/dashboard/LinkPreview";
import { DuplicateDialog } from "@/components/dashboard/DuplicateDialog";
import { CopyButton } from "@/components/shared/CopyButton";
import type { DuplicateCheckResult, LinkMetadata, URLItem } from "@/types";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { URL_KEYS } from "@/hooks/useURLs";
import { INTEL_KEYS } from "@/hooks/useIntelligence";

const schema = z.object({
  original_url: z.string().url("Please enter a valid URL"),
  custom_alias: z
    .string()
    .regex(/^[a-zA-Z0-9_-]*$/, "Only letters, numbers, dashes, underscores")
    .max(30)
    .optional()
    .or(z.literal("")),
  expires_at: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

interface CreateURLModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUrl?: string;
}

export function CreateURLModal({ open, onOpenChange, initialUrl }: CreateURLModalProps) {
  const createURL = useCreateURL();
  const router = useRouter();
  const qc = useQueryClient();
  const duplicateCheck = useDuplicateCheck();
  const aliasSuggestions = useAliasSuggestions();
  const [duplicate, setDuplicate] = useState<DuplicateCheckResult | null>(null);
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [created, setCreated] = useState<URLItem | null>(null);
  const [liveMetadata, setLiveMetadata] = useState<LinkMetadata | null>(null);
  const [metadataLoading, setMetadataLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const watchedUrl = watch("original_url");
  const debouncedUrl = useDebounce(watchedUrl, 600);
  const { data: preview, isLoading: previewLoading } = useMetadataPreview(
    debouncedUrl,
    open && !!debouncedUrl && !created
  );

  const handleSSEEvent = useCallback(
    (event: { event_type: string; payload: Record<string, unknown> }) => {
      if (!created) return;
      if (event.event_type === "MetadataFetched" && event.payload.short_code === created.short_code) {
        setLiveMetadata({
          title: event.payload.title as string,
          description: event.payload.description as string,
          site_name: event.payload.site_name as string,
          og_image_url: event.payload.og_image_url as string,
          favicon_url: event.payload.favicon_url as string,
        });
        setMetadataLoading(false);
        qc.invalidateQueries({ queryKey: INTEL_KEYS.metadata(created.short_code) });
      }
    },
    [created, qc]
  );

  useLinkEvents({
    shortCode: created?.short_code,
    enabled: !!created && open,
    onEvent: handleSSEEvent,
  });

  useEffect(() => {
    if (initialUrl && open) setValue("original_url", initialUrl);
  }, [initialUrl, open, setValue]);

  useEffect(() => {
    if (!open) {
      setCreated(null);
      setLiveMetadata(null);
      setMetadataLoading(false);
      reset();
      setSuggestions([]);
    }
  }, [open, reset]);

  useEffect(() => {
    if (preview?.title && debouncedUrl && !created) {
      aliasSuggestions.mutate(
        { url: debouncedUrl, title: preview.title ?? undefined },
        { onSuccess: setSuggestions }
      );
    }
  }, [preview?.title, debouncedUrl, created]);

  const doCreate = async (data: FormData) => {
    const result = await createURL.mutateAsync({
      original_url: data.original_url,
      custom_alias: data.custom_alias || undefined,
      expires_at: data.expires_at || undefined,
    });
    setCreated(result);
    setMetadataLoading(true);
    qc.invalidateQueries({ queryKey: URL_KEYS.all });
    toast.success("Link created!");
  };

  const onSubmit = async (data: FormData) => {
    const dupResult = await duplicateCheck.mutateAsync(data.original_url);
    if (dupResult.is_duplicate) {
      setDuplicate(dupResult);
      setShowDuplicate(true);
      return;
    }
    await doCreate(data);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  // ── Success state: link created, metadata loading via SSE ─────────────────
  if (created) {
    const shortUrl = `${getPublicAppUrl()}/${created.short_code}`;
    const displayMeta = liveMetadata ?? null;

    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <DialogTitle>Link Created</DialogTitle>
            </div>
            <DialogDescription>Your NikkaLink is live. Background processing continues.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-xs text-muted-foreground mb-1">Your short link</p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-primary font-medium truncate">{shortUrl}</span>
                <CopyButton text={shortUrl} />
              </div>
            </div>

            {metadataLoading && !displayMeta?.title && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Fetching metadata…
              </div>
            )}

            <LinkPreview metadata={displayMeta} isLoading={metadataLoading && !displayMeta?.title} />

            {!metadataLoading && !displayMeta?.title && (
              <p className="text-xs text-muted-foreground">Metadata will appear shortly.</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={handleClose}>Close</Button>
            <Button onClick={() => router.push(`/dashboard/analytics?code=${created.short_code}`)}>
              View Analytics
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <DialogTitle>Create NikkaLink</DialogTitle>
            </div>
            <DialogDescription>
              Paste a long URL and get a short, trackable NikkaLink with smart preview.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="original_url">
                Original URL <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="original_url"
                  placeholder="https://example.com/very-long-url"
                  className="pl-9"
                  {...register("original_url")}
                />
              </div>
              {errors.original_url && (
                <p className="text-xs text-destructive">{errors.original_url.message}</p>
              )}
            </div>

            <LinkPreview metadata={preview} isLoading={previewLoading} url={debouncedUrl} />

            {suggestions.length > 0 && (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Wand2 className="h-3.5 w-3.5" />
                  Suggested aliases
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((alias) => (
                    <button
                      key={alias}
                      type="button"
                      onClick={() => setValue("custom_alias", alias)}
                      className="rounded-full border border-border/50 bg-muted/50 px-2.5 py-1 text-xs hover:bg-primary/10 hover:border-primary/30 transition-colors"
                    >
                      {alias}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="custom_alias">Custom Alias (optional)</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {getPublicAppUrl().replace(/^https?:\/\//, "")}/
                </span>
                <Input id="custom_alias" placeholder="my-link" {...register("custom_alias")} />
              </div>
              {errors.custom_alias && (
                <p className="text-xs text-destructive">{errors.custom_alias.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expires_at">Expiry Date (optional)</Label>
              <Input id="expires_at" type="datetime-local" {...register("expires_at")} />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createURL.isPending || duplicateCheck.isPending}>
                {(createURL.isPending || duplicateCheck.isPending) ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Create NikkaLink
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {duplicate && (
        <DuplicateDialog
          open={showDuplicate}
          onOpenChange={setShowDuplicate}
          duplicate={duplicate}
          onReuse={() => {
            toast.success("Using existing link");
            setShowDuplicate(false);
            onOpenChange(false);
            router.push(`/dashboard/analytics?code=${duplicate.existing!.short_code}`);
          }}
          onCreateAnother={async () => {
            setShowDuplicate(false);
            await doCreate(watch());
          }}
        />
      )}
    </>
  );
}
