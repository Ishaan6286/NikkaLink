"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { logAuthError } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  message: string;
}

export class AuthErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || "Unknown error" };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logAuthError("Auth UI crashed", {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="max-w-md w-full rounded-xl border border-border bg-card p-8 text-center space-y-4">
            <h1 className="text-lg font-semibold">
              {this.props.fallbackTitle ?? "Authentication error"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Something went wrong while loading your session. Check the browser
              console for details, then try signing in again.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button render={<Link href="/login" />}>Go to login</Button>
              <Button
                variant="outline"
                onClick={() => this.setState({ hasError: false, message: "" })}
              >
                Try again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
