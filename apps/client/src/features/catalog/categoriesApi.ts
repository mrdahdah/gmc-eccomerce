import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { CatalogProduct, Category } from './types';

// Public catalog reads. No auth header needed — categories and their products are public.
export const catalogApi = createApi({
  reducerPath: 'catalogApi',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api' }),
  tagTypes: ['Category'],
  endpoints: (build) => ({
    getCategories: build.query<Category[], void>({
      query: () => 'categories',
      providesTags: [{ type: 'Category', id: 'LIST' }],
    }),
    getCategoryProducts: build.query<CatalogProduct[], string>({
      query: (slug) => `categories/${slug}/products`,
    }),
  }),
});

export const { useGetCategoriesQuery, useGetCategoryProductsQuery } = catalogApi;
