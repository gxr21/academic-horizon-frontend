import { createContext, useContext } from "react";
import PropTypes from 'prop-types';
import { useAuth } from "./AuthContext";
import { useOrders as useOrdersQuery, useCreateOrder, useUpdateOrderStatus } from "../hooks/useOrders.js";

const OrderContext = createContext(null);

export const OrderProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { data: ordersData, isLoading, error, refetch } = useOrdersQuery(
    {},
    { enabled: isAuthenticated }
  );
  const createOrderMutation = useCreateOrder();
  const updateStatusMutation = useUpdateOrderStatus();

  const orders = ordersData?.orders || [];

  // Add a new order via API
  const addOrder = async (orderData) => {
    try {
      const result = await createOrderMutation.mutateAsync(orderData);
      return result.data?.order;
    } catch (err) {
      console.error('Create order error:', err);
      throw err;
    }
  };

  // Update order status via API
  const updateOrderStatus = async (orderId, status) => {
    try {
      await updateStatusMutation.mutateAsync({ orderId, status });
    } catch (err) {
      console.error('Update status error:', err);
      throw err;
    }
  };

  const belongsToUser = (order, userId) =>
    order.studentId === userId ||
    order.student?.id === userId ||
    order.providerId === userId ||
    order.provider?.id === userId;

  // Get user's orders (client-side filter for backward compat)
  const getUserOrders = (userId) => {
    return orders.filter((order) => belongsToUser(order, userId));
  };

  // Get completed orders count
  const getCompletedOrdersCount = (userId) => {
    return orders.filter(
      (order) =>
        belongsToUser(order, userId) &&
        (order.status === 'completed' || order.status === 'delivered')
    ).length;
  };

  // Get active orders count
  const getActiveOrdersCount = (userId) => {
    return orders.filter(
      (order) =>
        belongsToUser(order, userId) &&
        (order.status === 'pending' || order.status === 'in_progress' || order.status === 'assigned')
    ).length;
  };

  // Get order by ID
  const getOrderById = (orderId) => {
    return orders.find((order) => order.id === orderId);
  };

  // Get all completed orders (admin)
  const getAllCompletedOrders = () => {
    return orders.filter(
      (order) => order.status === 'completed' || order.status === 'delivered'
    );
  };

  // Get all orders (admin)
  const getAllOrders = () => orders;

  const value = {
    orders,
    isLoading,
    error,
    refetch,
    addOrder,
    updateOrderStatus,
    removeOrder: () => {},
    getUserOrders,
    getCompletedOrdersCount,
    getActiveOrdersCount,
    getOrderById,
    getAllCompletedOrders,
    getAllOrders,
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

OrderProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrders must be used within an OrderProvider");
  }
  return context;
};

export default OrderContext;
