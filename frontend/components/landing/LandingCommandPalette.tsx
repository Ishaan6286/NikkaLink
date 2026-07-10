"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  BarChart2,
  ExternalLink,
  LayoutDashboard,
  Link2,
  Moon,
  QrCode,
  Search,
  Sun,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";
import { buildApiDocsUrl } from "@/lib/env";

export function LandingCommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "/" && !open) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        window.dispatchEvent(new Event("nikkalink:focus-url"));
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open]);

  const run = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search commands…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() =>
              run(() => window.dispatchEvent(new Event("nikkalink:focus-url")))
            }
          >
            <Zap className="mr-2 h-4 w-4" />
            Shorten a Link
            <CommandShortcut>/</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(() => window.dispatchEvent(new Event("nikkalink:open-qr")))
            }
          >
            <QrCode className="mr-2 h-4 w-4" />
            Generate QR Code
            <CommandShortcut>⌘⇧Q</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(() => document.getElementById("recent-links")?.scrollIntoView({ behavior: "smooth" }))
            }
          >
            <Link2 className="mr-2 h-4 w-4" />
            Recent Links
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => window.dispatchEvent(new Event("nikkalink:focus-url")))}
          >
            <Search className="mr-2 h-4 w-4" />
            Focus URL Input
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => run(() => router.push("/dashboard"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => run(() => router.push("/dashboard/analytics"))}>
            <BarChart2 className="mr-2 h-4 w-4" />
            Analytics
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(() => window.open(buildApiDocsUrl(), "_blank"))
            }
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Documentation
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Theme">
          <CommandItem
            onSelect={() =>
              run(() => setTheme(theme === "dark" ? "light" : "dark"))
            }
          >
            {theme === "dark" ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            Toggle Theme
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
