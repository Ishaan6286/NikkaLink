"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  BarChart2,
  QrCode,
  Shield,
  Globe,
  Code2,
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  ChevronDown,
  Link2,
  Check,
  MousePointer,
  Share2,
} from "lucide-react";
import { LiveShortener } from "@/components/landing/LiveShortener";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { AppChrome } from "@/components/shared/AppChrome";
import { BrandLogo } from "@/components/shared/BrandLogo";

const LandingCommandPalette = dynamic(
  () =>
    import("@/components/landing/LandingCommandPalette").then(
      (m) => m.LandingCommandPalette
    ),
  { ssr: false }
);

const LandingClipboardPrompt = dynamic(
  () =>
    import("@/components/landing/LandingClipboardPrompt").then(
      (m) => m.LandingClipboardPrompt
    ),
  { ssr: false }
);

// ─── Data ──────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Zap,
    title: "Instant Short Links",
    description: "Create short links in milliseconds. No waiting, no hassle.",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  {
    icon: BarChart2,
    title: "Real-time Analytics",
    description: "Track clicks, locations, devices, browsers, and referrers in real-time.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    icon: Code2,
    title: "Custom Aliases",
    description: "Personalize your links with custom aliases that are easy to remember.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: QrCode,
    title: "QR Code",
    description: "Generate beautiful QR codes for every link. Download and share anywhere.",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description: "Your links are safe with redirects, rate limiting & spam protection.",
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
  {
    icon: Globe,
    title: "Developer Friendly",
    description: "Powerful API to integrate link shortening into your own apps.",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
];

const howItWorks = [
  {
    icon: Link2,
    step: "1",
    title: "Paste Your Link",
    desc: "Drop in your long URL in the box above.",
  },
  {
    icon: Zap,
    step: "2",
    title: "Get Your Short Link",
    desc: "We generate a short, shareable link instantly.",
  },
  {
    icon: Share2,
    step: "3",
    title: "Share & Track",
    desc: "Share it anywhere and track performance.",
  },
];

const whyNikkaLink = [
  "No forced signup for basic use",
  "Distraction-free experience",
  "Lightning-fast performance",
  "Beautiful analytics dashboard",
  "Developer API",
  "Privacy-focused & secure",
  "Works across all devices",
];

const faqs = [
  {
    q: "Why do I need an account?",
    a: "You don't need an account to shorten links! Sign up only if you want to track analytics, manage links, or use custom aliases.",
  },
  {
    q: "Are the links permanent?",
    a: "Yes, links are permanent by default unless you set an expiry date or manually delete them from your dashboard.",
  },
  {
    q: "Does NikkaLink expire links?",
    a: "Links only expire if you explicitly set an expiration date. Otherwise they remain active forever.",
  },
  {
    q: "Is there a limit on free links?",
    a: "There is no hard limit on the number of links you can create. The platform is built to scale.",
  },
  {
    q: "Can I track my links without logging in?",
    a: "Basic shortening works without an account. For analytics, click tracking, and link management, you need to be signed in.",
  },
];

// ─── Sub-Components ────────────────────────────────────────────────────────────

function FeatureCard({ icon: Icon, title, description, color, bg, index }: {
  icon: React.ElementType; title: string; description: string;
  color: string; bg: string; index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      className="group rounded-2xl border border-border/50 bg-card/60 p-6 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 backdrop-blur-sm"
    >
      <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${bg} group-hover:scale-110 transition-transform`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <h3 className="mb-2 text-base font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}

function StepCard({ icon: Icon, step, title, desc, index }: {
  icon: React.ElementType; step: string; title: string; desc: string; index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.12 }}
      className="flex flex-col items-center text-center px-6"
    >
      <div className="relative mb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
          <Icon className="h-7 w-7 text-primary" />
        </div>
        <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
          {step}
        </div>
      </div>
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-[200px]">{desc}</p>
    </motion.div>
  );
}

function LiveDemoPreview() {
  const [copied, setCopied] = useState(false);
  const shortLink = "nikka.link/abc123";

  const handleCopy = () => {
    navigator.clipboard.writeText("https://" + shortLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mx-auto max-w-md rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-5 shadow-2xl"
    >
      <div className="mb-4 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground font-mono truncate border border-border/40">
        https://example.com/very-long-link
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 p-3">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-0.5">Short Link</p>
          <p className="font-semibold text-primary text-sm font-mono">{shortLink}</p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={handleCopy}
            className="h-8 w-8 rounded-lg bg-background flex items-center justify-center text-muted-foreground hover:text-primary border border-border/50 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button className="h-8 w-8 rounded-lg bg-background flex items-center justify-center text-muted-foreground hover:text-primary border border-border/50 transition-colors">
            <QrCode className="h-3.5 w-3.5" />
          </button>
          <button className="h-8 w-8 rounded-lg bg-background flex items-center justify-center text-muted-foreground hover:text-primary border border-border/50 transition-colors">
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <MousePointer className="h-3 w-3" /> Total Clicks: <span className="font-semibold text-foreground">1,234</span>
        </span>
        <span>Created just now</span>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-3 pt-3 border-t border-border/40">
        Try it above. No signup required.
      </p>
    </motion.div>
  );
}

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      className="border border-border/50 rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium hover:bg-muted/30 transition-colors"
      >
        {q}
        <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 ml-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-3">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Landing Page ─────────────────────────────────────────────────────────

export default function LandingPage() {
  const [clipboardUrl, setClipboardUrl] = useState<string | undefined>();

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <AppChrome />
      <LandingCommandPalette />
      <LandingClipboardPrompt
        onPaste={(url) => setClipboardUrl(url)}
      />

      <LandingNavbar />

      <main className="flex-1 pt-16">

        {/* ── Hero Section ─────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-4 pt-14 pb-20 sm:px-6 sm:pt-24 sm:pb-28 text-center">
          {/* Gradient orbs */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-40 -z-10 overflow-hidden blur-3xl">
            <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-cyan-400 to-orange-400 opacity-15 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl"
          >


            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1] mb-5">
              Shorten Links.<br />
              <span className="bg-gradient-to-r from-cyan-400 via-primary to-orange-500 bg-clip-text text-transparent">
                Track What Matters.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto mb-4">
              Create short links in seconds, share anywhere, and monitor performance with beautiful analytics. No signup required.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground mb-8">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> No signup required</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Instant results</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Secure & free links</span>
            </div>

            <LiveShortener
              initialUrl={clipboardUrl}
              onInitialUrlConsumed={() => setClipboardUrl(undefined)}
            />
          </motion.div>
        </section>

        {/* ── Features Section ─────────────────────────────────────────────── */}
        <section id="features" className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-14"
            >
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Everything You Need. Nothing You Don&apos;t.
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Powerful features to help you shorten, manage, and track your links effortlessly.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f, i) => (
                <FeatureCard key={f.title} {...f} index={i} />
              ))}
            </div>
            <div className="text-center mt-10">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-6 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
              >
                Explore All Features <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── How It Works ─────────────────────────────────────────────────── */}
        <section id="how-it-works" className="px-4 py-20 sm:px-6 bg-muted/20 border-y border-border/40">
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Shorten in 3 Simple Steps
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connecting lines between steps on desktop */}
              <div className="hidden md:block absolute top-[52px] left-[33%] right-[33%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              {howItWorks.map((s, i) => (
                <StepCard key={s.step} {...s} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Why NikkaLink + Live Demo Preview ────────────────────────────── */}
        <section className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                  Why NikkaLink?
                </h2>
                <p className="text-lg font-semibold text-primary mb-6">Built to Simplify. Better. Faster.</p>
                <ul className="space-y-3">
                  {whyNikkaLink.map((item) => (
                    <li key={item} className="flex items-center gap-3 text-muted-foreground">
                      <div className="h-5 w-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold">See NikkaLink in Action</h3>
                  <p className="text-sm text-muted-foreground mt-1">A mini live preview card</p>
                </div>
                <LiveDemoPreview />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── CTA Section ──────────────────────────────────────────────────── */}
        <section className="px-4 py-20 sm:px-6 border-y border-border/40 bg-muted/20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Start Shortening Smarter Today
            </h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of users who trust NikkaLink for their links.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all"
              >
                Start Shortening Now <span className="text-primary-foreground/70 text-xs">(It&apos;s Free)</span>
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-8 py-3 text-sm font-semibold hover:bg-muted transition-colors"
              >
                Explore Features
              </Link>
            </div>
          </motion.div>
        </section>

        {/* ── FAQ Section ──────────────────────────────────────────────────── */}
        <section id="faq" className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
            </motion.div>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <FAQItem key={i} {...faq} index={i} />
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 bg-muted/10 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col items-center gap-6 text-center">
          <BrandLogo href="/" iconClassName="h-8 w-8" wordmarkClassName="text-lg" />
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link href="/features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} NikkaLink. All rights reserved.
          </p>
          <a
            href="https://github.com/Ishaan6286"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
          >
            Know about the developer
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </footer>
    </div>
  );
}
