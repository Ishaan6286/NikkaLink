import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { AppChrome } from "@/components/shared/AppChrome";

export const metadata = {
  title: "Privacy Policy | NikkaLink",
  description: "Privacy Policy for NikkaLink URL Management Platform.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <LandingNavbar />
      <AppChrome />
      
      <main className="flex-1 max-w-4xl mx-auto px-6 py-24 sm:py-32 w-full">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-8 bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground mb-10">Last updated: July 17, 2026</p>
        
        <div className="space-y-8 text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">1. Information We Collect</h2>
            <p className="leading-relaxed">
              We collect information to provide better services to all our users. This includes:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Account Information:</strong> When you sign up, we collect your name, email, and authentication credentials.</li>
              <li><strong>Usage Details:</strong> We log requests to shortened links, including timestamps, IP address, user agent, browser, device, and geographical region (non-personally identifiable).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">2. How We Use Information</h2>
            <p className="leading-relaxed">
              The information collected is used to redirect URLs to their correct destinations, prevent spam, perform security checks, and generate real-time analytics for link creators. We do not sell or rent user details to third parties.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">3. Cookies and Tracking</h2>
            <p className="leading-relaxed">
              We use cookies to maintain your authentication session and save preferences. You can disable cookies in your browser settings, but some features of the service may not function properly.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">4. Security</h2>
            <p className="leading-relaxed">
              We implement industry-standard security protocols to protect your links and authentication tokens. However, no internet transmission is 100% secure.
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
