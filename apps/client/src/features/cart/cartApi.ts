import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Cart, CatalogProduct } from './types';
import type { RootState } from '../../store';

// Cart endpoints are per-user; the JWT is read from the auth slice on every request.
export const cartApi = createApi({
  reducerPath: 'cartApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Cart'],
  endpoints: (build) => ({
    getCart: build.query<Cart, void>({
      query: () => 'cart',
      providesTags: [{ type: 'Cart', id: 'ME' }],
    }),
    getCatalog: build.query<CatalogProduct[], void>({
      query: () => 'cart/catalog',
    }),
    addItem: build.mutation<Cart, { productId: string; quantity?: number }>({
      query: (body) => ({ url: 'cart/items', method: 'POST', body }),
      invalidatesTags: [{ type: 'Cart', id: 'ME' }],
    }),
    updateItem: build.mutation<Cart, { productId: string; quantity: number }>({
      query: ({ productId, quantity }) => ({ url: `cart/items/${productId}`, method: 'PATCH', body: { quantity } }),
      invalidatesTags: [{ type: 'Cart', id: 'ME' }],
    }),
    removeItem: build.mutation<Cart, string>({
      query: (productId) => ({ url: `cart/items/${productId}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Cart', id: 'ME' }],
    }),
    clearCart: build.mutation<Cart, void>({
      query: () => ({ url: 'cart', method: 'DELETE' }),
      invalidatesTags: [{ type: 'Cart', id: 'ME' }],
    }),
  }),
});

export const {
  useGetCartQuery,
  useGetCatalogQuery,
  useAddItemMutation,
  useUpdateItemMutation,
  useRemoveItemMutation,
  useClearCartMutation,
} = cartApi;
