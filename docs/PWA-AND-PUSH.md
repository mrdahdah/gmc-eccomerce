# PWA and web push notifications

The storefront is an installable Progressive Web App and both apps can deliver
Web Push notifications over VAPID.

## What runs where

| Piece | Storefront (`apps/client`) | Admin (`apps/admin`) |
| --- | --- | --- |
| Installable (manifest, icons, shortcuts) | yes | technically, but not the point |
| Offline shell + runtime caching | yes | shell only, no API caching |
| Web push | yes — order updates, announcements | yes — low-stock alerts |

Both apps use `vite-plugin-pwa` in `generateSW` mode. Workbox generates
`/sw.js` and pulls in the hand-written push handlers from `public/push-sw.js`
via `importScripts`. The two workers are near-copies on purpose: a service
worker is scoped to one origin, and the apps deploy separately.

A push subscription also belongs to one origin. An admin who wants low-stock
alerts has to enable them from the admin app even if they already enabled
notifications on the storefront.

## Turning push on

Push is optional. Without VAPID keys the API still boots, `PushService` logs a
warning and reports itself disabled, and the UI says so instead of failing.

1. Generate a key pair once:

```bash
node -e "console.log(require('web-push').generateVAPIDKeys())"
```

2. Put them in `apps/server/.env`:

```
VAPID_PUBLIC_KEY="B..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:admin@example.com"
```

3. Restart the API. `GET /api/notifications/vapid-public-key` should now
   return `{"enabled": true, ...}`.

The private key is a secret — it is what proves a push came from this server.
Never commit it and never expose it to the browser. The public key is meant to
be public; the browser needs it to subscribe.

## Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/notifications/vapid-public-key` | public | Key the browser subscribes with |
| GET | `/api/notifications/subscribe` | user | How many browsers I have registered |
| POST | `/api/notifications/subscribe` | user | Register this browser |
| DELETE | `/api/notifications/subscribe` | user | Stop push for this browser |
| POST | `/api/notifications/broadcast` | admin | Announce to every subscribed device |

Re-subscribing the same browser updates the existing row rather than adding a
duplicate: `endpoint` is unique. Unsubscribe is scoped to the caller, so one
user cannot delete another's subscription.

## How a notification reaches a device

`NotificationsService.create` does three things: writes the row, emits
`notification.created` to the user's socket room (open tabs), and mirrors the
same payload to their push subscriptions (closed tabs). Push is
fire-and-forget — a dead subscription must never fail the order update that
triggered it. Subscriptions the push service reports as `404` or `410` are
deleted as they are found; other failures are logged and left alone, since a
`500` from a push service is usually temporary.

Clicks land on `/orders/:id` when the notification is about an order, and
`/notifications` otherwise.

## Testing it locally

Push needs a secure context. `http://localhost` counts as one, so no HTTPS
setup is needed in development — but a LAN address like `http://192.168.1.10`
does not, and the toggle will report the browser as unsupported there.

1. Sign in on the storefront and open **Notifications**.
2. Enable browser notifications and accept the permission prompt.
3. From the admin app, **Marketing → Push announcement**, send one.
4. Close the storefront tab entirely and send another — it should still arrive.

To exercise the low-stock path instead, edit a product's stock in the admin
from 5 or more down to below 5. Every admin gets a notification; the threshold
is `LOW_STOCK_THRESHOLD` in `notifications.listener.ts`.

## Icons

`apps/client/public/icon-*.png` are generated, not hand-drawn:

```bash
node apps/client/scripts/generate-pwa-icons.mjs
```

The script holds the brand colours, so re-run it after a rebrand rather than
editing the PNGs. `icon-maskable-512.png` carries a wider safe zone because
Android launchers crop icons to a circle.

## Known limitations

- iOS only delivers web push to apps added to the Home Screen, on iOS 16.4+.
  A Safari tab will not receive anything.
- Free-tier hosting that sleeps idle instances will not send pushes while
  asleep; the notification arrives when something wakes the API.
