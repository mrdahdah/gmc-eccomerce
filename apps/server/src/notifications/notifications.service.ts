import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { PushService } from './push.service';

interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string;
  /** Where a click on the OS-level notification should land. */
  url?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
    private readonly push: PushService,
  ) {}

  /**
   * Persist a notification, fan it out to the owner's live sockets, and mirror
   * it to their subscribed browsers over web push.
   *
   * The socket delivery covers open tabs; push covers everything else. Push is
   * fire-and-forget on purpose — a dead subscription must never fail the order
   * update or stock change that triggered the notification.
   */
  async create(userId: string, input: CreateNotificationInput) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: input.type,
        title: input.title,
        message: input.message,
        orderId: input.orderId ?? null,
      },
    });
    this.gateway.emitToUser(userId, 'notification.created', notification);

    void this.push
      .sendToUser(userId, {
        title: input.title,
        message: input.message,
        url: input.url ?? (input.orderId ? `/orders/${input.orderId}` : '/notifications'),
      })
      .catch(() => {
        /* Already logged inside PushService; never surface it to the caller. */
      });

    return notification;
  }

  /**
   * Create an ORDER_STATUS notification, de-duplicating repeated events: if the
   * user has already been told this order reached this status, do nothing.
   */
  async createOrderStatus(userId: string, orderId: string, status: string) {
    const message = `Your order #${orderId.slice(-6).toUpperCase()} is now ${status.toLowerCase()}.`;
    const existing = await this.prisma.notification.findFirst({
      where: { userId, orderId, type: NotificationType.ORDER_STATUS, message },
    });
    if (existing) return existing;
    return this.create(userId, {
      type: NotificationType.ORDER_STATUS,
      title: 'Order update',
      message,
      orderId,
    });
  }

  /** Newest-first page of a user's notifications plus unread/total counts. */
  async list(userId: string, skip = 0, take = 20) {
    const [items, total, unread] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return { items, total, unread, skip, take };
  }

  async unreadCount(userId: string) {
    const unread = await this.prisma.notification.count({ where: { userId, readAt: null } });
    return { unread };
  }

  async markRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }
    if (notification.readAt) return notification;
    return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }

  async markAllRead(userId: string) {
    const { count } = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: count };
  }
}
