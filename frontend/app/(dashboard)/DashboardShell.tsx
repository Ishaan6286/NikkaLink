"use client";

import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { Sidebar } from "@/components/shared/Sidebar";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { useState, useEffect } from "react";
import { CreateURLModal } from "@/components/dashboard/CreateURLModal";
import { AuthErrorBoundary } from "@/components/shared/AuthErrorBoundary";
import { SmartClipboardBanner } from "@/components/dashboard/SmartClipboardBanner";
import { BackendSyncBanner } from "@/components/auth/BackendSyncBanner";
import { AppChrome } from "@/components/shared/AppChrome";
import { PullToRefresh } from "@/components/shared/PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [clipboardUrl, setClipboardUrl] = useState<string | undefined>();
  const [mounted, setMounted] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries();
  };

  return (
    <AuthErrorBoundary fallbackTitle="Dashboard error">
      <ProtectedRoute>
        <AppChrome />
        <div className="flex min-h-screen bg-background" suppressHydrationWarning>
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            <BackendSyncBanner />
            <PullToRefresh onRefresh={handleRefresh} className="h-full">
              {children}
            </PullToRefresh>
          </main>
        </div>
        {mounted && (
          <>
            <CommandPalette onCreateURL={() => setCreateOpen(true)} />
            <CreateURLModal
              open={createOpen}
              onOpenChange={setCreateOpen}
              initialUrl={clipboardUrl}
            />
            <SmartClipboardBanner
              onShorten={(url) => {
                setClipboardUrl(url);
                setCreateOpen(true);
              }}
            />
          </>
        )}
      </ProtectedRoute>
    </AuthErrorBoundary>
  );
}
