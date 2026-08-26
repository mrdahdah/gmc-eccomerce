import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Student123!', 10);
  const admin = await prisma.user.upsert({ where: { email: 'admin@example.com' }, update: {}, create: { firstName: 'Admin', lastName: 'Instructor', email: 'admin@example.com', passwordHash, role: Role.ADMIN } });
  await prisma.user.upsert({ where: { email: 'student1@example.com' }, update: {}, create: { firstName: 'Student', lastName: 'One', email: 'student1@example.com', passwordHash } });
  await prisma.user.upsert({ where: { email: 'student2@example.com' }, update: {}, create: { firstName: 'Student', lastName: 'Two', email: 'student2@example.com', passwordHash } });
  const electronics = await prisma.category.upsert({ where: { slug: 'electronics' }, update: {}, create: { name: 'Electronics', slug: 'electronics' } });
  const home = await prisma.category.upsert({ where: { slug: 'home' }, update: {}, create: { name: 'Home', slug: 'home' } });
  // Seed images are 800x800 to match the shared Cloudinary transform (consistent tiles).
  const img = (slug: string) => `https://picsum.photos/seed/${slug}/800/800`;
  await prisma.product.createMany({ data: [
    { name: 'Wireless Headphones', slug: 'wireless-headphones', description: 'Everyday studio sound.', price: 89.99, stock: 25, categoryId: electronics.id, imageUrl: img('wireless-headphones') },
    { name: 'Desk Lamp', slug: 'desk-lamp', description: 'Warm light for focused work.', price: 34.5, stock: 40, categoryId: home.id, imageUrl: img('desk-lamp') },
    { name: 'Mechanical Keyboard', slug: 'mechanical-keyboard', description: 'Tactile switches, compact layout.', price: 119.0, stock: 15, categoryId: electronics.id, imageUrl: img('mechanical-keyboard') },
    { name: 'Ceramic Mug', slug: 'ceramic-mug', description: 'Holds 350ml of your favourite brew.', price: 12.99, stock: 80, categoryId: home.id, imageUrl: img('ceramic-mug') },
  ], skipDuplicates: true });
  console.log(`Seeded admin ${admin.email} and starter catalog.`);
}

main().finally(() => prisma.$disconnect());
