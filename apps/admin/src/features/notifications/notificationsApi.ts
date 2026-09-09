import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuthHandling } from '../../store/baseQuery';
import type { AppNotification, NotificationPage } from './types';

export const notificationsApi = createApi({
  reducerPath: 'notificationsApi',
  baseQuery: baseQueryWithAuthHandling,
  tagTypes: ['Notifications', 'UnreadCount'],
  endpoints: (build) => ({
    getNotifications: build.query<NotificationPage, { skip?: number; take?: number }>({
      query: ({ skip = 0, take = 20 } = {}) => `notifications?skip=${skip}&take=${take}`,
      providesTags: ['Notifications'],
    }),
    getUnreadCount: build.query<{ unread: number }, void>({
      query: () => 'notifications/unread-count',
      providesTags: ['UnreadCount'],
    }),
    markRead: build.mutation<AppNotification, string>({
      query: (id) => ({ url: `notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notifications', 'UnreadCount'],
    }),
    markAllRead: build.mutation<{ updated: number }, void>({
      query: () => ({ url: 'notifications/read-all', method: 'PATCH' }),
      invalidatesTags: ['Notifications', 'UnreadCount'],
    }),
    /** Whether the server has VAPID keys, so the composer can say so up front. */
    getPushStatus: build.query<{ publicKey: string | null; enabled: boolean }, void>({
      query: () => 'notifications/vapid-public-key',
    }),
    broadcast: build.mutation<
      { sent: number; failed: number; pruned: number },
      { title: string; message: string; url?: string }
    >({
      query: (body) => ({ url: 'notifications/broadcast', method: 'POST', body }),
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
  useGetPushStatusQuery,
  useBroadcastMutation,
} = notificationsApi;
