"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useScrollNavbar } from "@/hooks/useScrollNavbar";
import { cn } from "@/lib/utils";

export function LandingNavbar() {
  const { data: session, status } = useSession();
  const { hidden, scrolled } = useScrollNavbar();

  return (
    <motion.header
      initial={false}
      animate={{ y: hidden ? -72 : 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-[background,box-shadow,border] duration-300",
        scrolled
          ? "border-b border-border/50 bg-background/85 backdrop-blur-xl shadow-sm"
          : "border-b border-transparent bg-background/60 backdrop-blur-md"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center">
          <BrandLogo iconClassName="h-10 w-10" wordmarkClassName="text-xl" />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-foreground transition-colors">
            How It Works
          </a>
          <a href="#faq" className="hover:text-foreground transition-colors">
            FAQ
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mx-4" />
          ) : status === "authenticated" ? (
            <>
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                Dashboard
              </Link>
              <Link href="/dashboard/profile">
                <Avatar className="h-8 w-8 ring-2 ring-primary/20 hover:opacity-80 transition-opacity">
                  <AvatarImage
                    src={session?.user?.image ?? undefined}
                    alt={session?.user?.name ?? "User"}
                  />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                    {(session?.user?.name ?? session?.user?.email ?? "U")
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all hover:shadow-primary/30 active:scale-[0.98]"
              >
                Get Started <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}
