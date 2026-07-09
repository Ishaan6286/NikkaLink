"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Key,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Terminal,
  Shield,
  Info,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/env";
import { urlService } from "@/services/urlService";

function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group rounded-xl border border-border/50 bg-[#0d1117] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 bg-white/[0.02]">
        <span className="text-[11px] text-muted-foreground font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <><CheckCircle2 className="h-3 w-3 text-green-500" /> Copied</>
          ) : (
            <><Copy className="h-3 w-3" /> Copy</>
          )}
        </button>
      </div>
      <pre className="p-4 text-xs text-green-400 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
        {code}
      </pre>
    </div>
  );
}

export default function APIKeysPage() {
  const [token, setToken] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const apiUrl = getApiUrl();
  const apiDocsUrl = urlService.getApiDocsUrl();

  useEffect(() => {
    setToken(localStorage.getItem("access_token"));
  }, []);

  const handleCopyToken = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    toast.success("Token copied to clipboard!");
  };

  const handleRefresh = () => {
    const fresh = localStorage.getItem("access_token");
    setToken(fresh);
    toast.success("Token refreshed from session.");
  };

  const maskedToken = token
    ? `${token.slice(0, 20)}${"•".repeat(30)}${token.slice(-10)}`
    : null;

  const exampleCurl = token
    ? `curl -X GET "${apiUrl}/api/v1/urls" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json"`
    : `curl -X GET "${apiUrl}/api/v1/urls" \\
  -H "Authorization: Bearer <your-token>" \\
  -H "Content-Type: application/json"`;

  const exampleCreateURL = token
    ? `curl -X POST "${apiUrl}/api/v1/urls" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{"original_url": "https://example.com", "alias": "my-link"}'`
    : `curl -X POST "${apiUrl}/api/v1/urls" \\
  -H "Authorization: Bearer <your-token>" \\
  -H "Content-Type: application/json" \\
  -d '{"original_url": "https://example.com", "alias": "my-link"}'`;

  const exampleJS = token
    ? `const response = await fetch("${apiUrl}/api/v1/urls", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${token.slice(0, 20)}...",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    original_url: "https://example.com",
    alias: "my-link",
  }),
});
const data = await response.json();
console.log(data.short_url);`
    : `const response = await fetch("${apiUrl}/api/v1/urls", {
  method: "POST",
  headers: {
    "Authorization": "Bearer <your-token>",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    original_url: "https://example.com",
  }),
});`;

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Key className="h-6 w-6 text-primary" />
          API Access
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Use your NikkaLink session token to access the API programmatically.
        </p>
      </div>

      {/* Info banner */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex gap-3">
        <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-blue-300">JWT-Based Authentication</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            NikkaLink uses short-lived JWT tokens for authentication. Your current session token
            is shown below and is refreshed automatically. For long-running scripts, re-login to
            obtain a fresh token. Dedicated API key management is coming soon.
          </p>
        </div>
      </div>

      {/* Current token */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border/50 rounded-2xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Current Session Token</span>
          </div>
          <Badge variant="outline" className="border-green-500/40 text-green-400 text-[10px]">
            Active
          </Badge>
        </div>

        {token ? (
          <>
            <div className="relative rounded-lg border border-border/50 bg-muted/30 p-3 font-mono text-xs text-foreground/80 break-all leading-relaxed">
              {visible ? token : maskedToken}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" className="gap-2 h-8 text-xs" onClick={handleCopyToken}>
                <Copy className="h-3 w-3" />
                Copy Token
              </Button>
              <Button size="sm" variant="outline" className="gap-2 h-8 text-xs" onClick={() => setVisible((v) => !v)}>
                {visible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {visible ? "Hide" : "Reveal"}
              </Button>
              <Button size="sm" variant="ghost" className="gap-2 h-8 text-xs" onClick={handleRefresh}>
                <RefreshCw className="h-3 w-3" />
                Refresh
              </Button>
              <Button size="sm" variant="ghost" className="gap-2 h-8 text-xs ml-auto" render={<a href={apiDocsUrl} target="_blank" rel="noreferrer" />} nativeButton={false}>
                <ExternalLink className="h-3 w-3" />
                API Docs
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No active session. Please log in.</p>
        )}
      </motion.div>

      {/* Code examples */}
      <div className="space-y-6">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          Code Examples
        </h2>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">List all your links</p>
            <CodeBlock code={exampleCurl} language="bash" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">Create a short link</p>
            <CodeBlock code={exampleCreateURL} language="bash" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-medium">JavaScript / TypeScript</p>
            <CodeBlock code={exampleJS} language="javascript" />
          </div>
        </div>
      </div>

      {/* Endpoints quick ref */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Quick Reference</h2>
        <div className="rounded-xl border border-border/50 overflow-hidden divide-y divide-border/30">
          {[
            { method: "POST", path: "/api/v1/urls", desc: "Create a short link" },
            { method: "GET", path: "/api/v1/urls", desc: "List your links (paginated)" },
            { method: "GET", path: "/api/v1/urls/{code}", desc: "Get link details" },
            { method: "PATCH", path: "/api/v1/urls/{code}", desc: "Update a link" },
            { method: "DELETE", path: "/api/v1/urls/{code}", desc: "Delete a link" },
            { method: "GET", path: "/api/v1/urls/{code}/qr", desc: "Get QR code image" },
            { method: "GET", path: "/api/v1/analytics/{code}", desc: "Get analytics for a link" },
          ].map((ep) => (
            <div key={`${ep.method}-${ep.path}`} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                ep.method === "GET" ? "bg-blue-500/15 text-blue-400" :
                ep.method === "POST" ? "bg-green-500/15 text-green-400" :
                ep.method === "PATCH" ? "bg-amber-500/15 text-amber-400" :
                "bg-red-500/15 text-red-400"
              }`}>
                {ep.method}
              </span>
              <span className="font-mono text-xs text-foreground/80 shrink-0">{ep.path}</span>
              <span className="text-xs text-muted-foreground ml-auto text-right">{ep.desc}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Full interactive docs available at{" "}
          <a href={apiDocsUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
            {apiDocsUrl}
          </a>
        </p>
      </div>
    </div>
  );
}
