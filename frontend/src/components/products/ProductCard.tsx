import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { getImageUrl, FALLBACK_IMAGE } from '@/lib/image';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);

  const [imageSrc, setImageSrc] = useState(getImageUrl(product.image));

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleImageError = () => {
    setImageSrc(FALLBACK_IMAGE);
  };

  return (
    <div className="group bg-card rounded-lg border border-border overflow-hidden shadow-soft hover:shadow-card transition-all duration-300 relative">
      <button
        onClick={handleWishlistClick}
        className="absolute top-3 right-3 z-10 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
      >
        <Heart className={`h-4 w-4 ${inWishlist ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
      </button>

      <Link to={`/products/${product.id}`} className="block overflow-hidden">
        <div className="aspect-[16/9] overflow-hidden bg-muted">
          <img
            src={imageSrc}
            alt={product.name}
            onError={handleImageError}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      </Link>

      <div className="p-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-medium text-primary bg-primary/10 px-1 py-0 rounded leading-none">
            {product.category}
          </span>
          <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Star className="h-2.5 w-2.5 fill-primary text-primary" />
            <span>{product.rating}</span>
          </div>
        </div>

        <Link to={`/products/${product.id}`}>
          <h3 className="text-xs font-serif font-semibold text-foreground hover:text-primary transition-colors line-clamp-1 leading-tight">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center justify-between pt-0.5">
          <span className="text-sm font-bold text-foreground">
            ₹{product.price.toLocaleString()}
          </span>
          <Button
            size="sm"
            onClick={() => addToCart(product)}
            className="h-7 px-2 text-[10px] gap-1"
          >
            <ShoppingCart className="h-3 w-3" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
