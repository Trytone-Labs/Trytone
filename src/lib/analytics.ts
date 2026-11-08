/**
 * Google Analytics page-view tracking for the hash router.
 *
 * The gtag.js snippet lives in index.html (with send_page_view: false). The
 * app's routes live in the URL fragment (/#/aural/topic/intervals), which GA4
 * strips from the page path — so every screen would report as "/". Instead we
 * send one page_view per route change with the route rewritten as a real path
 * (https://www.trytone.com.au/aural/topic/intervals).
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

interface RouterLike {
  state: { location: { pathname: string; search: string } };
  subscribe: (fn: (state: { location: { pathname: string; search: string } }) => void) => () => void;
}

// <Navigate replace> redirects (unknown topic, legacy /topic/:id, ...) settle
// within a render or two; waiting briefly means only the final route is counted.
const SETTLE_MS = 300;

export function trackPageViews(router: RouterLike): () => void {
  let lastSent: string | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const { pathname, search } = router.state.location;
      const path = pathname + search;
      if (path === lastSent || typeof window.gtag !== 'function') return;
      lastSent = path;
      window.gtag('event', 'page_view', {
        page_location: window.location.origin + path,
        page_path: path,
        page_title: document.title,
      });
    }, SETTLE_MS);
  };

  schedule();
  const unsubscribe = router.subscribe(schedule);
  return () => {
    clearTimeout(timer);
    unsubscribe();
  };
}
