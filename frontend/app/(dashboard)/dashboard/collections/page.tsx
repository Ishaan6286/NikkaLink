"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FolderPlus, Folder, ChevronRight, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCollections, INTEL_KEYS } from "@/hooks/useIntelligence";
import { intelligenceService } from "@/services/intelligenceService";
import { requireBackendToken, BackendAuthError } from "@/lib/backend-auth";
import type { Collection } from "@/types";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function CollectionsPage() {
  const { data: collections, isLoading, isError, refetch } = useCollections();
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const qc = useQueryClient();

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await requireBackendToken();
      const created = await intelligenceService.createCollection({ name: newName.trim() });
      const withCount: Collection = { ...created, item_count: created.item_count ?? 0 };
      setNewName("");
      qc.setQueryData<Collection[]>(INTEL_KEYS.collections(), (prev) => [
        ...(prev ?? []),
        withCount,
      ]);
      await qc.invalidateQueries({ queryKey: ["collections"] });
      await refetch();
      toast.success("Collection created");
    } catch (error) {
      if (error instanceof BackendAuthError) {
        toast.error(error.message, { duration: 8000 });
      } else {
        toast.error("Failed to create collection");
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Organize your links into folders and collections.
          </p>
        </div>
      </motion.div>

      <div className="flex gap-2">
        <Input
          placeholder="New collection name…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <Button onClick={handleCreate} disabled={creating || !newName.trim()} className="gap-2 shrink-0">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderPlus className="h-4 w-4" />}
          Create
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5">
          <p className="text-muted-foreground">Could not load collections. Check your API connection and try again.</p>
          <Button variant="outline" className="mt-4" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : collections?.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-border">
          <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No collections yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {collections?.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 rounded-lg border border-border/50 bg-card p-4 hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: c.color ? `${c.color}20` : undefined }}
              >
                <Folder className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{c.name}</p>
                {c.description && (
                  <p className="text-xs text-muted-foreground truncate">{c.description}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{c.item_count} links</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
