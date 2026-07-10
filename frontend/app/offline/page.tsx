import Link from "next/link";
import { WifiOff } from "lucide-react";
import { BrandLogo } from "@/components/shared/BrandLogo";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-background">
      <BrandLogo iconClassName="h-12 w-12 mb-8" wordmarkClassName="text-2xl" />
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-6">
        <WifiOff className="h-7 w-7 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold mb-2">You&apos;re offline</h1>
      <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
        NikkaLink needs an internet connection for most features. Check your
        connection and try again.
      </p>
      <Link
        href="/"
        className="inline-flex items-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Try again
      </Link>
    </div>
  );
}
