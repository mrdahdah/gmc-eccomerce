import { ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CategoriesService } from './categories.service';

// A hand-rolled Prisma stub keeps these unit tests fast and DB-free.
function makePrisma(overrides: Record<string, any> = {}) {
  return {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
      ...(overrides.category ?? {}),
    },
    product: {
      findMany: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      ...(overrides.product ?? {}),
    },
  } as unknown as PrismaService;
}

describe('CategoriesService', () => {
  it('derives a slug from the name when none is supplied', async () => {
    const prisma = makePrisma({
      category: { create: jest.fn().mockImplementation(({ data }: any) => ({ id: 'c1', ...data })) },
    });
    const service = new CategoriesService(prisma);

    const result = await service.create({ name: 'Baby Care' });

    expect(result.slug).toBe('baby-care');
    expect(result.productCount).toBe(0);
  });

  it('rejects a duplicate name or slug with 409', async () => {
    const prisma = makePrisma({
      category: { findFirst: jest.fn().mockResolvedValue({ id: 'existing' }) },
    });
    const service = new CategoriesService(prisma);

    await expect(service.create({ name: 'Electronics' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses to delete a category that still has products', async () => {
    const prisma = makePrisma({
      category: { findUnique: jest.fn().mockResolvedValue({ id: 'c1', name: 'Home', slug: 'home' }) },
      product: { count: jest.fn().mockResolvedValue(3) },
    });
    const service = new CategoriesService(prisma);

    await expect(service.remove('c1')).rejects.toBeInstanceOf(ConflictException);
  });
});
