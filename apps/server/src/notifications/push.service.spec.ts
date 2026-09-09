import * as webpush from 'web-push';
import { PushService } from './push.service';

jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
}));

const sendNotification = webpush.sendNotification as jest.Mock;

function makePrisma(subs: any[] = []) {
  return {
    pushSubscription: {
      findMany: jest.fn().mockResolvedValue(subs),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      upsert: jest.fn().mockResolvedValue({ id: 's1' }),
      count: jest.fn().mockResolvedValue(subs.length),
    },
  } as any;
}

function makeConfig(values: Record<string, string | undefined>) {
  return { get: (key: string) => values[key] } as any;
}

const KEYS = {
  VAPID_PUBLIC_KEY: 'public-key',
  VAPID_PRIVATE_KEY: 'private-key',
  VAPID_SUBJECT: 'mailto:ops@example.com',
};

const sub = (id: string, endpoint: string) => ({ id, endpoint, p256dh: 'p', auth: 'a' });

describe('PushService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('without VAPID keys', () => {
    it('reports itself disabled rather than throwing at construction', () => {
      const service = new PushService(makePrisma(), makeConfig({}));

      expect(service.isEnabled).toBe(false);
      expect(service.publicKey).toBeNull();
      expect(webpush.setVapidDetails).not.toHaveBeenCalled();
    });

    it('sends nothing, so a keyless dev environment stays quiet', async () => {
      const prisma = makePrisma([sub('s1', 'https://push.example/1')]);
      const service = new PushService(prisma, makeConfig({}));

      await expect(service.sendToUser('u1', { title: 't', message: 'm' })).resolves.toEqual({
        sent: 0,
        failed: 0,
        pruned: 0,
      });
      expect(sendNotification).not.toHaveBeenCalled();
    });
  });

  describe('with VAPID keys', () => {
    it('exposes the configured public key to the browser', () => {
      const service = new PushService(makePrisma(), makeConfig(KEYS));

      expect(service.isEnabled).toBe(true);
      expect(service.publicKey).toBe('public-key');
      expect(webpush.setVapidDetails).toHaveBeenCalledWith(
        'mailto:ops@example.com',
        'public-key',
        'private-key',
      );
    });

    it('delivers one payload per device and counts the successes', async () => {
      const prisma = makePrisma([sub('s1', 'https://push.example/1'), sub('s2', 'https://push.example/2')]);
      sendNotification.mockResolvedValue(undefined);
      const service = new PushService(prisma, makeConfig(KEYS));

      const result = await service.sendToUser('u1', { title: 'Order update', message: 'Shipped', url: '/orders/1' });

      expect(result).toEqual({ sent: 2, failed: 0, pruned: 0 });
      expect(sendNotification).toHaveBeenCalledTimes(2);
      expect(sendNotification.mock.calls[0][1]).toBe(
        JSON.stringify({ title: 'Order update', message: 'Shipped', url: '/orders/1' }),
      );
    });

    it('prunes subscriptions the push service reports as gone, but keeps the rest', async () => {
      const prisma = makePrisma([
        sub('gone', 'https://push.example/gone'),
        sub('flaky', 'https://push.example/flaky'),
        sub('ok', 'https://push.example/ok'),
      ]);
      sendNotification.mockImplementation((subscription: { endpoint: string }) => {
        if (subscription.endpoint.endsWith('/gone')) return Promise.reject({ statusCode: 410 });
        // A 500 is the push service having a bad day; the subscription is fine.
        if (subscription.endpoint.endsWith('/flaky')) return Promise.reject({ statusCode: 500 });
        return Promise.resolve(undefined);
      });
      const service = new PushService(prisma, makeConfig(KEYS));

      const result = await service.sendToAll({ title: 't', message: 'm' });

      expect(result).toEqual({ sent: 1, failed: 2, pruned: 1 });
      expect(prisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['gone'] } },
      });
    });

    it('never rejects when every device fails, so the triggering request survives', async () => {
      const prisma = makePrisma([sub('s1', 'https://push.example/1')]);
      sendNotification.mockRejectedValue({ statusCode: 400 });
      const service = new PushService(prisma, makeConfig(KEYS));

      await expect(service.sendToUser('u1', { title: 't', message: 'm' })).resolves.toEqual({
        sent: 0,
        failed: 1,
        pruned: 0,
      });
    });
  });

  describe('subscription ownership', () => {
    it('only deletes the caller’s own subscription for that endpoint', async () => {
      const prisma = makePrisma();
      const service = new PushService(prisma, makeConfig(KEYS));

      await service.unsubscribe('u1', 'https://push.example/1');

      expect(prisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u1', endpoint: 'https://push.example/1' },
      });
    });

    it('re-subscribing the same browser updates the row instead of duplicating it', async () => {
      const prisma = makePrisma();
      const service = new PushService(prisma, makeConfig(KEYS));

      await service.subscribe(
        'u1',
        { endpoint: 'https://push.example/1', keys: { p256dh: 'p2', auth: 'a2' } },
        'Firefox',
      );

      expect(prisma.pushSubscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { endpoint: 'https://push.example/1' },
          update: { userId: 'u1', p256dh: 'p2', auth: 'a2', userAgent: 'Firefox' },
        }),
      );
    });
  });
});
