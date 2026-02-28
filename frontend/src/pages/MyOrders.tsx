import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useOrders, OrderStatus } from '@/context/OrderContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/layout/Layout';
import { useEffect, useState } from 'react';

import { LiveTracking } from '@/components/orders/LiveTracking';
import { InvoiceDownload } from '@/components/orders/InvoiceDownload';
import { PaymentButton } from '@/components/orders/PaymentButton';

import {
  Package,
  CheckCircle,
  XCircle,
  Truck,
  Clock,
  ArrowLeft,
  Bell,
  Ban,
  MapPin,
  Calendar
} from 'lucide-react';
import { getImageUrl } from '@/lib/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const MyOrders = () => {
  const { user } = useAuth();
  const { getOrdersByBuyer, getUnreadNotifications, markNotificationRead, cancelOrder, orders: allOrders } = useOrders();
  const navigate = useNavigate();

  // Auto-refresh orders when component mounts or user changes
  useEffect(() => {
    if (user) {
      // Orders are auto-refreshed by OrderContext every 30 seconds
      // This ensures we have the latest data
    }
  }, [user]);

  const orders = user ? getOrdersByBuyer(user.id).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ) : [];
  const notifications = user ? getUnreadNotifications(user.id) : [];

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      pending: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
      accepted: 'bg-green-500/20 text-green-600 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-600 border-red-500/30',
      shipped: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
      delivered: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30',
      cancelled: 'bg-gray-500/20 text-gray-600 border-gray-500/30'
    };
    return colors[status];
  };

  const getStatusIcon = (status: OrderStatus) => {
    const icons: Record<OrderStatus, JSX.Element> = {
      pending: <Clock className="h-4 w-4" />,
      accepted: <CheckCircle className="h-4 w-4" />,
      rejected: <XCircle className="h-4 w-4" />,
      shipped: <Truck className="h-4 w-4" />,
      delivered: <Package className="h-4 w-4" />,
      cancelled: <Ban className="h-4 w-4" />
    };
    return icons[status];
  };

  const getTrackingSteps = (status: OrderStatus) => {
    const steps = ['pending', 'accepted', 'shipped', 'delivered'];
    const currentIdx = steps.indexOf(status);

    return steps.map((step, idx) => ({
      name: step.charAt(0).toUpperCase() + step.slice(1),
      completed: status !== 'rejected' && status !== 'cancelled' && idx <= currentIdx,
      current: idx === currentIdx,
      rejected: status === 'rejected' && idx === 1,
      cancelled: status === 'cancelled'
    }));
  };

  const canCancelOrder = (status: OrderStatus) => {
    return status === 'pending';
  };

  const handleCancelOrder = async (orderId: string) => {
    await cancelOrder(orderId);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Shop
        </Button>

        <h1 className="text-3xl font-serif font-bold text-foreground mb-8">My Orders</h1>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </h2>
            <div className="space-y-3">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm text-foreground font-medium">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => await markNotificationRead(notification.id)}
                  >
                    Dismiss
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders */}
        {orders.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No orders yet</p>
            <p className="text-sm text-muted-foreground mb-4">Start shopping to see your orders here</p>
            <Button onClick={() => navigate('/products')}>
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Order Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground text-lg">{order.id}</h3>
                        <Badge className={`${getStatusColor(order.status)} border`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">{order.status}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                        <span>•</span>
                        <span>{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-foreground">₹{order.total.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.paymentMethod === 'cod' ? '💵 Cash on Delivery' : '💳 Paid via Razorpay'}
                        </p>
                        <Badge
                          variant={order.paymentStatus === 'paid' ? 'default' : 'destructive'}
                          className="mt-1"
                        >
                          {order.paymentStatus === 'paid' ? '✅ Paid' : '⏳ Pending'}
                        </Badge>
                      </div>
                      {canCancelOrder(order.status) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="gap-2">
                              <Ban className="h-4 w-4" />
                              Cancel
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel this order? This action cannot be undone.
                                {order.paymentMethod === 'razorpay' && (
                                  <span className="block mt-2 text-amber-600">
                                    Note: Refund for prepaid orders may take 5-7 business days.
                                  </span>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep Order</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleCancelOrder(order.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Yes, Cancel Order
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>

                  {/* Live Order Tracking */}
                  {order.status !== 'rejected' && order.status !== 'cancelled' && (
                    <div className="mb-6">
                      <LiveTracking
                        orderId={order.id}
                        orderStatus={order.status}
                        shippingDate={(order as any).shippingDate}
                        estimatedDelivery={(order as any).estimatedDelivery}
                        deliveryDate={(order as any).deliveryDate}
                        trackingInfo={(order as any).trackingInfo}
                      />
                    </div>
                  )}

                  {/* Cancelled/Rejected Message */}
                  {order.status === 'cancelled' && (
                    <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 mb-6">
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium flex items-center gap-2">
                        <Ban className="h-4 w-4" />
                        This order was cancelled. {order.paymentMethod === 'razorpay' && 'Refund will be processed within 5-7 business days.'}
                      </p>
                    </div>
                  )}

                  {order.status === 'rejected' && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                      <p className="text-sm text-destructive font-medium flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        This order was rejected by the seller. Please contact support for refund if payment was made.
                      </p>
                    </div>
                  )}

                  {/* Items */}
                  <div className="border-t border-border pt-4">
                    <p className="text-sm font-semibold text-foreground mb-3">Order Items</p>
                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 bg-muted/20 rounded-lg p-3">
                          <img
                            src={getImageUrl(item.product.image)}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover rounded-lg border border-border"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{item.product.name}</p>
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-semibold text-foreground">
                            ₹{(item.product.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="border-t border-border pt-4 mt-4">
                    <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Shipping Address
                    </p>
                    <p className="text-sm text-muted-foreground bg-muted/20 rounded-lg p-3">{order.shippingAddress}</p>
                  </div>

                  {/* Payment Section */}
                  {order.status === 'delivered' && order.paymentStatus === 'pending' && (
                    <div className="border-t border-border pt-4 mt-4">
                      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
                          ⚠️ Payment Pending
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          Please complete your payment to download the invoice.
                        </p>
                      </div>
                      <PaymentButton
                        orderId={order.id}
                        amount={order.total}
                        paymentMethod={order.paymentMethod}
                        paymentStatus={order.paymentStatus}
                        onPaymentSuccess={() => {
                          // Refresh orders
                          window.location.reload();
                        }}
                      />
                    </div>
                  )}

                  {/* Invoice Download */}
                  {order.status === 'delivered' && order.paymentStatus === 'paid' && (
                    <div className="border-t border-border pt-4 mt-4">
                      <InvoiceDownload orderId={order.id} orderStatus={order.status} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyOrders;
