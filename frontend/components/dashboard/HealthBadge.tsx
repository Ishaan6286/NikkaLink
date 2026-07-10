"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCheckHealthNow, useLinkHealth } from "@/hooks/useIntelligence";
import { useLinkEvents } from "@/hooks/useLinkEvents";
import { useQueryClient } from "@tanstack/react-query";
import { INTEL_KEYS } from "@/hooks/useIntelligence";
import { Activity, AlertTriangle, CheckCircle2, HelpCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback } from "react";

const STATUS_CONFIG = {
  healthy: { label: "Healthy", icon: CheckCircle2, className: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  warning: { label: "Warning", icon: AlertTriangle, className: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  broken: { label: "Broken", icon: AlertTriangle, className: "text-red-500 bg-red-500/10 border-red-500/20" },
  unknown: { label: "Unknown", icon: HelpCircle, className: "text-muted-foreground bg-muted" },
} as const;

interface HealthBadgeProps {
  shortCode: string;
  showCheckButton?: boolean;
}

export function HealthBadge({ shortCode, showCheckButton = false }: HealthBadgeProps) {
  const { data: health, isLoading } = useLinkHealth(shortCode);
  const checkNow = useCheckHealthNow();
  const qc = useQueryClient();

  const onEvent = useCallback(
    (event: { event_type: string; payload: Record<string, unknown> }) => {
      if (
        event.event_type === "HealthCheckCompleted" &&
        event.payload.short_code === shortCode
      ) {
        qc.invalidateQueries({ queryKey: INTEL_KEYS.health(shortCode) });
      }
    },
    [shortCode, qc]
  );

  useLinkEvents({ shortCode, enabled: !!shortCode, onEvent });

  if (isLoading) {
    return <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />;
  }

  const status = (health?.status ?? "unknown") as keyof typeof STATUS_CONFIG;
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.unknown;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="outline" className={cn("gap-1 text-xs", config.className)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
      {showCheckButton && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => checkNow.mutate(shortCode)}
          disabled={checkNow.isPending}
          title="Check now"
        >
          {checkNow.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Activity className="h-3 w-3" />
          )}
        </Button>
      )}
    </div>
  );
}
