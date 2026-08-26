export type CartItem = {
  productId: string;
  name: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type Cart = { items: CartItem[]; subtotal: number; itemCount: number };

export type CatalogProduct = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
};
