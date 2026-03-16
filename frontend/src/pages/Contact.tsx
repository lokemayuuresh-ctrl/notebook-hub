import Layout from '@/components/layout/Layout';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const Contact = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      try {
        // In a real app, you would send this to a backend API
        console.log('Form submitted:', formData);
        
        toast({
          title: 'Success!',
          description: 'Your message has been sent. We\'ll get back to you soon!',
        });

        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to send message. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsSubmitting(false);
      }
    }, 1000);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      details: 'support@notebookhub.com',
      link: 'mailto:support@notebookhub.com',
    },
    {
      icon: Phone,
      title: 'Phone',
      details: '+19 22222222',
      link: 'tel:+19 22222222',
    },
    {
      icon: MapPin,
      title: 'Address',
      details: '123 Paper Street, Stationery District, Bhoiwada near Tata Hospital, Parel, Mumbai, Maharashtra 400012',
      link: '#',
    },
    {
      icon: Clock,
      title: 'Business Hours',
      details: 'Mon - Fri: 9:00 AM - 6:00 PM IST\nSat - Sun: 10:00 AM - 4:00 PM IST',
      link: '#',
    },
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="py-16 md:py-20 bg-[linear-gradient(135deg,hsl(var(--background))_0%,hsl(var(--accent))_100%)]">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4 animate-fade-up">
            Get In Touch
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Have a question or feedback? We'd love to hear from you. Reach out to our team anytime.
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {/* Contact Info Cards */}
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <a
                  key={index}
                  href={info.link}
                  className="p-6 bg-card rounded-lg border border-border hover:border-primary/30 hover:shadow-card transition-all group"
                >
                  <Icon className="h-8 w-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-serif font-bold text-lg text-foreground mb-2">
                    {info.title}
                  </h3>
                  <p className="text-muted-foreground whitespace-pre-line text-sm leading-relaxed hover:text-primary transition-colors">
                    {info.details}
                  </p>
                </a>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-serif font-bold text-foreground mb-8">
                Send us a Message
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Full Name *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email Address *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 9876543210"
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select a subject...</option>
                    <option value="product-inquiry">Product Inquiry</option>
                    <option value="order-issue">Order Issue</option>
                    <option value="shipping">Shipping Question</option>
                    <option value="returns">Returns & Refunds</option>
                    <option value="partnership">Partnership Opportunity</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help..."
                    required
                    rows={5}
                    className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-vertical"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full gap-2 py-2"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </div>

            {/* FAQ Quick Links */}
            <div className="space-y-8">
              <div className="bg-card rounded-lg border border-border p-8">
                <h3 className="text-2xl font-serif font-bold text-foreground mb-6">
                  Quick Help
                </h3>
                <div className="space-y-4">
                  <a href="/faq" className="block p-3 rounded-lg bg-background hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/30">
                    <p className="font-semibold text-foreground">FAQ</p>
                    <p className="text-sm text-muted-foreground">Find answers to common questions</p>
                  </a>
                  <a href="/shipping" className="block p-3 rounded-lg bg-background hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/30">
                    <p className="font-semibold text-foreground">Shipping Info</p>
                    <p className="text-sm text-muted-foreground">Learn about delivery and tracking</p>
                  </a>
                  <a href="/returns" className="block p-3 rounded-lg bg-background hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/30">
                    <p className="font-semibold text-foreground">Returns Policy</p>
                    <p className="text-sm text-muted-foreground">Understand our return procedures</p>
                  </a>
                </div>
              </div>

              <div className="bg-primary/10 border border-primary/30 rounded-lg p-8">
                <h3 className="text-xl font-serif font-bold text-foreground mb-4">
                  Response Time
                </h3>
                <p className="text-muted-foreground mb-4">
                  We typically respond to all inquiries within 24 hours during business days.
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Email: Usually within 2-4 hours</li>
                  <li>✓ Phone: Monday to Friday, 9 AM - 6 PM IST</li>
                  <li>✓ Chat: Real-time support during business hours</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map-like Section */}
      <section className="py-16 bg-card border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-serif font-bold text-foreground mb-6">
            Visit Us
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Located in Parel, Mumbai. You can visit our showroom to see our products in person or meet with our team for order discussions.
          </p>
          <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-lg h-64 flex items-center justify-center border border-border">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-primary mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">
                123 Paper Street, Parel, Mumbai 400012
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
