import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersAPI } from '../lib/api.js';

/**
 * Hook to fetch all orders (filtered by role on server).
 * Providers receive their assigned orders + incoming (pending, unassigned) ones.
 * `options` are passed to react-query (e.g. { refetchInterval }).
 */
export const useOrders = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => ordersAPI.getAll(params),
    select: (response) => ({
      orders: response.data || [],
      pagination: response.pagination || {},
    }),
    ...options,
  });
};

/**
 * Hook to fetch a single order by ID.
 * Re-fetched automatically when a notification arrives (see NotificationContext).
 */
export const useOrder = (orderId) => {
  return useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => ordersAPI.getById(orderId),
    select: (response) => response.data?.order,
    enabled: !!orderId,
  });
};

/**
 * Hook to create a new order.
 */
export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => ordersAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

/**
 * Hook for a provider to accept an incoming order.
 */
export const useAcceptOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId) => ordersAPI.accept(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

/**
 * Hook to update order status (optionally with a note).
 */
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status, note }) => ordersAPI.updateStatus(orderId, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
  });
};

/**
 * Hook to assign a provider to an order.
 */
export const useAssignProvider = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, providerId }) =>
      ordersAPI.assignProvider(orderId, providerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export default {
  useOrders,
  useOrder,
  useCreateOrder,
  useAcceptOrder,
  useUpdateOrderStatus,
  useAssignProvider,
};
