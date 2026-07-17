import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { AppChrome } from "@/components/shared/AppChrome";
import { Target, Info, Shield, Users } from "lucide-react";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "About | NikkaLink",
  description: "Learn about NikkaLink's mission, features, and developer-first approach to smart, secure URL management.",
  canonical: "/about",
  keywords: ["about nikkalink", "url shortener team", "link management platform"],
});

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <LandingNavbar />
      <AppChrome />
      
      <main className="flex-1 max-w-4xl mx-auto px-6 py-24 sm:py-32 w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4 bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
            About NikkaLink
          </h1>
          <p className="text-lg text-muted-foreground">
            We build modern, premium link management tools to help creators, developers, and businesses share and analyze links with maximum speed and reliability.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm space-y-4 hover:border-primary/30 transition-all hover-lift">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Target className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold">Our Mission</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              To connect people and products through shorter, smarter, and safer URLs. We believe links are the core of online interaction and deserve premium analytics and management features.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm space-y-4 hover:border-primary/30 transition-all hover-lift">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Info className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold">Premium Features</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We offer instant short links, custom aliases, real-time analytics dashboards, beautiful dynamic QR codes, secure redirects, developer-first REST APIs, and link-in-bio user profile pages.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm space-y-4 hover:border-primary/30 transition-all hover-lift">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold">Privacy & Security</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Security is in our DNA. We implement strict rate limiting, secure redirect protocols, spam checks, and ensure user privacy by avoiding tracking personal identifiable data.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm space-y-4 hover:border-primary/30 transition-all hover-lift">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="text-xl font-bold">Developer First</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Integrate NikkaLink shortening directly into your workflows. Our robust, well-documented APIs are designed to scale with your traffic, giving you absolute control over link operations.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/40 bg-muted/10 px-4 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} NikkaLink. All rights reserved.
      </footer>
    </div>
  );
}
