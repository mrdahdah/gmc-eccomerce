import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';

type CartItemView = {
  productId: string;
  name: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type CartView = { items: CartItemView[]; subtotal: number; itemCount: number };

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  /** The signed-in user's cart, with server-computed line totals and subtotal. */
  async getCart(userId: string): Promise<CartView> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true }, orderBy: { product: { name: 'asc' } } } },
    });
    if (!cart) return { items: [], subtotal: 0, itemCount: 0 };

    const items: CartItemView[] = cart.items.map((item) => {
      const unitPrice = Number(item.product.price);
      return {
        productId: item.productId,
        name: item.product.name,
        imageUrl: item.product.imageUrl,
        unitPrice,
        quantity: item.quantity,
        lineTotal: round2(unitPrice * item.quantity),
      };
    });
    const subtotal = round2(items.reduce((sum, i) => sum + i.lineTotal, 0));
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    return { items, subtotal, itemCount };
  }

  /** Read-only catalog so the cart UI can offer products to add without FEATURE-002. */
  async catalog() {
    const products = await this.prisma.product.findMany({ orderBy: { name: 'asc' } });
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      imageUrl: p.imageUrl,
      stock: p.stock,
    }));
  }

  async addItem(userId: string, dto: AddCartItemDto): Promise<CartView> {
    const quantity = dto.quantity ?? 1;
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');

    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: product.id } },
    });
    const nextQuantity = (existing?.quantity ?? 0) + quantity;
    this.assertStock(nextQuantity, product.stock);

    await this.prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId: product.id } },
      create: { cartId: cart.id, productId: product.id, quantity },
      update: { quantity: nextQuantity },
    });
    return this.getCart(userId);
  }

  async updateItem(userId: string, productId: string, quantity: number): Promise<CartView> {
    const cart = await this.requireCart(userId);
    const item = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
      include: { product: true },
    });
    if (!item) throw new NotFoundException('Item is not in your cart');
    this.assertStock(quantity, item.product.stock);

    await this.prisma.cartItem.update({
      where: { cartId_productId: { cartId: cart.id, productId } },
      data: { quantity },
    });
    return this.getCart(userId);
  }

  async removeItem(userId: string, productId: string): Promise<CartView> {
    const cart = await this.requireCart(userId);
    // deleteMany scopes strictly to this user's cart, so nobody can remove another cart's line.
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
    return this.getCart(userId);
  }

  async clear(userId: string): Promise<CartView> {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (cart) await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return { items: [], subtotal: 0, itemCount: 0 };
  }

  // ---- Helpers --------------------------------------------------------------

  private async requireCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new NotFoundException('Cart is empty');
    return cart;
  }

  private assertStock(quantity: number, stock: number) {
    if (quantity > stock) {
      throw new BadRequestException(`Only ${stock} in stock`);
    }
  }
}

/** Round to 2dp to keep currency arithmetic honest. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
