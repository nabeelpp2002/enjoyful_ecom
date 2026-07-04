const API_BASE = process.env.NEST_API_URL ?? 'http://localhost:4000/api/v1';

export interface CarouselSlide {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  desktopImageUrl: string;
  mobileImageUrl: string;
  imageUrl?: string;
  order?: number;
  isActive?: boolean;
}

export function normalizeSlide(s: Record<string, unknown>): CarouselSlide {
  return {
    id: String(s._id ?? s.id ?? ''),
    title: String(s.title ?? ''),
    subtitle: s.subtitle as string | undefined,
    description: s.description as string | undefined,
    buttonText: s.buttonText as string | undefined,
    buttonLink: s.buttonLink as string | undefined,
    desktopImageUrl: String(s.desktopImageUrl ?? s.imageUrl ?? ''),
    mobileImageUrl: String(s.mobileImageUrl ?? ''),
    imageUrl: s.imageUrl as string | undefined,
    order: s.order as number | undefined,
    isActive: s.isActive as boolean | undefined,
  };
}

export async function fetchCarouselSlides(token?: string): Promise<CarouselSlide[]> {
  const res = await fetch(`${API_BASE}/carousel`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Carousel upstream HTTP ${res.status}${err ? `: ${err.slice(0, 120)}` : ''}`);
  }

  const wrapped = await res.json();
  const raw: Record<string, unknown>[] = Array.isArray(wrapped?.data)
    ? wrapped.data
    : Array.isArray(wrapped)
      ? wrapped
      : [];

  return raw.map(normalizeSlide);
}
