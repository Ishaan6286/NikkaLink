import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { AppChrome } from "@/components/shared/AppChrome";
import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Terms of Service | NikkaLink",
  description: "Review the NikkaLink Terms of Service. Learn about acceptable use, account responsibility, and the rules governing our URL shortening platform.",
  canonical: "/terms",
  keywords: ["terms of service", "nikkalink terms", "acceptable use policy"],
});

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <LandingNavbar />
      <AppChrome />
      
      <main className="flex-1 max-w-4xl mx-auto px-6 py-24 sm:py-32 w-full">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-8 bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
          Terms of Service
        </h1>
        <p className="text-muted-foreground mb-10">Last updated: July 17, 2026</p>
        
        <div className="space-y-8 text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By using NikkaLink, you agree to these Terms of Service. If you do not agree to all terms, do not use our services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">2. Account Responsibility</h2>
            <p className="leading-relaxed">
              You are responsible for keeping your credentials secure. Any activity occurring under your account is your sole responsibility. You agree to use the service only for lawful purposes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">3. Prohibited Content</h2>
            <p className="leading-relaxed">
              You may not use NikkaLink to shorten links pointing to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Malware, viruses, or phishing schemes.</li>
              <li>Illegal content or copyrighted content without authorization.</li>
              <li>Spam, harassment, or abusive content.</li>
            </ul>
            <p className="leading-relaxed mt-2">
              We reserve the right to delete links and suspend accounts found violating these rules.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">4. Limitation of Liability</h2>
            <p className="leading-relaxed">
              NikkaLink is provided &quot;as is&quot; without warranties of any kind. We are not liable for any service interruptions, loss of data, or damages arising from your use of the service.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border/40 bg-muted/10 px-4 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} NikkaLink. All rights reserved.
      </footer>
    </div>
  );
}
