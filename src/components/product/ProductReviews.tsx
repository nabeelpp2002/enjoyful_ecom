"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MessageSquare, Loader2, X, CheckCircle2, UserCircle2 } from "lucide-react";
import { useData } from "@/context/DataContext";
import { AuthModal } from "@/components/layout/AuthModal";

interface Review {
    _id: string;
    user?: string;
    userName: string;
    userEmail?: string;
    avatarUrl?: string;
    rating: number;
    title?: string;
    comment: string;
    createdAt: string;
    isVerifiedPurchase?: boolean;
}

interface Summary {
    average: number;
    count: number;
    distribution: Record<string, number>;
}

interface ReviewsResponse {
    success: boolean;
    data: Review[];
    meta: { page: number; limit: number; total: number; totalPages: number };
    summary: Summary;
}

interface Props {
    productId: string;
    /** Initial avg + count from product (used until /api/reviews/product/:id returns) */
    initialAverage?: number;
    initialCount?: number;
}

type SortKey = "recent" | "highest" | "lowest";

const SORT_LABEL: Record<SortKey, string> = {
    recent: "Most recent",
    highest: "Highest rated",
    lowest: "Lowest rated",
};

function StarBar({ value, max = 5, size = 16, className = "" }: { value: number; max?: number; size?: number; className?: string }) {
    return (
        <div className={`flex items-center gap-0.5 ${className}`}>
            {Array.from({ length: max }).map((_, i) => {
                const filled = i < Math.round(value);
                return (
                    <Star
                        key={i}
                        size={size}
                        className={filled ? "text-[var(--color-brand-mustard)] fill-[var(--color-brand-mustard)]" : "text-gray-300"}
                    />
                );
            })}
        </div>
    );
}

function RatingPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map(n => (
                <button
                    key={n}
                    type="button"
                    onMouseEnter={() => setHover(n)}
                    onClick={() => onChange(n)}
                    className="p-1 -ml-1 transition-transform hover:scale-110"
                    aria-label={`Rate ${n} star${n === 1 ? '' : 's'}`}
                >
                    <Star
                        size={28}
                        className={(hover || value) >= n
                            ? "text-[var(--color-brand-mustard)] fill-[var(--color-brand-mustard)]"
                            : "text-gray-300"}
                    />
                </button>
            ))}
        </div>
    );
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function ProductReviews({ productId, initialAverage = 0, initialCount = 0 }: Props) {
    const { isAuthenticated, user } = useData();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [summary, setSummary] = useState<Summary>({
        average: initialAverage,
        count: initialCount,
        distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
    });
    const [sort, setSort] = useState<SortKey>("recent");
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showAuth, setShowAuth] = useState(false);

    // Form state
    const [rating, setRating] = useState(5);
    const [title, setTitle] = useState("");
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reviews/product/${productId}?sort=${sort}&limit=20`, { cache: 'no-store' });
            if (res.ok) {
                const body: ReviewsResponse = await res.json();
                setReviews(body.data ?? []);
                if (body.summary) setSummary(body.summary);
            }
        } finally {
            setLoading(false);
        }
    }, [productId, sort]);

    useEffect(() => { load(); }, [load]);

    // Find the current user's existing review for this product (if any).
    // Matches on user-id when available, then falls back to email.
    const myReview: Review | null = (() => {
        if (!isAuthenticated || !user) return null;
        const uid = (user as { _id?: string; id?: string })._id ?? (user as { id?: string }).id;
        const email = user.email?.toLowerCase();
        return reviews.find(r =>
            (uid && r.user === uid) ||
            (email && r.userEmail?.toLowerCase() === email)
        ) ?? null;
    })();

    const handleStartReview = () => {
        setSubmitError(null);
        setSubmitted(false);
        if (!isAuthenticated) {
            setShowAuth(true);
            return;
        }
        // Pre-fill the form with the user's existing review (edit mode)
        if (myReview) {
            setRating(myReview.rating);
            setTitle(myReview.title ?? "");
            setComment(myReview.comment);
        } else {
            setRating(5); setTitle(""); setComment("");
        }
        setShowForm(true);
    };

    // Auto-open the review form once the user signs in via the modal we just opened.
    useEffect(() => {
        if (isAuthenticated && showAuth && !showForm) {
            setShowAuth(false);
            setShowForm(true);
        }
    }, [isAuthenticated, showAuth, showForm]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitError(null);
        try {
            const isEdit = !!myReview;
            const url = isEdit ? `/api/reviews/${myReview!._id}` : '/api/reviews';
            const method = isEdit ? 'PATCH' : 'POST';
            const body = isEdit
                ? { rating, title: title.trim() || undefined, comment }
                : { productId, rating, title: title.trim() || undefined, comment };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (res.status === 401) {
                setShowForm(false);
                setShowAuth(true);
                return;
            }
            const respBody = await res.json();
            if (!res.ok) {
                // Server says we already have a review for this product →
                // refresh the list, which lets myReview populate, then
                // the next click on the CTA opens the EDIT flow.
                if (respBody?.error?.code === 'ALREADY_REVIEWED') {
                    setSubmitError("You've already reviewed this product. Switching to edit mode — try again.");
                    await load();
                    return;
                }
                setSubmitError(respBody?.error?.message ?? 'Could not submit review');
                return;
            }
            setSubmitted(true);
            if (!isEdit) { setRating(5); setTitle(""); setComment(""); }
            // Refresh the list
            await load();
            setTimeout(() => { setShowForm(false); setSubmitted(false); }, 1600);
        } finally {
            setSubmitting(false);
        }
    };

    const totalRated = Object.values(summary.distribution).reduce((a, b) => a + b, 0);

    return (
        <div className="border-t border-[var(--color-brand-onyx)]/10 pt-12 mt-12 pb-20 md:pb-24">
            <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
                <div>
                    <h2 className="font-heading font-bold text-2xl md:text-3xl text-[var(--color-brand-onyx)]">
                        Reviews
                    </h2>
                    <p className="text-sm text-[var(--color-brand-onyx)]/55 mt-1">
                        Real feedback from people using this product.
                    </p>
                </div>
                <button
                    onClick={handleStartReview}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--color-brand-purple)] text-white font-heading font-semibold text-sm hover:bg-[#5e4580] shadow-[0_4px_14px_rgba(115,86,151,0.25)] transition-colors"
                >
                    <MessageSquare className="w-4 h-4" /> {myReview ? "Edit your review" : "Write a review"}
                </button>
            </div>

            {/* Summary panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white rounded-3xl border border-[var(--color-brand-onyx)]/8 p-6 md:p-8 mb-8">
                <div className="text-center md:text-left">
                    <div className="text-5xl font-heading font-bold text-[var(--color-brand-onyx)]">
                        {summary.average.toFixed(1)}
                    </div>
                    <StarBar value={summary.average} size={18} className="mt-2 justify-center md:justify-start" />
                    <p className="text-xs text-[var(--color-brand-onyx)]/50 mt-2">
                        Based on {summary.count} review{summary.count === 1 ? '' : 's'}
                    </p>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                    {[5, 4, 3, 2, 1].map(stars => {
                        const c = summary.distribution[String(stars)] ?? 0;
                        const pct = totalRated > 0 ? (c / totalRated) * 100 : 0;
                        return (
                            <div key={stars} className="flex items-center gap-3 text-xs">
                                <span className="w-6 text-right tabular-nums text-[var(--color-brand-onyx)]/70">{stars}★</span>
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[var(--color-brand-mustard)] rounded-full transition-all"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <span className="w-8 text-right tabular-nums text-[var(--color-brand-onyx)]/40">{c}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Sort */}
            {reviews.length > 0 && (
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                    <p className="text-sm text-[var(--color-brand-onyx)]/55">
                        Showing {reviews.length} of {summary.count}
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--color-brand-onyx)]/40">Sort:</span>
                        {(Object.keys(SORT_LABEL) as SortKey[]).map(k => (
                            <button
                                key={k}
                                onClick={() => setSort(k)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                    sort === k
                                        ? 'bg-[var(--color-brand-onyx)] text-white'
                                        : 'bg-gray-100 text-[var(--color-brand-onyx)]/60 hover:bg-gray-200'
                                }`}
                            >
                                {SORT_LABEL[k]}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Reviews list */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--color-brand-onyx)]/30" />
                </div>
            ) : reviews.length === 0 ? null : (
                <div className="space-y-4">
                    {reviews.map(r => (
                        <motion.div
                            key={r._id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25 }}
                            className="bg-white rounded-2xl border border-[var(--color-brand-onyx)]/8 p-5 md:p-6"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-[var(--color-brand-purple)]/10 flex items-center justify-center text-[var(--color-brand-purple)] flex-shrink-0 overflow-hidden">
                                    {r.avatarUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={r.avatarUrl} alt={r.userName} className="w-full h-full object-cover" />
                                    ) : (
                                        <UserCircle2 className="w-7 h-7" strokeWidth={1.5} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-semibold text-sm text-[var(--color-brand-onyx)]">{r.userName}</p>
                                        {r.isVerifiedPurchase && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                                <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                                            </span>
                                        )}
                                        <span className="text-[11px] text-[var(--color-brand-onyx)]/40">· {formatDate(r.createdAt)}</span>
                                    </div>
                                    <StarBar value={r.rating} size={14} className="mt-1" />
                                    {r.title && (
                                        <p className="font-semibold text-sm text-[var(--color-brand-onyx)] mt-2.5">{r.title}</p>
                                    )}
                                    <p className="text-sm text-[var(--color-brand-onyx)]/70 leading-relaxed mt-1 whitespace-pre-wrap">
                                        {r.comment}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Write review modal */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !submitting && setShowForm(false)} />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="relative bg-white rounded-2xl p-6 md:p-8 w-full max-w-lg shadow-2xl"
                        >
                            <button onClick={() => !submitting && setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>

                            {submitted ? (
                                <div className="py-10 text-center">
                                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
                                        <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                                    </div>
                                    <h3 className="font-heading font-bold text-xl text-[var(--color-brand-onyx)]">Thanks for the review!</h3>
                                    <p className="text-sm text-[var(--color-brand-onyx)]/55 mt-1">It&apos;ll appear in the list shortly.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <h3 className="font-heading font-bold text-xl text-[var(--color-brand-onyx)]">{myReview ? "Edit your review" : "Write a review"}</h3>
                                        <p className="text-sm text-[var(--color-brand-onyx)]/55 mt-1">
                                            Signed in as <span className="font-medium text-[var(--color-brand-onyx)]">{user?.email}</span>
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-brand-onyx)]/60 mb-2">Your rating</label>
                                        <RatingPicker value={rating} onChange={setRating} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-brand-onyx)]/60 mb-1.5">Title (optional)</label>
                                        <input
                                            type="text" maxLength={120}
                                            value={title} onChange={e => setTitle(e.target.value)}
                                            placeholder="Sum it up in a few words"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-purple)]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-brand-onyx)]/60 mb-1.5">Your review *</label>
                                        <textarea
                                            required maxLength={2000} rows={5}
                                            value={comment} onChange={e => setComment(e.target.value)}
                                            placeholder="What did you like? How did it perform?"
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-purple)] resize-none"
                                        />
                                        <p className="text-[11px] text-gray-400 mt-1 text-right">{comment.length}/2000</p>
                                    </div>
                                    {submitError && (
                                        <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{submitError}</p>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="submit"
                                            disabled={submitting || !comment.trim()}
                                            className="flex-1 bg-[var(--color-brand-purple)] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#5e4580] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {submitting
                                                ? <><Loader2 className="w-4 h-4 animate-spin" />{myReview ? 'Saving…' : 'Submitting…'}</>
                                                : (myReview ? 'Save changes' : 'Submit review')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowForm(false)}
                                            disabled={submitting}
                                            className="px-4 py-3 rounded-xl text-sm text-[var(--color-brand-onyx)]/60 hover:text-[var(--color-brand-onyx)] disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AuthModal
                isOpen={showAuth}
                onClose={() => setShowAuth(false)}
                title="Sign in to leave a review"
                subtitle="We just need to know who you are. Use a code emailed to you — no password required."
            />
        </div>
    );
}
