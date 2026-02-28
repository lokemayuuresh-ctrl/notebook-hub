import Layout from '@/components/layout/Layout';
import { Truck, MapPin, Clock, DollarSign, Package, AlertCircle } from 'lucide-react';

const shippingOptions = [
  {
    name: 'Standard Shipping',
    time: '3-5 Business Days',
    price: 'Free on orders over $50',
    icon: Truck,
  },
  {
    name: 'Express Shipping',
    time: '1-2 Business Days',
    price: '$10 - $20',
    icon: Clock,
  },
  {
    name: 'Overnight Shipping',
    time: 'Next Business Day',
    price: '$25 - $35',
    icon: Package,
  },
];

const ShippingInfo = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 md:py-20 bg-[linear-gradient(135deg,hsl(var(--background))_0%,hsl(var(--accent))_100%)]">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4 animate-fade-up">
            Shipping Information
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Fast, reliable, and affordable shipping options for your orders
          </p>
        </div>
      </section>

      {/* Shipping Options */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-serif font-bold text-foreground mb-12 text-center">
            Our Shipping Options
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {shippingOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <div key={index} className="p-6 bg-card rounded-lg border border-border hover:border-primary/30 hover:shadow-card transition-all">
                  <Icon className="h-8 w-8 text-primary mb-4" />
                  <h3 className="font-serif font-bold text-lg text-foreground mb-2">
                    {option.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    <span className="font-semibold text-foreground">{option.time}</span>
                  </p>
                  <p className="text-primary font-medium">{option.price}</p>
                </div>
              );
            })}
          </div>

          {/* Shipping Details */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-2">
                <MapPin className="h-6 w-6 text-primary" />
                Service Areas
              </h3>
              <div className="space-y-3 text-muted-foreground">
                <p>✓ All major cities in India</p>
                <p>✓ Pin codes across 28 states</p>
                <p>✓ Remote areas may take additional 2-3 days</p>
                <p>✓ Restricted areas require special approval</p>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-primary" />
                Shipping Costs
              </h3>
              <div className="space-y-3 text-muted-foreground">
                <p>• Orders under $50: $5 standard shipping</p>
                <p>• Orders $50 - $150: Free standard shipping</p>
                <p>• Orders over $150: Free shipping (all methods)</p>
                <p>• Remote areas may have additional charges</p>
              </div>
            </div>
          </div>

          {/* How to Track */}
          <div className="bg-card p-8 rounded-lg border border-border mb-8">
            <h3 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-2">
              <Truck className="h-6 w-6 text-primary" />
              How to Track Your Order
            </h3>
            <div className="space-y-4 text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground block mb-2">1. Receive Tracking Number</span>
                You'll receive a tracking number via email as soon as your order ships.
              </p>
              <p>
                <span className="font-semibold text-foreground block mb-2">2. Use Tracking ID</span>
                Log into your account and visit "My Orders" to view real-time tracking details.
              </p>
              <p>
                <span className="font-semibold text-foreground block mb-2">3. Monitor Status</span>
                Get real-time updates including dispatch, in-transit, and out-for-delivery status.
              </p>
              <p>
                <span className="font-semibold text-foreground block mb-2">4. Delivery Updates</span>
                SMS and email notifications will be sent at each stage of delivery.
              </p>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-amber-50 dark:bg-amber-950 p-6 rounded-lg border border-amber-200 dark:border-amber-800 flex gap-4">
            <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">Important Notes</h4>
              <ul className="text-sm text-amber-800 dark:text-amber-100 space-y-1">
                <li>• Delivery times may vary during holidays and peak seasons</li>
                <li>• Orders are processed within 24 hours before shipment</li>
                <li>• Please ensure someone is available to receive the package</li>
                <li>• For damaged or lost packages, contact support within 48 hours</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 md:py-20 bg-card border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-serif font-bold text-foreground mb-4">
            Need Help with Your Shipment?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Our customer support team is available to help with any shipping inquiries or concerns.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:support@notebookhub.com" className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium">
              Contact Support
            </a>
            <a href="tel:+19 22222222" className="inline-block px-6 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors font-medium">
              Call Us
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ShippingInfo;
