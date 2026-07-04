import { WifiOff } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Offline | NikkaLink",
};

export default function Offline() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-6">
        <WifiOff className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-3">You are offline</h1>
      <p className="text-muted-foreground max-w-sm mb-8">
        It looks like you don't have an active internet connection. Please check your network settings and try again.
      </p>
      <Button onClick={() => window.location.reload()}>
        Try Again
      </Button>
    </div>
  );
}
