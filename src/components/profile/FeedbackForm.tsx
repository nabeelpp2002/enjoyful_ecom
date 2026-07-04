"use client";

import { useState } from "react";
import { Star, Send, CheckCircle2, Loader2 } from "lucide-react";

export function FeedbackForm({ onDone }: { onDone?: () => void }) {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [message, setMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async () => {
        if (message.trim().length < 2) {
            setError("Please write a short message.");
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rating, message: message.trim() }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.error?.message ?? body?.message ?? "Could not send feedback");
            }
            setDone(true);
            onDone?.();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Could not send feedback");
        } finally {
            setSubmitting(false);
        }
    };

    if (done) {
        return (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-6 flex flex-col items-center text-center">
                <CheckCircle2 size={32} className="text-emerald-500 mb-2" strokeWidth={1.6} />
                <p className="font-heading font-bold text-[var(--color-brand-onyx)]">Thank you!</p>
                <p className="text-sm text-[var(--color-brand-onyx)]/55 mt-0.5">Your feedback has been sent to our team.</p>
            </div>
        );
    }

    return (
        <div>
            <p className="text-xs text-[var(--color-brand-onyx)]/50 mb-3">Tell us how we&apos;re doing — it goes straight to our team.</p>

            {/* Star rating */}
            <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((n) => (
                    <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n === rating ? 0 : n)}
                        onMouseEnter={() => setHover(n)}
                        onMouseLeave={() => setHover(0)}
                        aria-label={`${n} star${n > 1 ? "s" : ""}`}
                        className="p-0.5 active:scale-90 transition-transform"
                    >
                        <Star
                            size={26}
                            className={n <= (hover || rating) ? "fill-amber-400 text-amber-400" : "text-[var(--color-brand-onyx)]/20"}
                            strokeWidth={1.5}
                        />
                    </button>
                ))}
            </div>

            <textarea
                value={message}
                onChange={(e) => { setMessage(e.target.value); if (error) setError(null); }}
                rows={4}
                maxLength={2000}
                placeholder="Write your feedback…"
                className="w-full rounded-xl border border-[var(--color-brand-onyx)]/12 bg-white px-3.5 py-2.5 text-sm text-[var(--color-brand-onyx)] placeholder:text-[var(--color-brand-onyx)]/35 focus:outline-none focus:border-[var(--color-brand-purple)]/40 resize-none"
            />

            {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}

            <button
                onClick={submit}
                disabled={submitting}
                className="mt-3 flex items-center justify-center gap-2 w-full rounded-xl bg-[var(--color-brand-purple)] py-3 text-white font-sans font-semibold text-[15px] active:scale-[0.98] transition-transform disabled:opacity-60"
            >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={17} strokeWidth={1.8} />}
                {submitting ? "Sending…" : "Send feedback"}
            </button>
        </div>
    );
}
