"use client";

import { useState } from "react";
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
import { getPublicAppUrl } from "@/lib/env";
import { Loader2, Link2, Sparkles } from "lucide-react";

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
}

export function CreateURLModal({ open, onOpenChange }: CreateURLModalProps) {
  const createURL = useCreateURL();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    await createURL.mutateAsync({
      original_url: data.original_url,
      custom_alias: data.custom_alias || undefined,
      expires_at: data.expires_at || undefined,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <DialogTitle>Create NikkaLink</DialogTitle>
          </div>
          <DialogDescription>
            Paste a long URL and get a short, trackable NikkaLink.
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
              <p className="text-xs text-destructive">
                {errors.original_url.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="custom_alias">Custom Alias (optional)</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {getPublicAppUrl().replace(/^https?:\/\//, "")}/
              </span>
              <Input
                id="custom_alias"
                placeholder="my-link"
                {...register("custom_alias")}
              />
            </div>
            {errors.custom_alias && (
              <p className="text-xs text-destructive">
                {errors.custom_alias.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expires_at">Expiry Date (optional)</Label>
            <Input
              id="expires_at"
              type="datetime-local"
              {...register("expires_at")}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createURL.isPending}>
              {createURL.isPending ? (
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
  );
}
