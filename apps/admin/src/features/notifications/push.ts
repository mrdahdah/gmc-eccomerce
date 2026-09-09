// apps/admin/src/features/notifications/push.ts
// Browser-side plumbing for Web Push over VAPID.
//
// Mirrors the storefront's module: a push subscription belongs to an origin,
// so an admin who wants low-stock alerts has to subscribe from this app even
// if they already subscribed on the storefront.
import { swRegistration } from '../pwa/serviceWorker';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export type PushState = 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed';

/** Push needs a secure context; localhost counts as one. */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    window.isSecureContext
  );
}

/** The VAPID key travels as base64url but applicationServerKey wants raw bytes. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalised = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(normalised);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

/**
 * The registration owned by features/pwa/serviceWorker.ts. Kept as a function
 * so callers do not have to know where registration happens.
 */
export async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  return (await swRegistration) ?? (await navigator.serviceWorker.getRegistration()) ?? null;
}

export async function getSubscription(): Promise<PushSubscription | null> {
  const registration = await getRegistration();
  return (await registration?.pushManager.getSubscription()) ?? null;
}

export async function currentState(): Promise<PushState> {
  if (!isPushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  return (await getSubscription()) ? 'subscribed' : 'unsubscribed';
}

async function fetchPublicKey(): Promise<string | null> {
  const response = await fetch(`${API_URL}/notifications/vapid-public-key`);
  if (!response.ok) return null;
  const body = (await response.json()) as { publicKey: string | null; enabled: boolean };
  return body.enabled ? body.publicKey : null;
}

/**
 * Asks for permission, subscribes with the server's VAPID key, then records the
 * subscription against the signed-in user. Throws with a message suitable for
 * showing directly in the UI.
 */
export async function subscribe(token: string): Promise<void> {
  if (!isPushSupported()) throw new Error('This browser does not support web push.');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }

  const publicKey = await fetchPublicKey();
  if (!publicKey) throw new Error('Push is not configured on the server (missing VAPID keys).');

  const registration = await getRegistration();
  if (!registration) throw new Error('Could not register the service worker.');
  await navigator.serviceWorker.ready;

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    }));

  const raw = subscription.toJSON() as { endpoint?: string; keys?: { p256dh: string; auth: string } };
  const response = await fetch(`${API_URL}/notifications/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      endpoint: raw.endpoint,
      keys: raw.keys,
      userAgent: navigator.userAgent.slice(0, 180),
    }),
  });
  if (!response.ok) throw new Error('The server rejected the subscription.');
}

export async function unsubscribe(token: string): Promise<void> {
  const subscription = await getSubscription();
  if (!subscription) return;

  await fetch(`${API_URL}/notifications/subscribe`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });
  await subscription.unsubscribe();
}
