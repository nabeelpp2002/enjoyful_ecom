import React from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface BreadcrumbProps {
    items: { label: string; href?: string }[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
    return (
        <nav className="flex items-center gap-2 mb-8">
            {items.map((item, index) => (
                <React.Fragment key={index}>
                    {index > 0 && (
                        <ChevronRight size={16} className="text-[var(--color-brand-onyx)]/30" />
                    )}
                    {item.href ? (
                        <Link
                            href={item.href}
                            className="editorial-ui text-sm text-[var(--color-brand-onyx)]/60 transition-opacity duration-200 hover:opacity-100"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="editorial-ui text-sm text-[var(--color-brand-purple)]">
                            {item.label}
                        </span>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
}
