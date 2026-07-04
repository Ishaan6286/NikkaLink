"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLogin } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Loader2, Lock, Mail, Zap, ArrowLeft } from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

const DEMO_EMAIL = "demo@nikkalink.com";
const DEMO_PASSWORD = "demo1234";

export default function LoginPage() {
  const login = useLogin();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const handleDemoLogin = () => {
    setValue("email", DEMO_EMAIL);
    setValue("password", DEMO_PASSWORD);
    login.mutate({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="absolute top-8 left-8 sm:top-12 sm:left-12">
        <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
      </div>

      <div className="flex justify-center mb-8 pt-8 sm:pt-0">
        <Link href="/" className="flex items-center">
          <Image src="/logo.png" alt="NikkaLink Logo" width={192} height={48} className="h-12 w-auto object-contain" priority />
        </Link>
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>

        {/* Demo credentials banner */}
        <div className="mx-6 mb-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 rounded-md bg-primary/15 p-1.5">
              <Zap className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground mb-0.5">Try the Demo Account</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <span className="font-mono text-foreground/80">{DEMO_EMAIL}</span>
                {" · "}
                <span className="font-mono text-foreground/80">{DEMO_PASSWORD}</span>
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0 h-7 text-[11px] px-2.5 border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={handleDemoLogin}
              disabled={login.isPending}
            >
              {login.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Use Demo"}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit((d) => login.mutate(d))}>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-9"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-9"
                  {...register("password")}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Sign in
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}
