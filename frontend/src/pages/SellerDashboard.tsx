import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useOrders, OrderStatus } from '@/context/OrderContext';
import { useProducts } from '@/context/ProductContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';
import {
  ShoppingBag,
  Package,
  DollarSign,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Bell,
  X,
  Loader2,
  Ban
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getImageUrl } from '@/lib/image';

const SellerDashboard = () => {
  const { user, logout } = useAuth();
  const { getSellerOrders, updateOrderStatus, getUnreadNotifications, markNotificationRead, fetchTrackingForOrder, addTrackingEntry } = useOrders();
  const [orderNotes, setOrderNotes] = useState<Record<string, string>>({});
  const [orderStatuses, setOrderStatuses] = useState<Record<string, string>>({});
  const [acceptOrderModal, setAcceptOrderModal] = useState<string | null>(null);
  const [shippingDate, setShippingDate] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const { getSellerProducts, addProduct, updateProduct, deleteProduct, categories } = useProducts();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'notifications'>('orders');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);

  // Product form state
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    imageFile: null as File | null,
    category: '',
    stock: ''
  });

  const orders = getSellerOrders();
  const sellerProducts = user ? getSellerProducts(user.id) : [];
  const unreadNotifications = user ? getUnreadNotifications(user.id) : [];

  const handleStatusUpdate = async (orderId: string, status: OrderStatus, shippingDate?: string, estimatedDelivery?: string, trackingInfo?: string, otp?: string) => {
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const body: any = { status };
      if (shippingDate) body.shippingDate = shippingDate;
      if (estimatedDelivery) body.estimatedDelivery = estimatedDelivery;
      if (trackingInfo) body.trackingInfo = trackingInfo;
      if (otp) body.otp = otp;

      const res = await fetch(`${base}/api/orders/${orderId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        await fetchTrackingForOrder(orderId);
        toast.success("Order Updated", {
          description: `Order ${orderId} has been ${status}`,
        });
        setAcceptOrderModal(null);
        setShippingDate('');
        setEstimatedDelivery('');
        return true;
      } else {
        const error = await res.json().catch(() => ({ message: 'Update failed' }));
        toast.error('Update failed', {
          description: error.message || 'Unable to update order status',
        });
        return false;
      }
    } catch (e: any) {
      toast.error('Update failed', {
        description: e.message || 'Unable to update order status',
      });
      return false;
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    if (!shippingDate || !estimatedDelivery) {
      toast.error('Validation Error', {
        description: 'Please provide shipping date and estimated delivery date',
      });
      return;
    }

    await handleStatusUpdate(orderId, 'accepted', shippingDate, estimatedDelivery);
  };

  const resetForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      image: '',
      imageFile: null,
      category: '',
      stock: ''
    });
    setShowAddProduct(false);
    setEditingProduct(null);
  };

  const [isAddingProduct, setIsAddingProduct] = useState(false);

  const handleAddProduct = () => {
    if (!productForm.name || !productForm.price || !productForm.category) {
      toast.error("Missing fields", {
        description: "Please fill in name, price, and category",
      });
      return;
    }

    setIsAddingProduct(true);
    (async () => {
      try {
        const payload: any = {
          name: productForm.name,
          description: productForm.description,
          price: parseFloat(productForm.price),
          image: productForm.image || undefined,
          category: productForm.category,
          stock: parseInt(productForm.stock) || 0,
          sellerId: user?.id,
          sellerName: user?.name
        };
        if (productForm.imageFile) payload.imageFile = productForm.imageFile;
        const added = await addProduct(payload);

        toast.success("Product Added", {
          description: `${added.name} has been added to your store`,
        });
        resetForm();
      } catch (error: any) {
        console.error('Failed to add product:', error);
        toast.error("Failed to add product", {
          description: error.message || "An unexpected error occurred",
        });
      } finally {
        setIsAddingProduct(false);
      }
    })();
  };

  const handleUpdateProduct = () => {
    if (!editingProduct) return;

    (async () => {
      const upd: any = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        image: productForm.image,
        category: productForm.category,
        stock: parseInt(productForm.stock) || 0
      };
      if (productForm.imageFile) upd.imageFile = productForm.imageFile;
      await updateProduct(editingProduct, upd);

      toast.success("Product Updated", {
        description: `${productForm.name} has been updated`,
      });
      resetForm();
    })();
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      (async () => {
        await deleteProduct(id);
        toast.success("Product Deleted", {
          description: `${name} has been removed from your store`,
        });
      })();
    }
  };

  const startEditProduct = (product: any) => {
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image: product.image,
      imageFile: null,
      category: product.category,
      stock: product.stock.toString()
    });
    setEditingProduct(product.id);
    setShowAddProduct(true);
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      pending: 'bg-yellow-500/20 text-yellow-600',
      accepted: 'bg-green-500/20 text-green-600',
      rejected: 'bg-red-500/20 text-red-600',
      shipped: 'bg-blue-500/20 text-blue-600',
      delivered: 'bg-emerald-500/20 text-emerald-600',
      cancelled: 'bg-gray-500/20 text-gray-600'
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

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    products: sellerProducts.length,
    revenue: orders.filter(o => o.status !== 'rejected' && o.status !== 'cancelled').reduce((sum, o) => sum + o.total, 0)
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Page Title with notification */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Seller Dashboard</h1>
            <p className="text-muted-foreground">Manage your orders, products, and notifications</p>
          </div>
          <button
            onClick={() => setActiveTab('notifications')}
            className="relative p-3 hover:bg-muted rounded-lg border border-border"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            {unreadNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                {unreadNotifications.length}
              </span>
            )}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Orders</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.products}</p>
                <p className="text-sm text-muted-foreground">Products</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">₹{stats.revenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Revenue</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-nowrap overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar">
          <Button
            variant={activeTab === 'orders' ? 'default' : 'outline'}
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Orders
          </Button>
          <Button
            variant={activeTab === 'products' ? 'default' : 'outline'}
            onClick={() => setActiveTab('products')}
          >
            <Package className="h-4 w-4 mr-2" />
            My Products
            <Badge variant="secondary" className="ml-2">{sellerProducts.length}</Badge>
          </Button>
          <Button
            variant={activeTab === 'notifications' ? 'default' : 'outline'}
            onClick={() => setActiveTab('notifications')}
          >
            <Bell className="h-4 w-4 mr-2" />
            Notifications
            {unreadNotifications.length > 0 && (
              <Badge variant="destructive" className="ml-2">{unreadNotifications.length}</Badge>
            )}
          </Button>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Add/Edit Product Form */}
            {showAddProduct ? (
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-foreground">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <Button variant="ghost" size="icon" onClick={resetForm}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      placeholder="Enter product name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      placeholder="e.g., Notebooks, Pens, Art Supplies"
                      list="categories"
                    />
                    <datalist id="categories">
                      {categories.filter(c => c !== 'All').map(c => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₹) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="image">Image URL</Label>
                    <Input
                      id="image"
                      value={productForm.image}
                      onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="imageFile">Or upload local image</Label>
                    <input
                      id="imageFile"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProductForm({ ...productForm, imageFile: e.target.files ? e.target.files[0] : null })}
                    />
                    <p className="text-sm text-muted-foreground">Local upload takes precedence over the Image URL.</p>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      placeholder="Describe your product..."
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
                    disabled={isAddingProduct}
                  >
                    {isAddingProduct ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      editingProduct ? 'Update Product' : 'Add Product'
                    )}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setShowAddProduct(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Product
              </Button>
            )}

            {/* Product List */}
            {sellerProducts.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground">No products yet</p>
                <p className="text-sm text-muted-foreground mb-4">Add your first product to start selling</p>
                <Button onClick={() => setShowAddProduct(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sellerProducts.map(product => (
                  <div key={product.id} className="bg-card border border-border rounded-xl overflow-hidden">
                    <img
                      src={getImageUrl(product.image)}
                      alt={product.name}
                      className="w-full h-40 object-cover"
                    />
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-foreground line-clamp-1">{product.name}</h3>
                        <Badge variant="secondary">{product.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-bold text-foreground">₹{product.price.toLocaleString()}</span>
                        <span className="text-sm text-muted-foreground">Stock: {product.stock}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => startEditProduct(product)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground">No orders yet</p>
                <p className="text-sm text-muted-foreground">Orders will appear here when customers place them</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-card border border-border rounded-xl p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground text-sm md:text-base break-all">#{order.id}</h3>
                        <Badge className={`${getStatusColor(order.status)} whitespace-nowrap`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">{order.status}</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()} • {order.buyerName}
                      </p>
                      {order.buyerPhone && (
                        <p className="text-sm text-muted-foreground">Phone: {order.buyerPhone}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-foreground">₹{order.total.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay'} •
                        <Badge
                          variant={order.paymentStatus === 'paid' ? 'default' : 'destructive'}
                          className="ml-2"
                        >
                          {order.paymentStatus === 'paid' ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Paid
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </>
                          )}
                        </Badge>
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 mb-4">
                    <p className="text-sm font-medium text-foreground mb-2">Items:</p>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.product.name} x{item.quantity}</span>
                          <span className="text-foreground">₹{(item.product.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 mb-4">
                    <p className="text-sm font-medium text-foreground mb-1">Shipping Address:</p>
                    <p className="text-sm text-muted-foreground">{order.shippingAddress}</p>
                  </div>

                  <div className="space-y-3">
                    {order.status === 'pending' && (
                      <div className="flex gap-3">
                        <Button
                          onClick={() => setAcceptOrderModal(order.id)}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept Order
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleStatusUpdate(order.id, 'rejected')}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject Order
                        </Button>
                      </div>
                    )}

                    {/* Shipping Date and Estimated Delivery Display */}
                    {(order as any).shippingDate && (
                      <div className="bg-muted/30 rounded-lg p-3 mt-3">
                        <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Shipping Information
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Shipping Date: </span>
                            <span className="text-foreground font-medium">
                              {new Date((order as any).shippingDate).toLocaleDateString()}
                            </span>
                          </div>
                          {(order as any).estimatedDelivery && (
                            <div>
                              <span className="text-muted-foreground">Est. Delivery: </span>
                              <span className="text-foreground font-medium">
                                {new Date((order as any).estimatedDelivery).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                        {(order as any).trackingInfo && (
                          <div className="mt-2 text-sm">
                            <span className="text-muted-foreground">Tracking: </span>
                            <span className="text-foreground font-medium">{(order as any).trackingInfo}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {order.status === 'accepted' && (
                      <Button
                        onClick={() => handleStatusUpdate(order.id, 'shipped')}
                        className="w-full"
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Mark as Shipped
                      </Button>
                    )}

                    {order.status === 'shipped' && (
                      <Button
                        onClick={() => handleStatusUpdate(order.id, 'delivered')}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Delivered
                      </Button>
                    )}

                    {/* Quick tracking update: add a note and optionally change status */}
                    <div className="mt-3 grid md:grid-cols-3 gap-2 items-start">
                      <Textarea
                        placeholder="Add tracking note (e.g., AWB: 123456)"
                        value={orderNotes[order.id] || ''}
                        onChange={(e) => setOrderNotes({ ...orderNotes, [order.id]: e.target.value })}
                        className="md:col-span-2"
                        rows={2}
                      />

                      <div className="flex flex-col gap-2">
                        <select
                          className="input w-full"
                          value={orderStatuses[order.id] || ''}
                          onChange={(e) => setOrderStatuses({ ...orderStatuses, [order.id]: e.target.value })}
                        >
                          <option value="">(No status change)</option>
                          <option value="accepted">accepted</option>
                          <option value="shipped">shipped</option>
                          <option value="delivered">delivered</option>
                          <option value="cancelled">cancelled</option>
                        </select>
                        <Button
                          onClick={async () => {
                            const note = orderNotes[order.id] || '';
                            const status = orderStatuses[order.id] || '';
                            try {
                              if (status) await handleStatusUpdate(order.id, status as OrderStatus);
                              await addTrackingEntry(order.id, (status as OrderStatus) || order.status, note);
                              await fetchTrackingForOrder(order.id);
                              setOrderNotes({ ...orderNotes, [order.id]: '' });
                              setOrderStatuses({ ...orderStatuses, [order.id]: '' });
                              toast.success('Tracking updated', { description: 'Tracking note added and status applied' });
                            } catch (e) {
                              toast.error('Failed', { description: 'Could not update tracking' });
                            }
                          }}
                        >
                          Update & Track
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-3">
            {unreadNotifications.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground">No new notifications</p>
              </div>
            ) : (
              unreadNotifications.map(notification => (
                <div
                  key={notification.id}
                  className="bg-card border border-border rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm text-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await markNotificationRead(notification.id);
                      toast.success('Notification marked as read');
                    }}
                  >
                    Mark as Read
                  </Button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Accept Order Dialog */}
        <Dialog open={!!acceptOrderModal} onOpenChange={(open) => !open && setAcceptOrderModal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Accept Order</DialogTitle>
              <DialogDescription>
                Please provide shipping date and estimated delivery date to accept this order.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="shippingDate">Shipping Date *</Label>
                <Input
                  id="shippingDate"
                  type="datetime-local"
                  value={shippingDate}
                  onChange={(e) => setShippingDate(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">When will you ship this order?</p>
              </div>

              <div>
                <Label htmlFor="estimatedDelivery">Estimated Delivery Date *</Label>
                <Input
                  id="estimatedDelivery"
                  type="datetime-local"
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">When is the expected delivery date?</p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAcceptOrderModal(null);
                  setShippingDate('');
                  setEstimatedDelivery('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => acceptOrderModal && handleAcceptOrder(acceptOrderModal)}
                disabled={!shippingDate || !estimatedDelivery}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </Layout>
  );
};

export default SellerDashboard;
