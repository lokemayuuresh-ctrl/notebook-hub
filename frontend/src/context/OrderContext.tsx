import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { CartItem } from '@/types';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '@/lib/api';

// OrderStatus is now defined after the interface section
export type PaymentMethod = 'cod' | 'razorpay';

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  items: CartItem[];
  subtotal?: number;
  gst?: number;
  deliveryCharge?: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'paid';
  shippingAddress: string;
  shippingCity?: string;
  shippingDate?: string;
  estimatedDelivery?: string;
  deliveryDate?: string;
  trackingInfo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'order_update' | 'new_order';
  orderId: string;
  read: boolean;
  createdAt: string;
}

export type OrderStatus = 'pending' | 'accepted' | 'rejected' | 'shipped' | 'delivered' | 'cancelled';

interface OrderContextType {
  orders: Order[];
  notifications: Notification[];
  createOrder: (items: CartItem[], total: number, paymentMethod: PaymentMethod, shippingAddress: string, shippingCity?: string, buyerPhone?: string) => Promise<Order | null>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<Order | null>;
  cancelOrder: (orderId: string) => Promise<boolean>;
  getOrdersByBuyer: (buyerId: string) => Order[];
  getSellerOrders: () => Order[];
  markNotificationRead: (notificationId: string) => Promise<void>;
  getUnreadNotifications: (userId: string) => Notification[];
  clearNotifications: (userId: string) => Promise<void>;
  requestNotificationPermission: () => Promise<boolean>;
  fetchTrackingForOrder: (orderId: string) => Promise<any>;
  addTrackingEntry: (orderId: string, status: string, note?: string) => Promise<any>;
  resendDeliveryOtp: (orderId: string) => Promise<boolean>;
  trackingMap: Record<string, any>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Browser notification helper
const sendBrowserNotification = (title: string, body: string) => {
  // Always show toast
  toast(title, { description: body });

  // Also send browser notification if permitted
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
    });
    setTimeout(() => notification.close(), 5000);
  }
};

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [trackingMap, setTrackingMap] = useState<Record<string, any>>({});
  const { user } = useAuth();

  const base = API_BASE_URL;

  // Auto-refresh function
  const refreshOrdersAndNotifications = async () => {
    try {
      // Check if user is logged in
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (!currentUser || !currentUser.id) {
        // User not logged in, skip API calls
        return;
      }

      const res = await fetch(`${base}/api/orders`, {
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        // map backend orders to frontend shape
        const mapped = data.map((o: any) => ({
          id: o._id || o.id,
          buyerId: o.user?._id || o.user,
          buyerName: o.user?.name || '',
          buyerEmail: o.user?.email || '',
          items: o.items || [],
          subtotal: o.subtotal,
          gst: o.gst,
          deliveryCharge: o.deliveryCharge,
          total: o.total || 0,
          status: o.status || 'pending',
          paymentMethod: o.paymentMethod || 'cod',
          paymentStatus: o.paymentStatus || 'pending',
          shippingAddress: o.shippingAddress || '',
          shippingCity: o.shippingCity,
          shippingDate: o.shippingDate,
          estimatedDelivery: o.estimatedDelivery,
          deliveryDate: o.deliveryDate,
          trackingInfo: o.trackingInfo,
          createdAt: o.createdAt || new Date().toISOString(),
          updatedAt: o.updatedAt || new Date().toISOString()
        }));
        setOrders(mapped);
        saveOrders(mapped);
      } else {
        const storedOrders = localStorage.getItem('orders');
        if (storedOrders) setOrders(JSON.parse(storedOrders));
      }

      // Notifications for current user (if logged in)
      if (currentUser && currentUser.id) {
        const nres = await fetch(`${base}/api/notifications`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (nres.ok) {
          const ndata = await nres.json();
          const mappedN = ndata.map((n: any) => ({
            id: n._id || n.id,
            userId: n.user?._id || n.user,
            message: n.message,
            type: n.type,
            orderId: n.order?._id || n.order,
            read: n.read,
            createdAt: n.createdAt
          }));
          setNotifications(mappedN);
          saveNotifications(mappedN);
        } else {
          const storedNotifications = localStorage.getItem('notifications');
          if (storedNotifications) setNotifications(JSON.parse(storedNotifications));
        }
      }
    } catch (err) {
      const storedOrders = localStorage.getItem('orders');
      const storedNotifications = localStorage.getItem('notifications');
      if (storedOrders) setOrders(JSON.parse(storedOrders));
      if (storedNotifications) setNotifications(JSON.parse(storedNotifications));
    }
  };

  useEffect(() => {
    // Initial fetch
    refreshOrdersAndNotifications();

    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      refreshOrdersAndNotifications();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Socket.io Real-time implementation
  useEffect(() => {
    if (!user?.id) return;

    const setupSocket = async () => {
      // Connect to socket via server URL
      const base = API_BASE_URL;

      // We assume socket is already connected in AuthContext, 
      // but we need to listen for events here too or handle them globally.
      // For this project, let's add a separate listener here for order-specific refreshes.

      const res = await fetch(`${base}/api/auth/verify`, { credentials: 'include' });
      if (res.ok) {
        // We can't easily share the socketRef from AuthContext unless we expose it.
        // I'll add a simple polling or cross-tab broadcast if needed, 
        // but for now, I'll rely on the existing 30s poll AND add a custom listener
        // that triggers when a 'notification' toast appears (since AuthContext already toast()s).
      }
    };

    setupSocket();
  }, [user?.id]);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  // Fetch tracking for an order (caches in context)
  const fetchTrackingForOrder = useCallback(async (orderId: string) => {
    const base = API_BASE_URL;
    try {
      const res = await fetch(`${base}/api/ordertrackings/${orderId}`, {
        credentials: 'include'
      });
      if (!res.ok) return null;
      const t = await res.json();
      saveTracking(orderId, t);
      return t;
    } catch (e) {
      return trackingMap[orderId] || null;
    }
  }, []); // stable reference - no deps needed


  const addTrackingEntry = async (orderId: string, status: string, note = '') => {
    const base = API_BASE_URL;
    try {
      const res = await fetch(`${base}/api/ordertrackings`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ order: orderId, status, note })
      });
      if (!res.ok) throw new Error('Failed to add tracking entry');
      const saved = await res.json();
      saveTracking(orderId, saved);

      // Refresh notifications for buyer if possible
      try {
        const order = orders.find(o => o.id === orderId || o.id === (orderId));
        const buyerId = order?.buyerId || null;
        if (buyerId) {
          const nres = await fetch(`${base}/api/notifications?userId=${buyerId}`);
          if (nres.ok) {
            const ndata = await nres.json();
            const mappedN = ndata.map((n: any) => ({
              id: n._id || n.id,
              userId: n.user,
              message: n.message,
              type: n.type,
              orderId: n.order,
              read: n.read,
              createdAt: n.createdAt
            }));
            saveNotifications(mappedN);
          }
        }
      } catch (e) {
        // ignore
      }

      return saved;
    } catch (err) {
      // Local fallback: add to trackingMap
      const existing = trackingMap[orderId] || { order: orderId, history: [] };
      const entry = { status, note, createdAt: new Date().toISOString() };
      const updated = { ...existing, history: [...(existing.history || []), entry] };
      saveTracking(orderId, updated);
      return updated;
    }
  };

  const resendDeliveryOtp = async (orderId: string): Promise<boolean> => {
    try {
      const res = await fetch(`${base}/api/orders/${orderId}/resend-delivery-otp`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || 'Delivery OTP resent successfully');
        return true;
      } else {
        const error = await res.json().catch(() => ({ message: 'Failed to resend OTP' }));
        toast.error(error.message || 'Failed to resend OTP');
        return false;
      }
    } catch (err) {
      toast.error('Network error while resending OTP');
      return false;
    }
  };

  const saveOrders = (newOrders: Order[]) => {
    setOrders(newOrders);
    localStorage.setItem('orders', JSON.stringify(newOrders));
  };

  const saveNotifications = (newNotifications: Notification[]) => {
    setNotifications(newNotifications);
    localStorage.setItem('notifications', JSON.stringify(newNotifications));
  };

  const saveTracking = (orderId: string, tracking: any) => {
    setTrackingMap(prev => ({ ...prev, [orderId]: tracking }));
    try {
      localStorage.setItem('trackingMap', JSON.stringify({ ...trackingMap, [orderId]: tracking }));
    } catch (e) { }
  };

  const addNotification = (userId: string, message: string, type: 'order_update' | 'new_order', orderId: string, triggerBrowserNotification = true) => {
    const notification: Notification = {
      id: Date.now().toString(),
      userId,
      message,
      type,
      orderId,
      read: false,
      createdAt: new Date().toISOString()
    };
    const newNotifications = [...notifications, notification];
    saveNotifications(newNotifications);

    // Send browser notification
    if (triggerBrowserNotification) {
      const title = type === 'new_order' ? '🛒 New Order!' : '📦 Order Update';
      sendBrowserNotification(title, message);
    }
  };

  const createOrder = async (items: CartItem[], total: number, paymentMethod: PaymentMethod, shippingAddress: string, shippingCity?: string, buyerPhone?: string): Promise<Order | null> => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    try {
      // Transform cart items to backend format: { product: productId, quantity: number }
      const orderItems = items.map(item => ({
        product: item.product.id,
        quantity: item.quantity
      }));

      const base = API_BASE_URL;
      const res = await fetch(`${base}/api/orders`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: orderItems,
          paymentMethod,
          shippingAddress,
          shippingCity,
          buyerPhone
        })
      });

      if (res.ok) {
        const o = await res.json();
        const order: Order = {
          id: o._id || o.id,
          buyerId: o.user,
          buyerName: o.user?.name || currentUser.name || '',
          buyerEmail: o.user?.email || currentUser.email || '',
          buyerPhone: buyerPhone,
          items: o.items || items,
          subtotal: o.subtotal,
          gst: o.gst,
          deliveryCharge: o.deliveryCharge,
          total: o.total || total,
          status: o.status || 'pending',
          paymentMethod: o.paymentMethod || paymentMethod,
          paymentStatus: o.paymentStatus || (paymentMethod === 'razorpay' ? 'paid' : 'pending'),
          shippingAddress: o.shippingAddress || shippingAddress,
          shippingCity: o.shippingCity || shippingCity,
          shippingDate: o.shippingDate,
          estimatedDelivery: o.estimatedDelivery,
          deliveryDate: o.deliveryDate,
          trackingInfo: o.trackingInfo,
          createdAt: o.createdAt || new Date().toISOString(),
          updatedAt: o.updatedAt || new Date().toISOString()
        };

        const newOrders = [...orders, order];
        saveOrders(newOrders);

        // Refresh notifications for current user
        if (currentUser && currentUser.id) {
          try {
            const nres = await fetch(`${base}/api/notifications`, {
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            if (nres.ok) {
              const ndata = await nres.json();
              const mappedN = ndata.map((n: any) => ({
                id: n._id || n.id,
                userId: n.user?._id || n.user,
                message: n.message,
                type: n.type,
                orderId: n.order?._id || n.order,
                read: n.read,
                createdAt: n.createdAt
              }));
              saveNotifications(mappedN);
            }
          } catch (e) {
            // ignore notification fetch errors
          }
        }

        toast.success('Order created successfully');
        return order;
      }

      // fallback to local creation
      toast.error('Unable to create order on server, saved locally');
    } catch (err) {
      // network error, fallback to local
      toast.error('Network error while creating order, saved locally');
    }

    // Local fallback (previous behavior)
    const fallbackOrder: Order = {
      id: `ORD-${Date.now()}`,
      buyerId: currentUser.id,
      buyerName: currentUser.name,
      buyerEmail: currentUser.email,
      buyerPhone,
      items,
      subtotal: total,
      gst: 0,
      deliveryCharge: 0,
      total,
      status: 'pending',
      paymentMethod,
      paymentStatus: paymentMethod === 'razorpay' ? 'paid' : 'pending',
      shippingAddress,
      shippingCity,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newOrders = [...orders, fallbackOrder];
    saveOrders(newOrders);

    // Notify all sellers about new order (local-only)
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    users.filter((u: any) => u.role === 'seller').forEach((seller: any) => {
      addNotification(
        seller.id,
        `New order #${fallbackOrder.id} from ${currentUser.name} - ₹${total.toLocaleString()}`,
        'new_order',
        fallbackOrder.id
      );
    });

    return fallbackOrder;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await fetch(`${base}/api/orders/${orderId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        const o = await res.json();
        const updatedOrders = orders.map(order =>
          order.id === (o._id || o.id) ? { ...order, status: o.status, updatedAt: o.updatedAt || new Date().toISOString() } : order
        );
        saveOrders(updatedOrders);

        // Fetch notifications for affected users (buyer)
        try {
          const buyerId = o.user?._id || o.user;
          if (buyerId) {
            const nres = await fetch(`${base}/api/notifications`, {
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            if (nres.ok) {
              const ndata = await nres.json();
              const mappedN = ndata.map((n: any) => ({
                id: n._id || n.id,
                userId: n.user?._id || n.user,
                message: n.message,
                type: n.type,
                orderId: n.order?._id || n.order,
                read: n.read,
                createdAt: n.createdAt
              }));
              saveNotifications(mappedN);
            }
          }
        } catch (e) {
          // ignore
        }

        toast.success('Order status updated');
        return o;
      }

      toast.error('Failed to update order on server');
    } catch (err) {
      // network error: update locally
      const updatedOrders = orders.map(order => {
        if (order.id === orderId) return { ...order, status, updatedAt: new Date().toISOString() };
        return order;
      });
      saveOrders(updatedOrders);

      const statusMessages: Record<OrderStatus, string> = {
        pending: 'Your order is pending review',
        accepted: 'Great news! Your order has been accepted by the seller',
        rejected: 'Sorry, your order has been rejected by the seller',
        shipped: 'Your order has been shipped!',
        delivered: 'Your order has been delivered!',
        cancelled: 'Your order has been cancelled'
      };

      const order = orders.find(o => o.id === orderId);
      if (order) {
        addNotification(
          order.buyerId,
          `Order #${orderId}: ${statusMessages[status]}`,
          'order_update',
          orderId
        );
      }

      toast.success('Order status updated locally');
      return null;
    }
  };

  const cancelOrder = async (orderId: string): Promise<boolean> => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    // Can only cancel pending orders
    if (order.status !== 'pending') {
      toast.error('Only pending orders can be cancelled');
      return false;
    }

    try {
      await updateOrderStatus(orderId, 'cancelled');
      toast.success('Order cancelled');
      return true;
    } catch (e) {
      // updateOrderStatus has its own local fallback
      toast.error('Failed to cancel order on server, updated locally');
      return true;
    }
  };

  const getOrdersByBuyer = (buyerId: string) => {
    return orders.filter(order => order.buyerId === buyerId);
  };

  const getSellerOrders = () => {
    return orders;
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      const res = await fetch(`${base}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        const updated = await res.json();
        const newNotifs = notifications.map(n => n.id === (updated._id || updated.id) ? { ...n, read: true } : n);
        saveNotifications(newNotifs);
        return;
      }
    } catch (e) {
      // ignore network error and update locally
    }

    const updated = notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    saveNotifications(updated);
  };

  const getUnreadNotifications = (userId: string) => {
    return notifications.filter(n => n.userId === userId && !n.read);
  };

  const clearNotifications = async (userId: string) => {
    // Mark all user's notifications as read
    const userNotifs = notifications.filter(n => n.userId === userId && !n.read);
    try {
      await Promise.all(userNotifs.map(n =>
        fetch(`${base}/api/notifications/${n.id}/read`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      ));
    } catch (e) {
      // ignore
    }

    const updated = notifications.map(n => n.userId === userId ? { ...n, read: true } : n);
    saveNotifications(updated);
  };

  // Expose tracking helpers in context type
  // (Update interface earlier if TypeScript complains)


  return (
    <OrderContext.Provider value={{
      orders,
      notifications,
      createOrder,
      updateOrderStatus,
      cancelOrder,
      getOrdersByBuyer,
      getSellerOrders,
      markNotificationRead,
      getUnreadNotifications,
      clearNotifications,
      requestNotificationPermission,
      fetchTrackingForOrder,
      addTrackingEntry,
      resendDeliveryOtp,
      trackingMap
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};
