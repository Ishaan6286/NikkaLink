"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart2, Link2, MousePointer2, Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/StatCard";
import { URLTable } from "@/components/dashboard/URLTable";
import { CreateURLModal } from "@/components/dashboard/CreateURLModal";
import { useURLs } from "@/hooks/useURLs";
import { useMe } from "@/hooks/useAuth";

export default function DashboardPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: user } = useMe();
  const { data, isLoading } = useURLs({ page: 1, page_size: 10 });

  const urls = data?.items ?? [];
  const totalURLs = data?.total ?? 0;
  const totalClicks = urls.reduce((sum, u) => sum + u.total_clicks, 0);
  const activeURLs = urls.filter((u) => u.is_active).length;

  return (
    <>
      <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Good day, {user?.username ?? "there"} 👋
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Here&apos;s an overview of your links and their performance.
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="w-fit gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New NikkaLink
          </Button>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Links"
            value={totalURLs.toLocaleString()}
            icon={Link2}
            description="All shortened URLs created"
            isLoading={isLoading}
          />
          <StatCard
            title="Total Clicks"
            value={totalClicks.toLocaleString()}
            icon={MousePointer2}
            description="Aggregate click count"
            isLoading={isLoading}
          />
          <StatCard
            title="Active Links"
            value={activeURLs.toLocaleString()}
            icon={TrendingUp}
            description="Currently live links"
            isLoading={isLoading}
          />
          <StatCard
            title="Avg. Clicks / Link"
            value={
              totalURLs > 0
                ? (totalClicks / totalURLs).toFixed(1)
                : "0"
            }
            icon={BarChart2}
            description="Engagement rate"
            isLoading={isLoading}
          />
        </div>

        {/* Recent URLs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Links</h2>
            <a
              href="/dashboard/urls"
              className="text-sm text-primary hover:underline"
            >
              View all →
            </a>
          </div>
          <URLTable urls={urls} isLoading={isLoading} />
        </div>
      </div>

      <CreateURLModal open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
