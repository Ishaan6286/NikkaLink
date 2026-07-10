"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalyticsSummary, useTimeSeries } from "@/hooks/useAnalytics";
import { useURLs } from "@/hooks/useURLs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart2, MousePointer2, Users } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";

const COLORS = [
  "#7c6af7",
  "#06b6d4",
  "#f59e0b",
  "#10b981",
  "#f43f5e",
  "#8b5cf6",
  "#3b82f6",
];

function AnalyticsContent() {
  const params = useSearchParams();
  const initialCode = params.get("code") ?? "";
  const [selectedCode, setSelectedCode] = useState(initialCode);
  const [days, setDays] = useState(30);

  const { data: urlsList, isError: urlsError } = useURLs({ page: 1, page_size: 100 });
  const urls = urlsList?.items ?? [];

  useEffect(() => {
    if (!selectedCode && urls.length > 0) {
      setSelectedCode(urls[0].short_code);
    }
  }, [urls, selectedCode]);

  const { data: summary, isLoading: sumLoading } =
    useAnalyticsSummary(selectedCode);
  const { data: timeSeries, isLoading: tsLoading } = useTimeSeries(
    selectedCode,
    days
  );

  const pieData = (obj: Record<string, number> | undefined) =>
    obj
      ? Object.entries(obj).map(([name, value]) => ({ name, value }))
      : [];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Deep insights into your link performance.
        </p>
      </motion.div>

      {/* URL selector */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select
          value={selectedCode || undefined}
          onValueChange={(v) => setSelectedCode(v ?? "")}
        >
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder="Select a link to analyse…" />
          </SelectTrigger>
          <SelectContent>
            {urls.map((u) => (
              <SelectItem key={u.id} value={u.short_code}>
                <span className="font-mono text-xs">{u.short_code}</span>
                <span className="ml-2 text-muted-foreground truncate max-w-[200px]">
                  — {u.original_url.slice(0, 40)}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(days)}
          onValueChange={(v) => setDays(Number(v))}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {urlsError && urls.length === 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          Could not load your links. Ensure you are signed in and FRONTEND_SSO_SECRET is
          configured on Vercel and Render.
        </div>
      )}

      {!selectedCode && !urlsError && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
            <BarChart2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-medium">Select a link to view analytics</p>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a short link from the dropdown above.
          </p>
        </div>
      )}

      {selectedCode && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Total Clicks"
              value={summary?.total_clicks ?? 0}
              icon={MousePointer2}
              isLoading={sumLoading}
            />
            <StatCard
              title="Unique Visitors"
              value={summary?.unique_visitors ?? 0}
              icon={Users}
              isLoading={sumLoading}
            />
            <StatCard
              title="Avg. Clicks / Day"
              value={
                timeSeries && timeSeries.length > 0
                  ? (
                      timeSeries.reduce((a, b) => a + b.clicks, 0) /
                      timeSeries.length
                    ).toFixed(1)
                  : "0"
              }
              icon={BarChart2}
              isLoading={tsLoading}
            />
          </div>

          {/* Clicks over time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Clicks Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {tsLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={timeSeries ?? []}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c6af7" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7c6af7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(d) =>
                        new Date(d).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      }
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <RTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      stroke="#7c6af7"
                      strokeWidth={2}
                      fill="url(#grad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Browser & Device */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Browser Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {sumLoading ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={pieData(summary?.browsers)}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData(summary?.browsers).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend iconSize={10} iconType="circle" />
                      <RTooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Device Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {sumLoading ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={pieData(summary?.devices)}
                      layout="vertical"
                      margin={{ left: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                      <RTooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                        }}
                      />
                      <Bar dataKey="value" fill="#7c6af7" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Referrers */}
          {summary?.referrers && Object.keys(summary.referrers).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Referrers</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={pieData(summary.referrers)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <RTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <AnalyticsContent />
    </Suspense>
  );
}
