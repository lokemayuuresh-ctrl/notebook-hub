import Layout from '@/components/layout/Layout';
import { BookOpen, Users, Award, Leaf } from 'lucide-react';

const values = [
  {
    icon: BookOpen,
    title: 'Quality First',
    description: 'We source only the finest materials to create notebooks that inspire and endure.',
  },
  {
    icon: Users,
    title: 'Customer Focus',
    description: 'Your satisfaction drives everything we do, from product selection to delivery.',
  },
  {
    icon: Award,
    title: 'Craftsmanship',
    description: 'Each notebook is crafted with attention to detail and a passion for excellence.',
  },
  {
    icon: Leaf,
    title: 'Sustainability',
    description: 'We are committed to eco-friendly practices and responsibly sourced materials.',
  },
];

const About = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 bg-[linear-gradient(135deg,hsl(var(--background))_0%,hsl(var(--accent))_100%)]">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6 animate-fade-up">
            About NotebookHub
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-up" style={{ animationDelay: '0.1s' }}>
            We believe that the right notebook can transform the way you think, create, and organize.
            Our mission is to provide premium stationery that inspires creativity and productivity.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-serif font-bold text-foreground">
                Our Story
              </h2>
              <p className="text-muted-foreground leading-relaxed">

                Founded in 2026, NotebookHub started with a simple idea: everyone deserves access to
                high-quality notebooks that make writing a joy. What began as a small online shop has
                grown into a trusted destination for stationery enthusiasts worldwide.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We work closely with makers and small producers who care about quality and the environment.
                Each notebook is carefully chosen to make sure it has good paper, strong binding, and a nice design.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Today, we serve thousands of customers, including students, professionals, artists, and writers.
                We help them write down their ideas in beautiful notebooks they can enjoy and keep for many years.
              </p>
            </div>
            <div className="relative">
              <img
                src="/img/premium_photo-.jpg"
                alt="Notebooks collection"
                className="rounded-2xl shadow-elevated"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-foreground mb-4">
              Our Values
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              These core principles guide everything we do at NotebookHub
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div
                key={value.title}
                className="bg-background p-6 rounded-xl border border-border text-center animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-serif font-semibold text-lg text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold mb-2">500+</p>
              <p className="text-primary-foreground/80">Products</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">10K+</p>
              <p className="text-primary-foreground/80">Happy Customers</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">50+</p>
              <p className="text-primary-foreground/80">Countries Shipped</p>
            </div>
            <div>
              <p className="text-4xl font-bold mb-2">4.9</p>
              <p className="text-primary-foreground/80">Average Rating</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
