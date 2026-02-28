import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { useOrders, PaymentMethod } from '@/context/OrderContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/layout/Layout';
import { ArrowLeft, CreditCard, Banknote, Package, CheckCircle } from 'lucide-react';
import { getImageUrl } from '@/lib/image';

const Checkout = () => {
  const { items, total, clearCart } = useCart();
  const { createOrder } = useOrders();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');

  // Calculate charges
  const subtotal = total; // Current total is actually subtotal (product prices)
  const gst = Math.round((subtotal * 0.18) * 100) / 100; // 18% GST - rounded to 2 decimal places
  // Delivery charge will be calculated by backend (20rs within city, 40rs out of city, free for first order)
  // For display, we'll show an estimate message

  if (items.length === 0 && !orderPlaced) {
    navigate('/cart');
    return null;
  }

  const handlePayment = async () => {
    if (!address.trim()) {
      toast({
        title: "Address Required",
        description: "Please enter your shipping address",
        variant: "destructive"
      });
      return;
    }
    if (!city.trim()) {
      toast({
        title: "City Required",
        description: "Please enter your city for delivery charge calculation",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    // Simulate Razorpay payment if selected
    if (paymentMethod === 'razorpay') {
      // Mock Razorpay payment flow
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed via Razorpay",
      });
    }

    const order = await createOrder(items, subtotal, paymentMethod, address, city, phone);
    if (order) {
      setPlacedOrderId(order.id);
      clearCart();
      setOrderPlaced(true);
      toast({
        title: "Order Placed!",
        description: `Your order ${order.id} has been placed successfully`,
      });
    } else {
      toast.error('Failed to place order. It was saved locally.');
    }

    setIsProcessing(false);
  };

  if (orderPlaced) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-foreground mb-4">Order Placed!</h1>
            <p className="text-muted-foreground mb-2">
              Your order <span className="font-semibold text-foreground">{placedOrderId}</span> has been placed successfully.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              {paymentMethod === 'cod'
                ? 'You will pay when the order is delivered.'
                : 'Payment completed via Razorpay.'}
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/my-orders')}>
                <Package className="h-4 w-4 mr-2" />
                View My Orders
              </Button>
              <Button variant="outline" onClick={() => navigate('/products')}>
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/cart')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cart
        </Button>

        <h1 className="text-3xl font-serif font-bold text-foreground mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div className="space-y-6">
            {/* Shipping Details */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Shipping Details</h2>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Shipping Address *</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter your full address including state, and PIN code"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="Enter your city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Delivery: ₹20 within city, ₹40 out of city. First order is free!</p>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Payment Method</h2>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${paymentMethod === 'cod'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground'
                    }`}
                >
                  <div className={`p-2 rounded-lg ${paymentMethod === 'cod' ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Banknote className={`h-5 w-5 ${paymentMethod === 'cod' ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="text-left">
                    <p className={`font-medium ${paymentMethod === 'cod' ? 'text-primary' : 'text-foreground'}`}>
                      Cash on Delivery
                    </p>
                    <p className="text-sm text-muted-foreground">Pay when you receive the order</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${paymentMethod === 'razorpay'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground'
                    }`}
                >
                  <div className={`p-2 rounded-lg ${paymentMethod === 'razorpay' ? 'bg-primary/10' : 'bg-muted'}`}>
                    <CreditCard className={`h-5 w-5 ${paymentMethod === 'razorpay' ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="text-left">
                    <p className={`font-medium ${paymentMethod === 'razorpay' ? 'text-primary' : 'text-foreground'}`}>
                      Razorpay
                    </p>
                    <p className="text-sm text-muted-foreground">Pay securely with UPI, Cards, or Net Banking</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div>
            <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-foreground mb-4">Order Summary</h2>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-4">
                    <img
                      src={getImageUrl(item.product.image)}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-foreground">
                      ₹{(item.product.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST (18%)</span>
                  <span className="text-foreground">₹{gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Charge</span>
                  <span className="text-muted-foreground text-xs">Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                  <span className="text-foreground">Total (approx.)</span>
                  <span className="text-foreground">₹{(subtotal + gst).toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground text-center pt-1">
                  Final total includes delivery charge
                </p>
              </div>

              <Button
                className="w-full mt-6"
                size="lg"
                onClick={handlePayment}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  'Processing...'
                ) : paymentMethod === 'cod' ? (
                  'Place Order'
                ) : (
                  'Pay Now'
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                By placing this order, you agree to our terms and conditions
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
