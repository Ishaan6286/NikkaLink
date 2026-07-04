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
} from "@/components/ui/command";
import {
  BarChart2,
  ExternalLink,
  LayoutDashboard,
  Link2,
  LogOut,
  Moon,
  Plus,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useLogout } from "@/hooks/useAuth";

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
            <User className="mr-2 h-4 w-4" />
            Profile
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => run(() => onCreateURL?.())}>
            <Plus className="mr-2 h-4 w-4" />
            Create Short URL
          </CommandItem>
          <CommandItem
            onSelect={() =>
              run(() => window.open("http://localhost:8000/docs", "_blank"))
            }
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open API Docs
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
