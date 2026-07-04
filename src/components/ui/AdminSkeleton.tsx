export function AdminSkeleton({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse bg-black/5 rounded-xl ${className}`} />;
}

export function AdminTableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="bg-white border border-black/5 rounded-2xl overflow-hidden shadow-sm">
            <div className="border-b border-black/5 bg-[#F9F5F0]/60 px-6 py-4 flex gap-8">
                <AdminSkeleton className="h-4 w-32" />
                <AdminSkeleton className="h-4 w-20 hidden md:block" />
                <AdminSkeleton className="h-4 w-16 ml-auto" />
            </div>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="border-b border-black/4 last:border-0 px-6 py-4 flex items-center gap-4 animate-pulse">
                    <AdminSkeleton className="w-10 h-10 flex-shrink-0 !rounded-lg !bg-[#735697]/8" />
                    <div className="flex-1 space-y-2">
                        <AdminSkeleton className="h-4 w-3/4" />
                        <AdminSkeleton className="h-3 w-1/3" />
                    </div>
                    <AdminSkeleton className="h-4 w-20 hidden md:block" />
                    <AdminSkeleton className="h-4 w-16" />
                    <AdminSkeleton className="h-8 w-8 !rounded-lg" />
                </div>
            ))}
        </div>
    );
}

export function AdminCardSkeleton() {
    return (
        <div className="bg-white border border-black/5 rounded-2xl p-6 space-y-4 animate-pulse shadow-sm">
            <div className="flex items-center justify-between">
                <AdminSkeleton className="h-5 w-40" />
                <AdminSkeleton className="h-9 w-24 !rounded-xl" />
            </div>
            <AdminSkeleton className="aspect-video w-full !rounded-xl" />
            <AdminSkeleton className="h-4 w-2/3" />
            <AdminSkeleton className="h-4 w-1/2" />
        </div>
    );
}

export function AdminSlidesSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 bg-white border border-black/5 rounded-2xl p-4 animate-pulse shadow-sm">
                    <div className="w-24 aspect-video rounded-xl bg-black/5 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <AdminSkeleton className="h-4 w-1/2" />
                        <AdminSkeleton className="h-3 w-3/4" />
                    </div>
                    <AdminSkeleton className="h-7 w-16 !rounded-lg" />
                    <AdminSkeleton className="h-8 w-8 !rounded-lg" />
                </div>
            ))}
        </div>
    );
}
