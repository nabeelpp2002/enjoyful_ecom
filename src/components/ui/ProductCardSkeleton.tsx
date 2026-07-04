import { Skeleton } from "./Skeleton";

export function ProductCardSkeleton() {
    return (
        <div className="flex flex-col h-full bg-white rounded-[1.5rem] p-3 shadow-sm relative">
            <Skeleton className="w-full pt-[100%] rounded-[1.25rem] bg-gray-100" />
            <div className="pt-6 sm:pt-8 pb-2 px-1 sm:px-2 flex flex-col items-center flex-grow justify-start w-full">
                <Skeleton className="h-4 sm:h-5 w-3/4 mb-2 rounded-md" />
                <Skeleton className="h-3 sm:h-4 w-1/4 rounded-md" />
            </div>
        </div>
    );
}
