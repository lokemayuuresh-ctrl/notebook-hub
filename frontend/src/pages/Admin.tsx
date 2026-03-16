import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { BarChart3, Users, ShoppingBag, DollarSign, TrendingUp, LogOut, BookOpen, Store } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { toast } from 'sonner';

interface DashboardStats {
  totalUsers: number;
  totalSellers: number;
  totalBuyers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  pendingOrders: number;
  activeUsers: number;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface OrderData {
  _id: string;
  buyerId: string;
  buyerName: string;
  total: number;
  status: string;
  createdAt: string;
}

interface ProductData {
  _id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  sellerId: string;
  createdAt: string;
}

const Admin = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'orders' | 'products'>('dashboard');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Check if admin
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.id || currentUser.role !== 'admin') {
      navigate('/login');
    }
  }, [navigate]);

  const base = API_BASE_URL;

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${base}/api/admin/stats`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Stats fetch error', err);
      }
    };

    if (activeTab === 'dashboard') {
      fetchStats();
    }
  }, [activeTab, base]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${base}/api/admin/users`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (err) {
        console.error('Users fetch error', err);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, base]);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${base}/api/admin/orders`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (err) {
        console.error('Orders fetch error', err);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab, base]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${base}/api/admin/products`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (err) {
        console.error('Products fetch error', err);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'products') {
      fetchProducts();
    }
  }, [activeTab, base]);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${base}/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        toast.success("User deleted successfully");
        setUsers(users.filter(u => u._id !== userId));
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete user");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`${base}/api/admin/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        toast.success("Product deleted successfully");
        setProducts(products.filter(p => p._id !== productId));
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete product");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`${base}/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success(`Order status updated to ${newStatus}`);
        setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to update status");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Admin Header */}
        <div className="border-b border-border bg-card sticky top-16 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-serif font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-1">Manage your platform</p>
              </div>
              <Button variant="destructive" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${activeTab === 'dashboard'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </div>
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${activeTab === 'users'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Users
                </div>
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${activeTab === 'orders'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Orders
                </div>
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${activeTab === 'products'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Products
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && stats && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Overview</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Total Users */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Total Users</p>
                      <p className="text-3xl font-bold text-foreground mt-2">{stats.totalUsers}</p>
                      <p className="text-xs text-muted-foreground mt-2">Active: {stats.activeUsers}</p>
                    </div>
                    <Users className="h-12 w-12 text-primary opacity-20" />
                  </div>
                </div>

                {/* Total Orders */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Total Orders</p>
                      <p className="text-3xl font-bold text-foreground mt-2">{stats.totalOrders}</p>
                      <p className="text-xs text-muted-foreground mt-2">Pending: {stats.pendingOrders}</p>
                    </div>
                    <ShoppingBag className="h-12 w-12 text-primary opacity-20" />
                  </div>
                </div>

                {/* Total Revenue */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Total Revenue</p>
                      <p className="text-3xl font-bold text-foreground mt-2">₹{stats.totalRevenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-2">{stats.totalProducts} Total Products</p>
                    </div>
                    <DollarSign className="h-12 w-12 text-primary opacity-20" />
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm">Seller Count</p>
                      <p className="text-3xl font-bold text-foreground mt-2">{stats.totalSellers}</p>
                      <p className="text-xs text-muted-foreground mt-2">Buyers: {stats.totalBuyers}</p>
                    </div>
                    <Store className="h-12 w-12 text-primary opacity-20" />
                  </div>
                </div>
              </div>

              {/* Growth Chart */}
              <div className="mt-8 bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Platform Growth</h3>
                </div>
                <p className="text-muted-foreground">
                  Your platform is growing! You have {stats.totalUsers} registered users and {stats.totalOrders} completed orders.
                </p>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Registered Users</h2>
              {loading ? (
                <p className="text-muted-foreground">Loading users...</p>
              ) : (
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="text-left p-4 font-semibold text-foreground">Name</th>
                        <th className="text-left p-4 font-semibold text-foreground">Email</th>
                        <th className="text-left p-4 font-semibold text-foreground">Role</th>
                        <th className="text-left p-4 font-semibold text-foreground">Joined</th>
                        <th className="text-left p-4 font-semibold text-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user._id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="p-4 text-foreground">{user.name}</td>
                          <td className="p-4 text-muted-foreground">{user.email}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.role === 'seller'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                              }`}>
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground text-sm">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                                View Details
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user._id)}>
                                Delete
                                </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      No users found
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">All Orders</h2>
              {loading ? (
                <p className="text-muted-foreground">Loading orders...</p>
              ) : (
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="text-left p-4 font-semibold text-foreground">Order ID</th>
                        <th className="text-left p-4 font-semibold text-foreground">Customer</th>
                        <th className="text-left p-4 font-semibold text-foreground">Amount</th>
                        <th className="text-left p-4 font-semibold text-foreground">Status</th>
                        <th className="text-left p-4 font-semibold text-foreground">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order._id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="p-4 font-mono text-sm text-foreground">{order._id.slice(0, 8)}...</td>
                          <td className="p-4 text-foreground">{order.buyerName}</td>
                          <td className="p-4 text-foreground font-semibold">₹{order.total.toLocaleString()}</td>
                          <td className="p-4">
                            <select 
                                value={order.status} 
                                onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                                className={`px-2 py-1 rounded text-xs font-medium border border-border bg-background ${order.status === 'delivered'
                                    ? 'text-green-800 dark:text-green-100'
                                    : order.status === 'pending'
                                      ? 'text-yellow-800 dark:text-yellow-100'
                                      : 'text-red-800 dark:text-red-100'
                                  }`}
                            >
                                <option value="pending">Pending</option>
                                <option value="accepted">Accepted</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="p-4 text-muted-foreground text-sm">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {orders.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      No orders found
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">All Products</h2>
                <div className="bg-primary/10 px-4 py-2 rounded-lg">
                    <span className="text-primary font-semibold">Total: {products.length}</span>
                </div>
              </div>
              {loading ? (
                <p className="text-muted-foreground">Loading products...</p>
              ) : (
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="text-left p-4 font-semibold text-foreground">Product</th>
                        <th className="text-left p-4 font-semibold text-foreground">Category</th>
                        <th className="text-left p-4 font-semibold text-foreground">Price</th>
                        <th className="text-left p-4 font-semibold text-foreground">Stock</th>
                        <th className="text-left p-4 font-semibold text-foreground">Created</th>
                        <th className="text-left p-4 font-semibold text-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product._id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="p-4 text-foreground font-medium">{product.name}</td>
                          <td className="p-4 text-muted-foreground">{product.category}</td>
                          <td className="p-4 text-foreground font-semibold">₹{product.price.toLocaleString()}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${product.stock > 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {product.stock}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground text-sm">
                            {new Date(product.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product._id)}>
                                Delete Listing
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {products.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      No products found
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* User Details Modal (Simple Overlay) */}
          {selectedUser && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-2xl p-8 max-w-lg w-full shadow-2xl">
                <h3 className="text-2xl font-serif font-bold text-foreground mb-6">User Detailed Profile</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-muted-foreground font-medium">Name:</span>
                    <span className="col-span-2 text-foreground font-semibold">{selectedUser.name}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-t border-border pt-2">
                    <span className="text-muted-foreground font-medium">Email:</span>
                    <span className="col-span-2 text-foreground">{selectedUser.email}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-t border-border pt-2">
                    <span className="text-muted-foreground font-medium">Role:</span>
                    <span className="col-span-2">
                        <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase">
                            {selectedUser.role}
                        </span>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-t border-border pt-2">
                    <span className="text-muted-foreground font-medium">Created:</span>
                    <span className="col-span-2">{new Date(selectedUser.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-t border-border pt-2">
                    <span className="text-muted-foreground font-medium">Internal ID:</span>
                    <span className="col-span-2 font-mono text-xs">{selectedUser._id}</span>
                  </div>
                </div>
                <div className="mt-8">
                  <Button className="w-full" onClick={() => setSelectedUser(null)}>
                    Close Profile
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
