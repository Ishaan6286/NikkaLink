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
  LogOut,
  Moon,
  Plus,
  QrCode,
  Search,
  Settings,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useLogout } from "@/hooks/useAuth";
import { buildApiDocsUrl } from "@/lib/env";

interface CommandPaletteProps {
  onCreateURL?: () => void;
}

export function CommandPalette({ onCreateURL }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const logout = useLogout();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const run = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => run(() => router.push("/dashboard"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => run(() => router.push("/dashboard/urls"))}>
            <Link2 className="mr-2 h-4 w-4" />
            My URLs
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => router.push("/dashboard/analytics"))}
          >
            <BarChart2 className="mr-2 h-4 w-4" />
            Analytics
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => router.push("/dashboard/profile"))}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => run(() => onCreateURL?.())}>
            <Plus className="mr-2 h-4 w-4" />
            Create Short URL
            <CommandShortcut>⌘K</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => router.push("/dashboard/urls"))}
          >
            <QrCode className="mr-2 h-4 w-4" />
            Generate QR
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(() => window.dispatchEvent(new Event("nikkalink:focus-url")))
            }
          >
            <Search className="mr-2 h-4 w-4" />
            Focus Search
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
            onSelect={() => run(() => setTheme(theme === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            Toggle theme
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Account">
          <CommandItem onSelect={() => run(logout)} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
