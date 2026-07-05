"use client";

import { useId } from "react";
import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  showWordmark?: boolean;
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
};

export function BrandLogo({
  href,
  showWordmark = true,
  className = "",
  iconClassName = "h-9 w-9",
  wordmarkClassName = "text-base",
}: BrandLogoProps) {
  const logoId = useId();
  const content = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 64 64"
        role="img"
        aria-label="NikkaLink"
        className={iconClassName}
      >
        <defs>
          <linearGradient id={`nikkalink-logo-a-${logoId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#57e6e8" />
            <stop offset="45%" stopColor="#ffdd75" />
            <stop offset="75%" stopColor="#ff8a3d" />
            <stop offset="100%" stopColor="#ff5c7a" />
          </linearGradient>
          <linearGradient id={`nikkalink-logo-b-${logoId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7ff0ff" />
            <stop offset="100%" stopColor="#16c7d6" />
          </linearGradient>
        </defs>
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 14 12 19v10l8 5 8-5V19z" stroke={`url(#nikkalink-logo-a-${logoId})`} strokeWidth="4.5" />
          <path d="M44 14 36 19v10l8 5 8-5V19z" stroke={`url(#nikkalink-logo-b-${logoId})`} strokeWidth="4.5" />
          <path d="M32 30 24 35v10l8 5 8-5V35z" stroke={`url(#nikkalink-logo-a-${logoId})`} strokeWidth="4.5" />
          <path d="M28 26h8" stroke={`url(#nikkalink-logo-b-${logoId})`} strokeWidth="4.5" />
          <path d="M20 34h8M36 34h8" stroke={`url(#nikkalink-logo-b-${logoId})`} strokeWidth="4.5" />
        </g>
      </svg>
      {showWordmark && (
        <span className={`font-semibold tracking-tight text-foreground ${wordmarkClassName}`}>
          NikkaLink
        </span>
      )}
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} className="inline-flex items-center hover:opacity-90 transition-opacity">
      {content}
    </Link>
  );
}