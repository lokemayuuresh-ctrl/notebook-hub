import { Link } from 'react-router-dom';
import { BookOpen, Pencil, Grid3X3, Star } from 'lucide-react';

const categories = [
  {
    name: 'Ruled Notebooks',
    description: 'Classic lined pages for everyday writing',
    icon: BookOpen,
    href: '/products?category=Ruled',
    color: 'bg-primary/10 text-primary',
  },
  {
    name: 'Sketchbooks',
    description: 'Blank pages for artists and creators',
    icon: Pencil,
    href: '/products?category=Blank',
    color: 'bg-secondary/10 text-secondary',
  },
  {
    name: 'Dot Grid',
    description: 'Perfect for bullet journaling',
    icon: Grid3X3,
    href: '/products?category=Dot Grid',
    color: 'bg-primary/10 text-primary',
  },
  {
    name: 'Premium',
    description: 'Luxury notebooks for professionals',
    icon: Star,
    href: '/products?category=Premium',
    color: 'bg-secondary/10 text-secondary',
  },
];

const CategorySection = () => {
  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
            Shop by Category
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find the perfect notebook for every purpose, from everyday writing to artistic expression
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <Link
              key={category.name}
              to={category.href}
              className="group p-6 bg-background rounded-xl border border-border hover:border-primary/30 hover:shadow-card transition-all duration-300 animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-14 h-14 rounded-lg ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <category.icon className="h-7 w-7" />
              </div>
              <h3 className="font-serif font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
                {category.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {category.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
