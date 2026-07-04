"use client";

import { motion } from "framer-motion";
import { Link2, MousePointer2, Users, BarChart3, Globe, Plus, Trash2, Copy, ExternalLink, QrCode } from "lucide-react";

export function MockDashboardPreview() {
  const mockLinks = [
    {
      short: "nikka.link/campaign26",
      original: "https://github.com/google-deepmind/antigravity",
      clicks: 432,
      created: "2 mins ago",
      active: true,
    },
    {
      short: "nikka.link/launch-event",
      original: "https://news.ycombinator.com/item?id=4592031",
      clicks: 231,
      created: "1 hr ago",
      active: true,
    },
    {
      short: "nikka.link/dev-docs",
      original: "https://fastapi.tiangolo.com/tutorial/bigger-applications/",
      clicks: 58,
      created: "5 hrs ago",
      active: true,
    },
  ];

  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden text-left shadow-2xl">
      {/* Topbar of simulation */}
      <div className="h-12 border-b border-border/50 flex items-center justify-between px-4 bg-muted/30">
        <div className="flex gap-1.5 items-center">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
          <span className="text-[11px] text-muted-foreground ml-3 font-mono">nikkalink.vercel.app/dashboard</span>
        </div>
        <div className="h-6 w-32 bg-background/50 rounded-full border border-border/30 flex items-center px-2 justify-center">
          <span className="text-[10px] text-muted-foreground font-medium">Workspace Active</span>
        </div>
      </div>

      {/* Main layout simulation */}
      <div className="flex min-h-[480px] flex-col md:flex-row">
        {/* Mock Sidebar */}
        <div className="w-full md:w-56 border-r border-border/50 bg-muted/10 p-4 space-y-6 shrink-0 hidden md:block">
          <div className="flex items-center gap-2 px-2">
            <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">N</span>
            </div>
            <span className="font-semibold text-sm">NikkaLink</span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground/60 px-2 block mb-2">Navigation</span>
            <div className="h-8 rounded-lg bg-primary/10 text-primary flex items-center px-3 text-xs font-medium gap-2">
              <BarChart3 className="h-3.5 w-3.5" />
              Dashboard
            </div>
            <div className="h-8 rounded-lg hover:bg-muted/50 text-muted-foreground flex items-center px-3 text-xs font-medium gap-2 transition-colors">
              <Link2 className="h-3.5 w-3.5" />
              My Links
            </div>
            <div className="h-8 rounded-lg hover:bg-muted/50 text-muted-foreground flex items-center px-3 text-xs font-medium gap-2 transition-colors">
              <Globe className="h-3.5 w-3.5" />
              Custom Domains
            </div>
          </div>
        </div>

        {/* Mock Dashboard Area */}
        <div className="flex-1 p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-lg">Performance Overview</h4>
              <p className="text-xs text-muted-foreground">Monitor clicks, devices, and traffic distribution.</p>
            </div>
            <div className="h-8 px-3 bg-primary text-primary-foreground text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-default hover:opacity-90 transition-opacity">
              <Plus className="h-3.5 w-3.5" /> New Link
            </div>
          </div>

          {/* Stats cards grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-background border border-border/50 rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground">Total Links</span>
                <Link2 className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="text-xl font-bold">1,248</p>
            </div>

            <div className="bg-background border border-border/50 rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground">Total Clicks</span>
                <MousePointer2 className="h-3.5 w-3.5 text-cyan-500" />
              </div>
              <p className="text-xl font-bold">98,765</p>
            </div>

            <div className="bg-background border border-border/50 rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground">Unique Clicks</span>
                <Users className="h-3.5 w-3.5 text-orange-500" />
              </div>
              <p className="text-xl font-bold">76,543</p>
            </div>

            <div className="bg-background border border-border/50 rounded-xl p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground">Avg. Clicks/Link</span>
                <BarChart3 className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <p className="text-xl font-bold">79.2</p>
            </div>
          </div>

          {/* Chart placeholder + Top countries */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="lg:col-span-2 bg-background border border-border/50 rounded-xl p-4 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-semibold">Clicks Over Time</span>
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">Last 30 days</span>
              </div>
              <div className="h-32 w-full flex items-end justify-between gap-1 pt-4 relative">
                {/* Simulated SVG Area Chart */}
                <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 80 Q 20 40 40 60 T 80 20 T 100 30 L 100 100 L 0 100 Z"
                    fill="url(#chart-grad)"
                  />
                  <path
                    d="M 0 80 Q 20 40 40 60 T 80 20 T 100 30"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="2"
                  />
                </svg>
                <div className="absolute bottom-1 left-2 text-[8px] text-muted-foreground font-mono">May 6</div>
                <div className="absolute bottom-1 right-2 text-[8px] text-muted-foreground font-mono">Jun 5</div>
              </div>
            </div>

            {/* Countries distribution */}
            <div className="bg-background border border-border/50 rounded-xl p-4 space-y-3">
              <span className="text-xs font-semibold">Top Countries</span>
              <div className="space-y-2 pt-1 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 font-medium">🇮🇳 India</span>
                    <span className="text-muted-foreground">35.2%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "35.2%" }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 font-medium">🇺🇸 United States</span>
                    <span className="text-muted-foreground">24.1%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: "24.1%" }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 font-medium">🇩🇪 Germany</span>
                    <span className="text-muted-foreground">8.7%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: "8.7%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Links list */}
          <div className="space-y-3">
            <span className="text-xs font-semibold block">Recent Links</span>
            <div className="border border-border/50 rounded-xl bg-background overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/15 text-muted-foreground">
                      <th className="p-3 font-semibold">Short URL</th>
                      <th className="p-3 font-semibold">Original URL</th>
                      <th className="p-3 font-semibold text-right">Clicks</th>
                      <th className="p-3 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockLinks.map((link, i) => (
                      <tr key={i} className="border-b border-border/30 hover:bg-muted/5 transition-colors">
                        <td className="p-3 font-medium text-primary font-mono">{link.short}</td>
                        <td className="p-3 text-muted-foreground truncate max-w-[150px] font-mono">{link.original}</td>
                        <td className="p-3 text-right font-medium">{link.clicks}</td>
                        <td className="p-3 flex justify-center items-center gap-2">
                          <button className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground">
                            <Copy className="h-3 w-3" />
                          </button>
                          <button className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground">
                            <QrCode className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
