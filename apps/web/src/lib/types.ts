export type Role = 'CUSTOMER' | 'ADMIN';

export type User = { id: string; firstName: string; lastName: string; email: string; role: Role };
export type AuthResponse = { user: User; accessToken: string };

export type Category = { id: string; name: string; slug: string; productCount: number };

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl: string | null;
  stock: number;
  categoryId: string;
  category?: { id: string; name: string; slug: string };
  createdAt?: string;
};

export type Paginated<T> = { items: T[]; total: number; page: number; limit: number; pages: number };

export type OrderItem = {
  productId: string;
  name?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type Order = {
  id: string;
  status: string;
  total: number;
  email?: string;
  customer?: string;
  items: OrderItem[];
  createdAt: string;
};
