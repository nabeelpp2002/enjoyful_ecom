import { NextResponse } from 'next/server';
import { fetchCarouselSlides } from '@/lib/carousel';

/** Public storefront carousel — returns [] when the API is unreachable. */
export async function GET() {
  try {
    const slides = await fetchCarouselSlides();
    return NextResponse.json(slides);
  } catch (err) {
    console.error('[api/carousel]', err);
    return NextResponse.json([]);
  }
}
