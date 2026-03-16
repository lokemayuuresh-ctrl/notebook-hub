import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { getImageUrl } from '@/lib/image';

const Cart = () => {
  const { items, removeFromCart, updateQuantity, total, clearCart } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
            Your Cart is Empty
          </h1>
          <p className="text-muted-foreground mb-8">
            Looks like you haven't added any items yet.
          </p>
          <Link to="/products">
            <Button className="gap-2">
              Browse Products
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-8">
          Shopping Cart
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="flex gap-4 bg-card p-4 rounded-lg border border-border shadow-soft"
              >
                <img
                  src={getImageUrl(item.product.image)}
                  alt={item.product.name}
                  className="w-24 h-24 object-cover rounded-md"
                />
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/products/${item.product.id}`}
                    className="font-serif font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                  >
                    {item.product.name}
                  </Link>
                  <p className="text-sm text-muted-foreground mb-2">
                    {item.product.category}
                  </p>
                  <p className="font-bold text-foreground">
                    ₹{item.product.price.toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="flex items-center border border-input rounded-md">
                    <button
                      className="p-1.5 hover:bg-muted transition-colors"
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity - 1)
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-3 text-sm">{item.quantity}</span>
                    <button
                      className="p-1.5 hover:bg-muted transition-colors"
                      onClick={() =>
                        updateQuantity(item.product.id, item.quantity + 1)
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <Button variant="ghost" onClick={clearCart} className="text-destructive hover:text-destructive">
              Clear Cart
            </Button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card p-6 rounded-lg border border-border shadow-soft sticky top-24">
              <h2 className="font-serif font-semibold text-lg text-foreground mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">₹{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST (18%)</span>
                  <span className="text-muted-foreground">+₹{(Math.round((total * 0.18) * 100) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="text-muted-foreground text-xs">Calculated at checkout</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between font-semibold">
                    <span className="text-foreground">Est. Total</span>
                    <span className="text-foreground">₹{(Math.round((total * 1.18) * 100) / 100).toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    + delivery charges (first order free!)
                  </p>
                </div>
              </div>

              <Button className="w-full gap-2" onClick={() => navigate('/checkout')}>
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;
