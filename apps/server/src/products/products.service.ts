import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

type ProductRow = Prisma.ProductGetPayload<{ include: { category: true } }>;

function toDto(p: ProductRow) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: Number(p.price),
    imageUrl: p.imageUrl,
    stock: p.stock,
    categoryId: p.categoryId,
    category: p.category ? { id: p.category.id, name: p.category.name, slug: p.category.slug } : undefined,
    createdAt: p.createdAt.toISOString(),
  };
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  /** Public catalog listing with search + category filter + pagination. */
  async list(query: ProductQueryDto) {
    const { page, limit, search, category } = query;
    const where: Prisma.ProductWhereInput = {};
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (category) where.category = { slug: category };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);
    return { items: rows.map(toDto), total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({ where: { slug }, include: { category: true } });
    if (!product) throw new NotFoundException('Product not found');
    return toDto(product);
  }

  // ---- Admin writes ---------------------------------------------------------

  async create(dto: CreateProductDto) {
    await this.assertCategory(dto.categoryId);
    const imageUrl = await this.cloudinary.uploadImage(dto.image);
    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        slug: await this.uniqueSlug(dto.name),
        description: dto.description,
        price: dto.price,
        stock: dto.stock ?? 0,
        categoryId: dto.categoryId,
        imageUrl,
      },
      include: { category: true },
    });
    return toDto(product);
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.getOrThrow(id);
    if (dto.categoryId) await this.assertCategory(dto.categoryId);

    const data: Prisma.ProductUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.stock !== undefined) data.stock = dto.stock;
    if (dto.categoryId !== undefined) data.category = { connect: { id: dto.categoryId } };
    if (dto.image !== undefined) data.imageUrl = await this.cloudinary.uploadImage(dto.image);

    const product = await this.prisma.product.update({ where: { id }, data, include: { category: true } });
    return toDto(product);
  }

  async remove(id: string) {
    await this.getOrThrow(id);
    await this.prisma.product.delete({ where: { id } });
    return { id, deleted: true };
  }

  // ---- Helpers --------------------------------------------------------------

  private async assertCategory(categoryId: string) {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new BadRequestException('Category does not exist');
  }

  private async getOrThrow(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base = slugify(name) || 'product';
    let slug = base;
    let n = 2;
    while (await this.prisma.product.findUnique({ where: { slug } })) slug = `${base}-${n++}`;
    return slug;
  }
}
