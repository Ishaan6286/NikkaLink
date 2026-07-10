"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Link2, BarChart2, Loader2 } from "lucide-react";
import { intelligenceService } from "@/services/intelligenceService";
import type { PublicProfile } from "@/types";
import { getPublicAppUrl } from "@/lib/env";
import Image from "next/image";

export default function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [slug, setSlug] = useState("");

  useEffect(() => {
    params.then((p) => {
      setSlug(p.slug);
      intelligenceService
        .getPublicProfile(p.slug)
        .then(setProfile)
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    });
  }, [params]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Profile not found or is private.</p>
      </div>
    );
  }

  const theme = profile.theme_config as { accent?: string };
  const accent = theme?.accent ?? "#6366f1";

  return (
    <div className="min-h-screen bg-background">
      <div
        className="h-32 w-full"
        style={{ background: `linear-gradient(135deg, ${accent}40, ${accent}10)` }}
      />
      <div className="max-w-2xl mx-auto px-4 -mt-16 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card shadow-xl p-8"
        >
          <div className="flex items-center gap-4 mb-6">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.display_name}
                width={72}
                height={72}
                className="rounded-full ring-4 ring-background"
                unoptimized
              />
            ) : (
              <div
                className="flex h-[72px] w-[72px] items-center justify-center rounded-full text-2xl font-bold text-white"
                style={{ backgroundColor: accent }}
              >
                {profile.display_name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{profile.display_name}</h1>
              <p className="text-sm text-muted-foreground">@{profile.profile_slug ?? profile.username}</p>
            </div>
          </div>

          {profile.bio && (
            <p className="text-muted-foreground mb-6">{profile.bio}</p>
          )}

          <div className="flex gap-4 mb-8 text-sm">
            <span className="flex items-center gap-1.5">
              <Link2 className="h-4 w-4 text-primary" />
              {profile.public_stats.total_links} links
            </span>
            <span className="flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4 text-primary" />
              {profile.public_stats.total_clicks} clicks
            </span>
          </div>

          {profile.pinned_links.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Pinned Links
              </h2>
              {profile.pinned_links.map((link) => (
                <a
                  key={link.short_code}
                  href={`${getPublicAppUrl()}/${link.short_code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {link.note_title || link.original_url}
                    </p>
                    <p className="text-xs text-muted-foreground">{link.total_clicks} clicks</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
