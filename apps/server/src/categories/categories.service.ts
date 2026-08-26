import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

/** Turns a display name into a URL-safe slug: "Baby Care!" -> "baby-care". */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public listing: every category with its product count. */
  async list() {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    return categories.map((c) => this.toDto(c, c._count.products));
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: { _count: { select: { products: true } } },
    });
    if (!category) throw new NotFoundException('Category not found');
    return this.toDto(category, category._count.products);
  }

  /** Products that belong to a category, addressed by slug. */
  async productsBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({ where: { slug } });
    if (!category) throw new NotFoundException('Category not found');
    const products = await this.prisma.product.findMany({
      where: { categoryId: category.id },
      orderBy: { name: 'asc' },
    });
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: Number(p.price),
      imageUrl: p.imageUrl,
      stock: p.stock,
      categoryId: p.categoryId,
    }));
  }

  // ---- Admin-only mutations -------------------------------------------------

  async create(dto: CreateCategoryDto) {
    const slug = dto.slug ?? slugify(dto.name);
    await this.assertUnique(dto.name, slug);
    const category = await this.prisma.category.create({ data: { name: dto.name, slug } });
    return this.toDto(category, 0);
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await this.getOrThrow(id);
    const name = dto.name ?? existing.name;
    const slug = dto.slug ?? (dto.name ? slugify(dto.name) : existing.slug);
    await this.assertUnique(name, slug, id);
    const category = await this.prisma.category.update({ where: { id }, data: { name, slug } });
    const count = await this.prisma.product.count({ where: { categoryId: id } });
    return this.toDto(category, count);
  }

  async remove(id: string) {
    await this.getOrThrow(id);
    const products = await this.prisma.product.count({ where: { categoryId: id } });
    if (products > 0) {
      throw new ConflictException('Cannot delete a category that still has products');
    }
    await this.prisma.category.delete({ where: { id } });
    return { id, deleted: true };
  }

  // ---- Helpers --------------------------------------------------------------

  private toDto(
    category: { id: string; name: string; slug: string },
    productCount: number,
  ) {
    return { id: category.id, name: category.name, slug: category.slug, productCount };
  }

  private async getOrThrow(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  /** Names and slugs are both unique; surface a clean 409 instead of a Prisma P2002. */
  private async assertUnique(name: string, slug: string, ignoreId?: string) {
    const where: Prisma.CategoryWhereInput = { OR: [{ name }, { slug }] };
    if (ignoreId) where.NOT = { id: ignoreId };
    const clash = await this.prisma.category.findFirst({ where });
    if (clash) throw new ConflictException('A category with that name or slug already exists');
  }
}
