import Layout from '@/components/layout/Layout';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and digital payment methods. All transactions are secure and encrypted.',
  },
  {
    question: 'Do you offer international shipping?',
    answer: 'Currently, we ship within India. International shipping options may be available based on your location. Please contact our support team for more information.',
  },
  {
    question: 'What is your return policy?',
    answer: 'We offer a 30-day return policy on all unused products in original packaging. Please refer to our Returns Policy page for detailed information.',
  },
  {
    question: 'How can I track my order?',
    answer: 'Once your order is shipped, you will receive a tracking number via email. You can use this to track your package in real-time on our platform.',
  },
  {
    question: 'Do you offer bulk orders or wholesale?',
    answer: 'Yes! We offer special pricing for bulk orders and wholesale customers. Please contact our sales team at support@notebookhub.com for a quote.',
  },
  {
    question: 'How long does shipping usually take?',
    answer: 'Standard shipping typically takes 3-5 business days. During peak seasons, delivery may take up to 7-10 business days.',
  },
  {
    question: 'Are your notebooks eco-friendly?',
    answer: 'Many of our products are made from sustainable and recycled materials. Look for the eco-friendly badge on product pages for details.',
  },
  {
    question: 'Can I cancel or modify my order?',
    answer: 'Orders can be cancelled or modified up to 24 hours after purchase. Please contact our support team immediately if you need to make changes.',
  },
  {
    question: 'Do you offer gift wrapping?',
    answer: 'Yes, we offer premium gift wrapping for an additional charge. You can select this option during checkout.',
  },
  {
    question: 'How do I contact customer support?',
    answer: 'You can reach us via email at support@notebookhub.com, phone at +19 22222222, or through our contact form. We typically respond within 24 hours.',
  },
];

const FAQAccordionItem = ({ item, index }: { item: FAQItem; index: number }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-colors">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between bg-card hover:bg-card/80 transition-colors text-left"
      >
        <h3 className="font-serif font-semibold text-foreground pr-4">{item.question}</h3>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-primary flex-shrink-0 transition-transform duration-300',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <div className="px-6 py-4 bg-background text-muted-foreground leading-relaxed border-t border-border">
          {item.answer}
        </div>
      )}
    </div>
  );
};

const FAQ = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 md:py-20 bg-[linear-gradient(135deg,hsl(var(--background))_0%,hsl(var(--accent))_100%)]">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4 animate-fade-up">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Find answers to common questions about our products, shipping, returns, and more.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <FAQAccordionItem key={index} item={item} index={index} />
              ))}
            </div>

            {/* Still have questions */}
            <div className="mt-12 p-8 bg-card rounded-lg text-center border border-border">
              <h3 className="text-xl md:text-2xl font-serif font-bold text-foreground mb-3">
                Still have questions?
              </h3>
              <p className="text-muted-foreground mb-6">
                Our customer support team is here to help. Get in touch with us anytime.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="mailto:support@notebookhub.com" className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium">
                  Email Us
                </a>
                <a href="tel:+19 22222222" className="inline-block px-6 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors font-medium">
                  Call Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default FAQ;
