/**
 * Local (device) notifications. No push server: the app schedules gentle
 * reminders while it runs and asks for permission only when the player opts in.
 */
const KEY = "bd:notify";

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

export function notificationsEnabled(): boolean {
  if (!notificationsSupported() || Notification.permission !== "granted") return false;
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return false;
  }
}

/** Turns reminders on (requesting permission when needed) or off. */
export async function setNotificationsEnabled(on: boolean): Promise<boolean> {
  if (!notificationsSupported()) return false;
  if (!on) {
    try { localStorage.setItem(KEY, "off"); } catch {}
    return false;
  }
  let perm = Notification.permission;
  if (perm === "default") perm = await Notification.requestPermission();
  if (perm !== "granted") return false;
  try { localStorage.setItem(KEY, "on"); } catch {}
  return true;
}

export function notify(title: string, body: string, tag = "bleach-arena") {
  if (!notificationsEnabled()) return;
  try {
    new Notification(title, { body, tag, icon: "/pwa-192x192.png", badge: "/pwa-192x192.png" });
  } catch {}
}

const FIRED = "bd:notify:last";

/** At most one reminder per 8 hours, fired while the app is open. */
export function scheduleReminder(title: string, body: string, afterMs = 4 * 60 * 60 * 1000) {
  if (!notificationsEnabled()) return () => {};
  const id = window.setTimeout(() => {
    let last = 0;
    try { last = Number(localStorage.getItem(FIRED) ?? 0); } catch {}
    if (Date.now() - last < 8 * 60 * 60 * 1000) return;
    try { localStorage.setItem(FIRED, String(Date.now())); } catch {}
    notify(title, body, "bleach-arena-reminder");
  }, afterMs);
  return () => window.clearTimeout(id);
}