import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/products/ProductCard';
import { useProducts } from '@/context/ProductContext';
import { ArrowRight } from 'lucide-react';
import { useEffect } from 'react';

const FeaturedProducts = () => {
  const { products } = useProducts();

  // Wipe out any old corrupted products forcefully so they don't show up here
  useEffect(() => {
    localStorage.removeItem('sellerProducts');
  }, []);

  const featuredProducts = products.slice(0, 4);

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2">
              Featured Products
            </h2>
            <p className="text-muted-foreground">
              Handpicked favorites from our collection
            </p>
          </div>
          <Link to="/products" className="mt-4 md:mt-0">
            <Button variant="ghost" className="gap-2">
              View All Products
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product, index) => (
            <div
              key={product.id}
              className="animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
