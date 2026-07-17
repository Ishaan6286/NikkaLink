import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { AppChrome } from "@/components/shared/AppChrome";
import { Zap, BarChart2, Code2, QrCode, Shield, Globe } from "lucide-react";

export const metadata = {
  title: "Features | NikkaLink",
  description: "Explore the premium features of the NikkaLink URL management platform.",
};

const featureList = [
  {
    icon: Zap,
    title: "Instant Short Links",
    description: "Create short links in milliseconds. Our fast routing technology ensures immediate redirection with zero latency.",
  },
  {
    icon: BarChart2,
    title: "Real-time Analytics",
    description: "Gain insight on clicks, locations, browsers, and referrers in real time with our premium visual dashboards.",
  },
  {
    icon: Code2,
    title: "Custom Aliases",
    description: "Personalize your links. Replace generic random strings with recognizable aliases that look professional and build trust.",
  },
  {
    icon: QrCode,
    title: "Dynamic QR Codes",
    description: "Generate matching premium QR codes for every link. Customize and download them for printed media, flyers, or websites.",
  },
  {
    icon: Shield,
    title: "Advanced Security",
    description: "Secure redirect flows, rate limiting, and spam filters to protect you and your users from malicious URLs.",
  },
  {
    icon: Globe,
    title: "Developer API",
    description: "An easy-to-use, robust REST API allowing creators and developers to integrate NikkaLink shortening directly into their apps.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <LandingNavbar />
      <AppChrome />
      
      <main className="flex-1 max-w-6xl mx-auto px-6 py-24 sm:py-32 w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4 bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
            NikkaLink Features
          </h1>
          <p className="text-lg text-muted-foreground">
            A premium toolset built to make your link management smarter, faster, and more beautiful.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featureList.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="p-6 rounded-2xl bg-card border border-border/60 hover:border-primary/50 transition-all hover-lift shadow-sm space-y-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="border-t border-border/40 bg-muted/10 px-4 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} NikkaLink. All rights reserved.
      </footer>
    </div>
  );
}
