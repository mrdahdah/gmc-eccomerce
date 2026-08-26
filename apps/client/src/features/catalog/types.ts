export type Category = { id: string; name: string; slug: string; productCount: number };

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl: string | null;
  stock: number;
  categoryId: string;
};
