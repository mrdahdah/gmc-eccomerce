import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from './cart.service';

function makePrisma(parts: Record<string, any> = {}) {
  return {
    cart: { findUnique: jest.fn(), upsert: jest.fn(), ...(parts.cart ?? {}) },
    cartItem: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
      ...(parts.cartItem ?? {}),
    },
    product: { findUnique: jest.fn(), findMany: jest.fn(), ...(parts.product ?? {}) },
  } as unknown as PrismaService;
}

describe('CartService', () => {
  it('computes line totals and subtotal from server prices', async () => {
    const prisma = makePrisma({
      cart: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'cart1',
          items: [
            { productId: 'p1', quantity: 2, product: { name: 'Lamp', imageUrl: null, price: 34.5 } },
            { productId: 'p2', quantity: 1, product: { name: 'Headphones', imageUrl: null, price: 89.99 } },
          ],
        }),
      },
    });
    const service = new CartService(prisma);

    const cart = await service.getCart('u1');

    expect(cart.itemCount).toBe(3);
    expect(cart.subtotal).toBe(158.99); // 2*34.50 + 89.99
    expect(cart.items[0].lineTotal).toBe(69);
  });

  it('returns an empty cart when the user has none', async () => {
    const prisma = makePrisma({ cart: { findUnique: jest.fn().mockResolvedValue(null) } });
    const service = new CartService(prisma);

    await expect(service.getCart('u1')).resolves.toEqual({ items: [], subtotal: 0, itemCount: 0 });
  });

  it('rejects adding more than the available stock', async () => {
    const prisma = makePrisma({
      product: { findUnique: jest.fn().mockResolvedValue({ id: 'p1', stock: 2, price: 10 }) },
      cart: { upsert: jest.fn().mockResolvedValue({ id: 'cart1' }) },
      cartItem: { findUnique: jest.fn().mockResolvedValue({ quantity: 2 }) },
    });
    const service = new CartService(prisma);

    await expect(service.addItem('u1', { productId: 'p1', quantity: 1 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('will not update an item that is not in the user cart (ownership)', async () => {
    const prisma = makePrisma({
      cart: { findUnique: jest.fn().mockResolvedValue({ id: 'cart1' }) },
      cartItem: { findUnique: jest.fn().mockResolvedValue(null) },
    });
    const service = new CartService(prisma);

    await expect(service.updateItem('u1', 'p1', 3)).rejects.toBeInstanceOf(NotFoundException);
  });
});
