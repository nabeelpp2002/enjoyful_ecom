"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch("/api/admin/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            if (res.ok) {
                router.push("/admin");
                router.refresh();
            } else {
                setError("Invalid email or password. Please try again.");
            }
        } catch {
            setError("A network error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F9F5F0] flex items-center justify-center p-4">
            {/* Decorative blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#735697]/8 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#F4B449]/15 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative"
            >
                <div className="bg-white border border-black/5 rounded-3xl p-10 shadow-[0_8px_40px_rgba(0,0,0,0.07)]">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#735697]/10 mb-4">
                            <Lock className="w-7 h-7 text-[#735697]" />
                        </div>
                        <h1 className="text-2xl font-bold text-[#1A1A1B] tracking-tight font-heading">enJoyful Admin</h1>
                        <p className="text-sm text-[#1A1A1B]/50 mt-1">Sign in to manage your store</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-[#1A1A1B]/60 mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1B]/30" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="admin@enjoyfullife.com"
                                    className="w-full pl-11 pr-4 py-3.5 bg-[#F9F5F0] border border-black/8 rounded-xl text-[#1A1A1B] placeholder:text-[#1A1A1B]/25 focus:outline-none focus:border-[#735697]/50 focus:bg-white transition-all text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#1A1A1B]/60 mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1B]/30" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-12 py-3.5 bg-[#F9F5F0] border border-black/8 rounded-xl text-[#1A1A1B] placeholder:text-[#1A1A1B]/25 focus:outline-none focus:border-[#735697]/50 focus:bg-white transition-all text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1A1A1B]/30 hover:text-[#1A1A1B]/60 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-sm"
                            >
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </motion.div>
                        )}

                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="w-full py-3.5 rounded-xl bg-[#735697] hover:bg-[#5e4580] text-white font-semibold text-sm transition-colors disabled:opacity-50 mt-2 shadow-[0_4px_16px_rgba(115,86,151,0.25)]"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Signing in...
                                </span>
                            ) : "Sign In"}
                        </motion.button>
                    </form>
                </div>
                <p className="text-center text-[#1A1A1B]/25 text-xs mt-6">
                    enJoyful Life © {new Date().getFullYear()} · Admin Portal
                </p>
            </motion.div>
        </div>
    );
}
