import { fetchCarouselSlides } from "@/lib/carousel";
import { HeroSection, type Slide } from "./HeroSection";

/**
 * Server component: fetches carousel slides on the server (server-to-server, no
 * browser round-trip) so the first slide — the LCP hero image — is present in
 * the initial render with `priority`. This removes the old client-side fetch
 * waterfall (hydrate → fetch /api/carousel → render image) that made the hero
 * take a few seconds to appear.
 *
 * If the API is unreachable at render time we pass no slides; the client
 * HeroSection then falls back to its own fetch, preserving resilience.
 *
 * NOTE: we map to the `Slide` shape inline here rather than reusing the
 * client-module normalizer — a value exported from a "use client" module can't
 * be invoked from a server component.
 */
export async function HeroSectionServer() {
    let initialSlides: Slide[] = [];
    try {
        const slides = await fetchCarouselSlides();
        initialSlides = slides
            .filter((s) => s.isActive !== false)
            .map((s): Slide => ({
                id: s.id,
                title: s.title ?? "",
                subtitle: s.subtitle,
                description: s.description,
                buttonText: s.buttonText || "Shop Now",
                buttonLink: s.buttonLink || "/category/all",
                textColor: s.textColor || "#FFFFFF",
                buttonStyle: s.buttonStyle || "solid",
                desktopImageUrl: s.desktopImageUrl || s.imageUrl || "",
                mobileImageUrl: s.mobileImageUrl || s.desktopImageUrl || s.imageUrl || "",
            }))
            .filter((s) => s.desktopImageUrl || s.mobileImageUrl);
    } catch (err) {
        console.error("[HeroSectionServer] carousel fetch failed:", err);
    }

    return <HeroSection initialSlides={initialSlides} />;
}
