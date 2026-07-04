"use client";

import { useState } from "react";
import { Star, Send, User, Briefcase, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import api from "@/lib/api";

export function FeedbackBoard() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !comment.trim()) {
      toast.error("Please fill in your name and feedback.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/api/v1/feedback", {
        name: name.trim(),
        role: role.trim() || undefined,
        rating,
        comment: comment.trim(),
      });

      setName("");
      setRole("");
      setRating(5);
      setComment("");
      toast.success("Thank you! Your feedback has been privately sent to the product owner.");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="px-4 py-24 sm:px-6 bg-muted/20 border-t border-border/40">
      <div className="mx-auto max-w-xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight">Share Your Feedback</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Have suggestions or found a bug? Send your private feedback directly to the product owner.
          </p>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-xl space-y-6">
          <h3 className="text-lg font-semibold flex items-center gap-2 border-b border-border/40 pb-3">
            <MessageSquare className="h-5 w-5 text-primary" />
            Send Private Feedback
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Your Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9"
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Your Role / Company (optional)</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Software Engineer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="pl-9"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground block">Rating</label>
              <div className="flex items-center gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="transition-transform active:scale-95"
                    disabled={submitting}
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= (hoverRating ?? rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Feedback Comment *</label>
              <Textarea
                placeholder="Write your feedback here..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[100px] resize-y"
                required
                disabled={submitting}
              />
            </div>

            <Button type="submit" className="w-full gap-2 mt-2" disabled={submitting}>
              <Send className="h-4 w-4" />
              {submitting ? "Sending..." : "Send Feedback"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
