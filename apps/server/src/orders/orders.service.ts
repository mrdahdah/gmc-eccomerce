import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutDto } from './dto/checkout.dto';

type OrderRow = Prisma.OrderGetPayload<{ include: { items: { include: { product: true } }; user: true } }>;

function toDto(order: OrderRow) {
  return {
    id: order.id,
    status: order.status,
    total: Number(order.total),
    email: order.user?.email,
    customer: order.user ? `${order.user.firstName} ${order.user.lastName}`.trim() : undefined,
    items: order.items.map((i) => ({
      productId: i.productId,
      name: i.product?.name,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      lineTotal: Math.round(Number(i.unitPrice) * i.quantity * 100) / 100,
    })),
    createdAt: order.createdAt.toISOString(),
  };
}

const INCLUDE = { items: { include: { product: true } }, user: true } as const;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Guest-friendly checkout: buying only needs an email. If no account exists for
   * that email we create a lightweight customer record (random password) so the
   * order still has an owner — the shopper never has to sign up first.
   */
  async checkout(dto: CheckoutDto) {
    const email = dto.email.toLowerCase();
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          firstName: dto.firstName?.trim() || 'Guest',
          lastName: dto.lastName?.trim() || 'Customer',
          passwordHash: await bcrypt.hash(randomBytes(24).toString('hex'), 10),
        },
      });
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: dto.items.map((i) => i.productId) } },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    let total = 0;
    const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] = [];
    for (const item of dto.items) {
      const product = byId.get(item.productId);
      if (!product) throw new BadRequestException(`Unknown product: ${item.productId}`);
      if (product.stock < item.quantity) throw new BadRequestException(`Not enough stock for ${product.name}`);
      total += Number(product.price) * item.quantity;
      orderItems.push({
        product: { connect: { id: product.id } },
        quantity: item.quantity,
        unitPrice: product.price,
      });
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          user: { connect: { id: user!.id } },
          total,
          status: OrderStatus.PENDING,
          items: { create: orderItems },
        },
        include: INCLUDE,
      });
      for (const item of dto.items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
      }
      return created;
    });
    return toDto(order);
  }

  async listMine(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(toDto);
  }

  async listAll() {
    const orders = await this.prisma.order.findMany({ include: INCLUDE, orderBy: { createdAt: 'desc' } });
    return orders.map(toDto);
  }

  async updateStatus(id: string, status: OrderStatus) {
    const existing = await this.prisma.order.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Order not found');
    const order = await this.prisma.order.update({ where: { id }, data: { status }, include: INCLUDE });
    return toDto(order);
  }
}
