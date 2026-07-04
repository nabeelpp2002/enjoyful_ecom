/**
 * Lightweight client-side analytics — fire-and-forget POST to /api/track.
 * Uses navigator.sendBeacon when available for reliability on page unload.
 */

const SESSION_KEY = 'enjoyful-session';

function getSessionId(): string {
    if (typeof window === 'undefined') return 'ssr';
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
        id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
        sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
}

export type AnalyticsEventType =
    | 'page_view'
    | 'product_view'
    | 'product_click'
    | 'add_to_cart'
    | 'add_to_wishlist'
    | 'search'
    | 'checkout_initiated';

export interface TrackPayload {
    type: AnalyticsEventType;
    productId?: string;
    productName?: string;
    path?: string;
    query?: string;
    metadata?: Record<string, unknown>;
}

export function track(payload: TrackPayload): void {
    if (typeof window === 'undefined') return;
    const body = JSON.stringify({
        ...payload,
        sessionId: getSessionId(),
        path: payload.path ?? window.location.pathname,
        referrer: document.referrer,
    });
    try {
        if (navigator.sendBeacon) {
            const blob = new Blob([body], { type: 'application/json' });
            navigator.sendBeacon('/api/track', blob);
            return;
        }
        fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            keepalive: true,
        }).catch(() => {});
    } catch {
        // analytics never throws into UI
    }
}
