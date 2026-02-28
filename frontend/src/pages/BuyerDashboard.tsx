import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useOrders } from '@/context/OrderContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/layout/Layout';
import { useEffect, useState } from 'react';
import { 
  Package, 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  ArrowRight,
  TrendingUp,
  DollarSign
} from 'lucide-react';

const BuyerDashboard = () => {
  const { user } = useAuth();
  const { getOrdersByBuyer, getUnreadNotifications } = useOrders();
  const navigate = useNavigate();

  const orders = user ? getOrdersByBuyer(user.id) : [];
  const notifications = user ? getUnreadNotifications(user.id) : [];

  // Calculate statistics
  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    deliveredOrders: orders.filter(o => o.status === 'delivered').length,
    totalSpent: orders.reduce((sum, o) => sum + o.total, 0)
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
      accepted: 'bg-green-500/20 text-green-600 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-600 border-red-500/30',
      shipped: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
      delivered: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30',
      cancelled: 'bg-gray-500/20 text-gray-600 border-gray-500/30'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-600 border-gray-500/30';
  };

  const recentOrders = orders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
              Welcome back, {user?.name || 'Buyer'}!
            </h1>
            <p className="text-muted-foreground">Manage your orders and track your purchases</p>
          </div>
          <Button onClick={() => navigate('/products')}>
            <ShoppingBag className="h-4 w-4 mr-2" />
            Browse Products
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalOrders}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <Package className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Orders</p>
                <p className="text-2xl font-bold text-foreground">{stats.pendingOrders}</p>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Delivered</p>
                <p className="text-2xl font-bold text-foreground">{stats.deliveredOrders}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                <p className="text-2xl font-bold text-foreground">₹{stats.totalSpent.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-3">Recent Notifications</h2>
            <div className="space-y-2">
              {notifications.slice(0, 3).map(notification => (
                <div 
                  key={notification.id} 
                  className="bg-background rounded-lg p-3 flex items-center justify-between"
                >
                  <p className="text-sm text-foreground">{notification.message}</p>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate('/my-orders')}
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Orders */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Recent Orders</h2>
            <Button variant="outline" onClick={() => navigate('/my-orders')}>
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">No orders yet</p>
              <p className="text-sm text-muted-foreground mb-4">Start shopping to see your orders here</p>
              <Button onClick={() => navigate('/products')}>
                Browse Products
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map(order => (
                <div 
                  key={order.id} 
                  className="bg-background border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate('/my-orders')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold text-foreground">Order #{order.id}</p>
                        <Badge className={`${getStatusColor(order.status)} border`}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                        <span>•</span>
                        <span>₹{order.total.toLocaleString()}</span>
                        <span>•</span>
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default BuyerDashboard;





