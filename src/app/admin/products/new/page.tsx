"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProductForm } from "../ProductForm";

function NewProductInner() {
    const params = useSearchParams();
    const [prefill, setPrefill] = useState<Record<string, unknown> | undefined>(undefined);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // When opened via "Add Size" from a product family, pre-fill shared details.
        if (params.get("prefill")) {
            try {
                const raw = sessionStorage.getItem("enjoyful-admin-new-prefill");
                if (raw) setPrefill(JSON.parse(raw));
                sessionStorage.removeItem("enjoyful-admin-new-prefill");
            } catch {}
        }
        setReady(true);
    }, [params]);

    if (!ready) return null;
    // initialData prefills the form, but isEdit stays false → this creates a NEW product (variant).
    return <ProductForm initialData={prefill} />;
}

export default function NewProductPage() {
    return (
        <Suspense fallback={null}>
            <NewProductInner />
        </Suspense>
    );
}
