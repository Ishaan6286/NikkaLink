"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X, Link2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  extractDomain,
  faviconUrl,
  isValidUrl,
  normalizeUrlInput,
  trimUrl,
} from "@/lib/url-utils";
import { useMetadataPreview } from "@/hooks/useMetadataPreview";
import Image from "next/image";

export interface SmartUrlInputHandle {
  focus: () => void;
  getValue: () => string;
}

interface SmartUrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  isLoading?: boolean;
  error?: string;
  placeholder?: string;
  id?: string;
  className?: string;
  showPreview?: boolean;
}

export const SmartUrlInput = forwardRef<SmartUrlInputHandle, SmartUrlInputProps>(
  function SmartUrlInput(
    {
      value,
      onChange,
      onSubmit,
      isLoading,
      error,
      placeholder = "Paste or type a URL…",
      id = "url-input",
      className,
      showPreview = true,
    },
    ref
  ) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [focused, setFocused] = useState(false);
    const [touched, setTouched] = useState(false);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      getValue: () => value,
    }));

    const normalized = value ? normalizeUrlInput(value) : "";
    const valid = value.length > 0 && isValidUrl(value);
    const invalid = touched && value.length > 0 && !valid;
    const domain = valid ? extractDomain(value) : null;
    const { metadata, loading: metaLoading } = useMetadataPreview(
      value,
      showPreview && valid
    );
    const previewTitle = metadata?.title || metadata?.site_name;
    const previewFavicon = metadata?.favicon_url || (domain ? faviconUrl(value, 20) : "");

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(trimUrl(e.target.value));
      },
      [onChange]
    );

    const handlePaste = useCallback(
      (e: React.ClipboardEvent<HTMLInputElement>) => {
        const pasted = e.clipboardData.getData("text");
        if (pasted) {
          e.preventDefault();
          onChange(trimUrl(pasted));
        }
      },
      [onChange]
    );

    const handleClear = () => {
      onChange("");
      inputRef.current?.focus();
    };

    useEffect(() => {
      const onFocus = () => inputRef.current?.focus();
      window.addEventListener("nikkalink:focus-url", onFocus);
      return () => window.removeEventListener("nikkalink:focus-url", onFocus);
    }, []);

    return (
      <div className={cn("space-y-2", className)}>
        <div className="relative">
          {showPreview && domain && previewFavicon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
              <Image
                src={previewFavicon}
                alt=""
                width={20}
                height={20}
                className="rounded-sm"
                unoptimized
              />
            </div>
          )}
          <Input
            ref={inputRef}
            id={id}
            type="url"
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            onPaste={handlePaste}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              setTouched(true);
              if (value && !value.match(/^https?:\/\//i)) {
                onChange(normalizeUrlInput(value));
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && onSubmit) {
                e.preventDefault();
                onSubmit();
              }
            }}
            className={cn(
              "h-11 bg-background transition-all duration-200",
              showPreview && domain && "pl-10",
              value && "pr-20",
              focused && "ring-2 ring-primary/30 border-primary/50 shadow-[0_0_0_3px_oklch(0.7_0.15_200_/_0.08)]",
              invalid && "border-destructive/60 ring-destructive/20"
            )}
            aria-invalid={invalid}
            aria-describedby={error ? `${id}-error` : undefined}
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </motion.div>
              ) : value ? (
                <motion.button
                  key="clear"
                  type="button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleClear}
                  className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Clear URL"
                >
                  <X className="h-3.5 w-3.5" />
                </motion.button>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {showPreview && valid && domain && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2 overflow-hidden space-y-1"
            >
              <div className="flex items-center gap-2 min-w-0">
                {metaLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                ) : (
                  <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
                )}
                <span className="text-xs font-medium text-foreground truncate">
                  {previewTitle || domain}
                </span>
                <span className="text-xs text-muted-foreground/60 ml-auto shrink-0 hidden sm:inline">
                  Enter to shorten
                </span>
              </div>
              {previewTitle && (
                <p className="text-[11px] text-muted-foreground truncate pl-5">
                  {domain}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {(error || invalid) && (
          <p
            id={`${id}-error`}
            className="flex items-center gap-1.5 text-xs text-destructive"
            role="alert"
          >
            <AlertCircle className="h-3 w-3 shrink-0" />
            {error || "Please enter a valid URL"}
          </p>
        )}
      </div>
    );
  }
);
