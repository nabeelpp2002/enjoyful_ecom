"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ProductForm } from "../../ProductForm";

export default function EditProductPage() {
    const params = useParams();
    const id = params.id as string;

    const [data, setData] = useState<Record<string, unknown> | null>(() => {
        if (typeof window === "undefined") return null;
        try {
            const cached = sessionStorage.getItem(`enjoyful-admin-product-${id}`);
            if (cached) {
                const product = JSON.parse(cached);
                return { ...product, id: String(product.id ?? product._id ?? id) };
            }
        } catch {}
        return null;
    });
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        let cancelled = false;
        fetch(`/api/admin/products/${id}`, { cache: "no-store" })
            .then(r => (r.ok ? r.json() : null))
            .then(res => {
                if (cancelled) return;
                if (!res) {
                    if (!data) setNotFound(true);
                    return;
                }
                const product = res?.data ?? res;
                const fresh = { ...product, id: String(product._id ?? product.id ?? id) };
                setData(fresh);
                try {
                    sessionStorage.setItem(`enjoyful-admin-product-${id}`, JSON.stringify(fresh));
                } catch {}
            })
            .catch(() => { if (!cancelled && !data) setNotFound(true); });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    if (!data && notFound) {
        return <p className="text-[#1A1A1B]/40 text-sm">Product not found.</p>;
    }

    if (!data) {
        return (
            <div className="max-w-3xl space-y-5">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-5 h-5 bg-black/5 rounded animate-pulse" />
                    <div className="h-7 w-40 bg-black/5 animate-pulse rounded-xl" />
                </div>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm">
                        <div className="h-4 w-32 bg-black/5 animate-pulse rounded mb-4" />
                        <div className="space-y-3">
                            <div className="h-10 bg-black/5 animate-pulse rounded-xl" />
                            <div className="h-10 bg-black/5 animate-pulse rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return <ProductForm initialData={data} isEdit />;
}
