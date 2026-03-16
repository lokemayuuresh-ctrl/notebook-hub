import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/products/ProductCard';
import { useWishlist } from '@/context/WishlistContext';
import { Button } from '@/components/ui/button';
import { Heart, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Wishlist = () => {
  const { wishlist, clearWishlist } = useWishlist();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/products" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="h-4 w-4" />
              Continue Shopping
            </Link>
            <h1 className="text-3xl font-serif font-bold text-foreground flex items-center gap-3">
              <Heart className="h-8 w-8 text-primary" />
              My Wishlist
            </h1>
            <p className="text-muted-foreground mt-1">{wishlist.length} items saved</p>
          </div>
          {wishlist.length > 0 && (
            <Button variant="outline" onClick={clearWishlist}>
              Clear All
            </Button>
          )}
        </div>

        {wishlist.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((product, index) => (
              <div
                key={product.id}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-lg text-muted-foreground mb-4">Your wishlist is empty</p>
            <Link to="/products">
              <Button>Browse Products</Button>
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Wishlist;
