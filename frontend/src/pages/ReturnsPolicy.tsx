import Layout from '@/components/layout/Layout';
import { CheckCircle, AlertCircle, Clock, MapPin, DollarSign, RefreshCw } from 'lucide-react';

const returnsSteps = [
  {
    step: 1,
    title: 'Check Eligibility',
    description: 'Ensure your product meets our return requirements (30 days, original condition, original packaging).',
  },
  {
    step: 2,
    title: 'Contact Support',
    description: 'Email our support team with your order number and reason for return.',
  },
  {
    step: 3,
    title: 'Receive Return Label',
    description: 'We\'ll provide you with a prepaid shipping label for easy return.',
  },
  {
    step: 4,
    title: 'Ship Back',
    description: 'Pack the item securely and ship it back using the provided label.',
  },
  {
    step: 5,
    title: 'Inspection',
    description: 'We\'ll inspect the returned item upon receipt.',
  },
  {
    step: 6,
    title: 'Refund Processed',
    description: 'Upon approval, your refund will be processed within 5-7 business days.',
  },
];

const ReturnsPolicy = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 md:py-20 bg-[linear-gradient(135deg,hsl(var(--background))_0%,hsl(var(--accent))_100%)]">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4 animate-fade-up">
            Returns Policy
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-up" style={{ animationDelay: '0.1s' }}>
            We want you to be completely satisfied with your purchase. View our hassle-free returns policy.
          </p>
        </div>
      </section>

      {/* Policy Overview */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="p-6 bg-card rounded-lg border border-border">
              <Clock className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-serif font-bold text-lg text-foreground mb-2">30-Day Return Window</h3>
              <p className="text-muted-foreground text-sm">
                Returns are accepted within 30 days of purchase date.
              </p>
            </div>
            <div className="p-6 bg-card rounded-lg border border-border">
              <RefreshCw className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-serif font-bold text-lg text-foreground mb-2">Full Refund</h3>
              <p className="text-muted-foreground text-sm">
                Get a full refund to your original payment method.
              </p>
            </div>
            <div className="p-6 bg-card rounded-lg border border-border">
              <MapPin className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-serif font-bold text-lg text-foreground mb-2">Free Shipping Label</h3>
              <p className="text-muted-foreground text-sm">
                We provide a prepaid return shipping label.
              </p>
            </div>
          </div>

          {/* Eligibility Requirements */}
          <div className="mb-12">
            <h2 className="text-3xl font-serif font-bold text-foreground mb-6">
              Eligibility Requirements
            </h2>
            <div className="bg-card rounded-lg border border-border p-8">
              <h3 className="font-serif font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Your product is eligible for return if:
              </h3>
              <ul className="space-y-2 text-muted-foreground ml-4">
                <li>✓ Returned within 30 days of purchase</li>
                <li>✓ Product is in original, unused condition</li>
                <li>✓ Item is in original packaging</li>
                <li>✓ All original accessories and documentation are included</li>
                <li>✓ No visible signs of wear or use</li>
              </ul>

              <h3 className="font-serif font-bold text-lg text-foreground mt-8 mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Non-returnable items:
              </h3>
              <ul className="space-y-2 text-muted-foreground ml-4">
                <li>✗ Custom or personalized notebooks</li>
                <li>✗ Items returned after 30 days</li>
                <li>✗ Products used or showing signs of wear</li>
                <li>✗ Items returned without original packaging</li>
                <li>✗ Clearance or sale items marked as final sale</li>
                <li>✗ Digital products or e-gifts</li>
              </ul>
            </div>
          </div>

          {/* Return Process */}
          <div className="mb-12">
            <h2 className="text-3xl font-serif font-bold text-foreground mb-8">
              How to Return an Item
            </h2>
            <div className="grid gap-6">
              {returnsSteps.map((item) => (
                <div key={item.step} className="flex gap-6 pb-6 border-b border-border last:border-0">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground font-bold ">
                      {item.step}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif font-bold text-lg text-foreground mb-2">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Return Shipping & Refunds */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-card rounded-lg border border-border p-8">
              <h3 className="font-serif font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Return Address
              </h3>
              <p className="text-muted-foreground mb-4">
                Ship your return to:
              </p>
              <address className="text-foreground not-italic">
                NotebookHub Returns<br />
                123 Paper Street<br />
                Stationery District<br />
                Mumbai, Maharashtra 400012<br />
                India
              </address>
            </div>

            <div className="bg-card rounded-lg border border-border p-8">
              <h3 className="font-serif font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Refund Timeline
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li><span className="font-semibold text-foreground">1-3 days:</span> Processing return request</li>
                <li><span className="font-semibold text-foreground">3-7 days:</span> In transit to warehouse</li>
                <li><span className="font-semibold text-foreground">1-2 days:</span> Item inspection</li>
                <li><span className="font-semibold text-foreground">5-7 days:</span> Refund processed</li>
              </ul>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-lg border border-blue-200 dark:border-blue-800 mb-8">
            <h3 className="font-serif font-bold text-foreground mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Important Information
            </h3>
            <ul className="space-y-2 text-sm text-blue-900 dark:text-blue-100">
              <li>• Keep your return shipping label - you'll need it to ship the package</li>
              <li>• Use a trackable shipping method for your return</li>
              <li>• Items must be received within 15 days of return approval</li>
              <li>• Original shipping costs are non-refundable unless item is defective</li>
              <li>• Refunds are credited to original payment method only</li>
            </ul>
          </div>

          {/* Exceptions */}
          <div className="bg-card rounded-lg border border-border p-8 mb-12">
            <h3 className="font-serif font-bold text-lg text-foreground mb-4">
              Special Cases
            </h3>
            <div className="space-y-4 text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">Defective Products:</span><br />
                If your item is defective or damaged, we'll replace it free of charge or process a full refund, even outside the 30-day window. Contact us immediately with photos.
              </p>
              <p>
                <span className="font-semibold text-foreground">Wrong Item Received:</span><br />
                If you received the wrong product, we'll send a replacement immediately at no cost and provide a return label for the incorrect item.
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="text-center p-8 bg-card rounded-lg border border-border">
            <h3 className="text-xl font-serif font-bold text-foreground mb-3">
              Need Help with a Return?
            </h3>
            <p className="text-muted-foreground mb-6">
              Our support team is ready to assist you with any questions about our returns policy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:support@notebookhub.com" className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium">
                Email Returns Support
              </a>
              <a href="tel:+19 22222222" className="inline-block px-6 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors font-medium">
                Call Support
              </a>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ReturnsPolicy;
