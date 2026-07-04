"use client";

import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { Sidebar } from "@/components/shared/Sidebar";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { useState, useEffect } from "react";
import { CreateURLModal } from "@/components/dashboard/CreateURLModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background" suppressHydrationWarning>
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
      {mounted && (
        <>
          <CommandPalette onCreateURL={() => setCreateOpen(true)} />
          <CreateURLModal open={createOpen} onOpenChange={setCreateOpen} />
        </>
      )}
    </ProtectedRoute>
  );
}
