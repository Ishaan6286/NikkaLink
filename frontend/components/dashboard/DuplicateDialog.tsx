"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarChart2, Copy, Link2, Plus } from "lucide-react";
import type { DuplicateCheckResult } from "@/types";
import { CopyButton } from "@/components/shared/CopyButton";

interface DuplicateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicate: DuplicateCheckResult;
  onReuse: () => void;
  onCreateAnother: () => void;
}

export function DuplicateDialog({
  open,
  onOpenChange,
  duplicate,
  onReuse,
  onCreateAnother,
}: DuplicateDialogProps) {
  const existing = duplicate.existing!;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-amber-500" />
            Link Already Exists
          </DialogTitle>
          <DialogDescription>
            You&apos;ve already shortened this URL. Reuse the existing link or create another.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-2">
          <p className="text-sm font-medium truncate">{existing.short_url}</p>
          <p className="text-xs text-muted-foreground truncate">{existing.original_url}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <BarChart2 className="h-3 w-3" />
              {existing.total_clicks} clicks
            </span>
            <span>Created {new Date(existing.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onCreateAnother} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Another
          </Button>
          <Button onClick={onReuse} className="gap-2">
            <Copy className="h-4 w-4" />
            Reuse Existing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
