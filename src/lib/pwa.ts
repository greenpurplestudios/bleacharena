// PWA service-worker registration wrapper.
// Guards against dev, Lovable preview, iframes, and a ?sw=off kill switch.
import { Workbox } from "workbox-window";

const SW_URL = "/sw.js";

function shouldSkip(): boolean {
  if (typeof window === "undefined") return true;
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname;
  if (
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev")
  ) {
    return true;
  }
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterMatching() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs
      .filter((r) => (r.active?.scriptURL ?? r.installing?.scriptURL ?? "").endsWith(SW_URL))
      .map((r) => r.unregister()),
  );
}

export function registerPWA(onUpdateAvailable: () => void) {
  if (shouldSkip()) {
    void unregisterMatching();
    return;
  }
  if (!("serviceWorker" in navigator)) return;
  const wb = new Workbox(SW_URL);
  wb.addEventListener("waiting", () => onUpdateAvailable());
  wb.addEventListener("controlling", () => {
    window.location.reload();
  });
  void wb.register();
  (window as unknown as { __pwaWorkbox?: Workbox }).__pwaWorkbox = wb;
}

export function applyPendingUpdate() {
  const wb = (window as unknown as { __pwaWorkbox?: Workbox }).__pwaWorkbox;
  if (!wb) {
    window.location.reload();
    return;
  }
  void wb.messageSkipWaiting();
}