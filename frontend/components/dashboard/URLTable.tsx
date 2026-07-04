"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart2,
  ExternalLink,
  MoreHorizontal,
  QrCode,
  Trash2,
} from "lucide-react";
import { URLItem } from "@/types";
import { urlService } from "@/services/urlService";
import { useDeleteURL } from "@/hooks/useURLs";
import { CopyButton } from "@/components/shared/CopyButton";
import { QRModal } from "@/components/dashboard/QRModal";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface URLTableProps {
  urls: URLItem[];
  isLoading?: boolean;
}

function RowSkeleton() {
  return (
    <TableRow>
      {Array.from({ length: 7 }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );
}



function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function URLTable({ urls, isLoading }: URLTableProps) {
  const router = useRouter();
  const deleteURL = useDeleteURL();
  const [qrCode, setQrCode] = useState<string | null>(null);

  const handleDelete = (shortCode: string) => {
    toast(`Delete "${shortCode}"?`, {
      action: {
        label: "Delete",
        onClick: () => deleteURL.mutate(shortCode),
      },
      cancel: { label: "Cancel", onClick: () => {} },
    });
  };

  return (
    <>
      <div className="rounded-lg border border-border/50 overflow-hidden hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-[240px]">Original URL</TableHead>
              <TableHead>Short Link</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <RowSkeleton key={i} />
                ))
              : urls.map((url) => {
                  const shortURL = urlService.getShortURL(url.short_code);
                  return (
                    <TableRow key={url.id} className="group">
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] sm:max-w-[200px] md:max-w-[240px] truncate">
                        <Tooltip>
                          <TooltipTrigger className="w-full text-left truncate">
                            <span className="cursor-default">
                              {url.original_url}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs break-all">
                            {url.original_url}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-primary">
                            {url.short_code}
                          </span>
                          <CopyButton text={shortURL} />
                        </div>
                      </TableCell>

                      <TableCell className="text-right font-medium">
                        {url.total_clicks.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(url.created_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(url.expires_at)}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={url.is_active ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {url.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => window.open(shortURL, "_blank")}
                            >
                              <ExternalLink className="mr-2 h-3.5 w-3.5" />
                              Open link
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/dashboard/analytics?code=${url.short_code}`
                                )
                              }
                            >
                              <BarChart2 className="mr-2 h-3.5 w-3.5" />
                              View analytics
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setQrCode(url.short_code)}
                            >
                              <QrCode className="mr-2 h-3.5 w-3.5" />
                              QR Code
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(url.short_code)}
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
          </TableBody>
        </Table>

        {!isLoading && urls.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <ExternalLink className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Your link vault is empty</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create your first NikkaLink to get started.
            </p>
          </div>
        )}
      </div>

      {/* Mobile Card Layout */}
      <div className="sm:hidden flex flex-col gap-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 border border-border/50 rounded-xl space-y-3">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-full" />
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-3 w-1/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))
          : urls.map((url) => {
              const shortURL = urlService.getShortURL(url.short_code);
              return (
                <div key={url.id} className="p-4 border border-border/50 rounded-xl bg-card/50 flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-base font-semibold text-primary truncate">
                        {url.short_code}
                      </span>
                      <CopyButton text={shortURL} />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                          <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => window.open(shortURL, "_blank")}>
                          <ExternalLink className="mr-2 h-4 w-4" /> Open link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/analytics?code=${url.short_code}`)}>
                          <BarChart2 className="mr-2 h-4 w-4" /> View analytics
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setQrCode(url.short_code)}>
                          <QrCode className="mr-2 h-4 w-4" /> QR Code
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(url.short_code)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="text-xs text-muted-foreground font-mono truncate">
                    {url.original_url}
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-1">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Clicks</span>
                      <span className="text-sm font-medium">{url.total_clicks.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Created</span>
                      <span className="text-sm font-medium">{formatDate(url.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })
        }
        {!isLoading && urls.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center border border-border/50 rounded-xl bg-card/30">
            <ExternalLink className="h-6 w-6 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No links found</p>
          </div>
        )}
      </div>

      {qrCode && (
        <QRModal
          shortCode={qrCode}
          open={!!qrCode}
          onOpenChange={(o) => !o && setQrCode(null)}
        />
      )}
    </>
  );
}
