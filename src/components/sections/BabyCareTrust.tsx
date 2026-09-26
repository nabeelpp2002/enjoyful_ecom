import Image from "next/image";
import { Baby, BadgeCheck, HeartHandshake, Recycle } from "lucide-react";

const reasons = [
    {
        icon: Baby,
        title: "Pure Ingredients",
        description: "Naturally derived essentials made for delicate daily care.",
    },
    {
        icon: HeartHandshake,
        title: "Parent Trusted",
        description: "Made with real family routines and little moments in mind.",
    },
    {
        icon: BadgeCheck,
        title: "Dermatologist Tested",
        description: "Gentle care created for dependable everyday use.",
    },
    {
        icon: Recycle,
        title: "Eco-Friendly",
        description: "Thoughtful choices from formulation through packaging.",
    },
];

function ReasonCard({ reason }: { reason: (typeof reasons)[number] }) {
    const Icon = reason.icon;

    return (
        <article className="flex flex-col items-center justify-center px-3 py-5 text-center">
            <span className="mb-4 flex h-13 w-13 items-center justify-center rounded-2xl bg-[#fce8de] text-[#60453b] shadow-[0_8px_22px_rgba(102,72,58,.07)]">
                <Icon className="h-6 w-6" strokeWidth={1.4} />
            </span>
            <h3 className="editorial-heading text-base text-[var(--color-brand-onyx)] sm:text-lg">{reason.title}</h3>
            <p className="editorial-body mt-2 max-w-[210px] text-xs leading-relaxed text-[var(--color-brand-onyx)]/55">{reason.description}</p>
        </article>
    );
}

export function BabyCareTrust() {
    return (
        <section className="flex bg-[#f8efeb] py-12 sm:py-14 lg:min-h-[calc(100svh-5rem)] lg:items-center lg:py-10" aria-labelledby="baby-care-trust-title">
            <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
                <div className="mb-7 grid gap-4 md:grid-cols-[1fr_.9fr] md:items-start md:gap-16 lg:mb-8">
                    <h2 id="baby-care-trust-title" className="editorial-section-heading max-w-xl text-4xl text-[var(--color-brand-onyx)] sm:text-5xl lg:text-[56px]">
                        Why parents choose Enjoyful Life
                    </h2>
                    <p className="editorial-body max-w-lg text-sm leading-relaxed text-[var(--color-brand-onyx)]/65 md:justify-self-end md:pt-1 sm:text-base">
                        Every detail is made to support the moments that matter most—your baby&apos;s comfort, your confidence, and calmer everyday routines.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-2 lg:grid-cols-[1fr_360px_1fr] lg:grid-rows-2 lg:gap-x-8 lg:gap-y-0">
                    <ReasonCard reason={reasons[0]} />

                    <div className="relative col-span-2 row-start-1 mb-3 aspect-square overflow-hidden rounded-[1.35rem] sm:mx-auto sm:w-full sm:max-w-[360px] lg:col-span-1 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mb-0 lg:max-w-[360px] lg:justify-self-center">
                        <Image
                            src="/assets/baby-parent-trust.webp"
                            alt="Mother sharing a tender moment with her baby"
                            fill
                            sizes="(max-width: 1023px) 90vw, 42vw"
                            className="object-cover object-center"
                        />
                    </div>

                    <ReasonCard reason={reasons[1]} />
                    <ReasonCard reason={reasons[2]} />
                    <ReasonCard reason={reasons[3]} />
                </div>
            </div>
        </section>
    );
}
