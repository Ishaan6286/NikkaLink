import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Log In | NikkaLink",
  description: "Sign in to your NikkaLink account.",
  canonical: "/login",
  robots: "noindex,nofollow",
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
