import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';

export interface PushPayload {
  title: string;
  message: string;
  url?: string;
}

export interface SubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/**
 * Web Push delivery over VAPID.
 *
 * Push is best-effort: a browser can revoke a subscription at any time, so a
 * failed send must never fail the request that triggered it. Subscriptions the
 * push service reports as gone (404/410) are pruned as we go.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly enabled: boolean;
  private readonly vapidPublicKey: string | null;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    const publicKey = config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = config.get<string>('VAPID_PRIVATE_KEY');
    const subject = config.get<string>('VAPID_SUBJECT') ?? 'mailto:admin@example.com';

    this.enabled = Boolean(publicKey && privateKey);
    this.vapidPublicKey = this.enabled ? publicKey! : null;
    if (this.enabled) {
      webpush.setVapidDetails(subject, publicKey!, privateKey!);
    } else {
      // The app must still boot without keys, otherwise every developer needs
      // a VAPID pair just to run the catalog.
      this.logger.warn('VAPID keys are not configured - web push is disabled.');
    }
  }

  get publicKey(): string | null {
    return this.vapidPublicKey;
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  async subscribe(userId: string, input: SubscriptionInput, userAgent?: string) {
    // Endpoint is unique, so re-subscribing the same browser updates the keys
    // rather than piling up duplicate rows.
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: input.endpoint },
      create: {
        userId,
        endpoint: input.endpoint,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        userAgent,
      },
      update: { userId, p256dh: input.keys.p256dh, auth: input.keys.auth, userAgent },
      select: { id: true, endpoint: true, createdAt: true },
    });
  }

  async unsubscribe(userId: string, endpoint: string) {
    const { count } = await this.prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
    return { removed: count };
  }

  async countFor(userId: string) {
    return this.prisma.pushSubscription.count({ where: { userId } });
  }

  /** Sends to every device belonging to one user. Returns how many got through. */
  async sendToUser(userId: string, payload: PushPayload) {
    const subs = await this.prisma.pushSubscription.findMany({ where: { userId } });
    return this.deliver(subs, payload);
  }

  /** Sends to every registered device. Used by the admin broadcast. */
  async sendToAll(payload: PushPayload) {
    const subs = await this.prisma.pushSubscription.findMany();
    return this.deliver(subs, payload);
  }

  private async deliver(
    subs: { id: string; endpoint: string; p256dh: string; auth: string }[],
    payload: PushPayload,
  ) {
    if (!this.enabled || subs.length === 0) return { sent: 0, failed: 0, pruned: 0 };

    const body = JSON.stringify(payload);
    let sent = 0;
    let failed = 0;
    const stale: string[] = [];

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            body,
          );
          sent += 1;
        } catch (error) {
          failed += 1;
          const status = (error as { statusCode?: number }).statusCode;
          // 404/410 mean the browser dropped the subscription for good.
          if (status === 404 || status === 410) stale.push(sub.id);
          else this.logger.warn(`Push to ${sub.endpoint.slice(0, 40)}... failed with ${status ?? 'unknown'}`);
        }
      }),
    );

    if (stale.length) {
      await this.prisma.pushSubscription.deleteMany({ where: { id: { in: stale } } });
    }

    return { sent, failed, pruned: stale.length };
  }
}
