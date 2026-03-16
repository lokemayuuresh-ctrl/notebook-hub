import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useProducts } from '@/context/ProductContext';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useReviews } from '@/context/ReviewContext';
import { useAuth } from '@/context/AuthContext';
import { ShoppingCart, Star, ArrowLeft, Package, Truck, Shield, Store, Heart, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { getImageUrl } from '@/lib/image';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { getProductById } = useProducts();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { getProductReviews, addReview, hasUserReviewed, getAverageRating } = useReviews();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  const product = getProductById(id || '');
  const reviews = getProductReviews(id || '');
  const avgRating = getAverageRating(id || '');
  const userHasReviewed = user ? hasUserReviewed(id || '', user.id) : false;
  const inWishlist = product ? isInWishlist(product.id) : false;

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-serif font-bold text-foreground mb-4">
            Product Not Found
          </h1>
          <Link to="/products">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const handleSubmitReview = () => {
    if (reviewComment.trim()) {
      addReview(product.id, reviewRating, reviewComment);
      setReviewComment('');
      setReviewRating(5);
    }
  };

  const displayRating = reviews.length > 0 ? avgRating : product.rating;
  const displayReviewCount = reviews.length > 0 ? reviews.length : product.reviews;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image */}
          <div className="aspect-square rounded-2xl overflow-hidden bg-muted shadow-card relative">
            <img
              src={getImageUrl(product.image)}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => inWishlist ? removeFromWishlist(product.id) : addToWishlist(product)}
              className="absolute top-4 right-4 p-3 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
            >
              <Heart className={`h-5 w-5 ${inWishlist ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
            </button>
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                {product.category}
              </span>
              {product.sellerName && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Store className="h-4 w-4" />
                  by {product.sellerName}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
              {product.name}
            </h1>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${i < Math.floor(displayRating)
                      ? 'fill-primary text-primary'
                      : 'text-muted'
                      }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {displayRating.toFixed(1)} ({displayReviewCount} reviews)
              </span>
            </div>

            <p className="text-2xl font-bold text-foreground">
              ₹{product.price.toLocaleString()}
            </p>

            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>

            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-secondary" />
              <span className={product.stock > 0 ? 'text-secondary' : 'text-destructive'}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </span>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Quantity:</span>
              <div className="flex items-center border border-input rounded-md">
                <button
                  className="px-3 py-2 hover:bg-muted transition-colors"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </button>
                <span className="px-4 py-2 border-x border-input">{quantity}</span>
                <button
                  className="px-3 py-2 hover:bg-muted transition-colors"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1 gap-2"
                onClick={() => addToCart(product, quantity)}
                disabled={product.stock === 0}
              >
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => inWishlist ? removeFromWishlist(product.id) : addToWishlist(product)}
              >
                <Heart className={`h-5 w-5 ${inWishlist ? 'fill-destructive text-destructive' : ''}`} />
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Free Shipping</p>
                  <p className="text-xs text-muted-foreground">On all orders</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Quality Guarantee</p>
                  <p className="text-xs text-muted-foreground">30-day returns</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Customer Reviews
          </h2>

          {/* Write Review */}
          {user && user.role !== 'seller' && !userHasReviewed && (
            <div className="bg-card border border-border rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-foreground mb-4">Write a Review</h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-muted-foreground">Rating:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setReviewRating(star)}>
                    <Star className={`h-5 w-5 ${star <= reviewRating ? 'fill-primary text-primary' : 'text-muted'}`} />
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Share your experience with this product..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="mb-4"
              />
              <Button onClick={handleSubmitReview} disabled={!reviewComment.trim()}>
                Submit Review
              </Button>
            </div>
          )}

          {/* Reviews List */}
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {review.userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{review.userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < review.rating ? 'fill-primary text-primary' : 'text-muted'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
