import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export type Category = { id: string; name: string; slug: string; productCount: number };

// The admin token is stored by the storefront under localStorage['auth'].
function authToken(): string | null {
  const raw = localStorage.getItem('auth');
  if (!raw) return null;
  try {
    return JSON.parse(raw)?.accessToken ?? null;
  } catch {
    return null;
  }
}

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
    prepareHeaders: (headers) => {
      const token = authToken();
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Category'],
  endpoints: (build) => ({
    getCategories: build.query<Category[], void>({
      query: () => 'categories',
      providesTags: [{ type: 'Category', id: 'LIST' }],
    }),
    createCategory: build.mutation<Category, { name: string; slug?: string }>({
      query: (body) => ({ url: 'categories', method: 'POST', body }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),
    updateCategory: build.mutation<Category, { id: string; name?: string; slug?: string }>({
      query: ({ id, ...body }) => ({ url: `categories/${id}`, method: 'PATCH', body }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),
    deleteCategory: build.mutation<{ id: string; deleted: boolean }, string>({
      query: (id) => ({ url: `categories/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = adminApi;
