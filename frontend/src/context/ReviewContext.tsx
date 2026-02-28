import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ReviewContextType {
  reviews: Review[];
  addReview: (productId: string, rating: number, comment: string) => void;
  getProductReviews: (productId: string) => Review[];
  getAverageRating: (productId: string) => number;
  hasUserReviewed: (productId: string, userId: string) => boolean;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export const ReviewProvider = ({ children }: { children: ReactNode }) => {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('productReviews');
    if (stored) {
      setReviews(JSON.parse(stored));
    }
  }, []);

  const saveReviews = (items: Review[]) => {
    setReviews(items);
    localStorage.setItem('productReviews', JSON.stringify(items));
  };

  const addReview = (productId: string, rating: number, comment: string) => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.id) {
      toast.error('Please login to leave a review');
      return;
    }

    const review: Review = {
      id: Date.now().toString(),
      productId,
      userId: currentUser.id,
      userName: currentUser.name,
      rating,
      comment,
      createdAt: new Date().toISOString()
    };

    saveReviews([...reviews, review]);
    toast.success('Review submitted');
  };

  const getProductReviews = (productId: string) => {
    return reviews.filter(r => r.productId === productId);
  };

  const getAverageRating = (productId: string) => {
    const productReviews = getProductReviews(productId);
    if (productReviews.length === 0) return 0;
    return productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
  };

  const hasUserReviewed = (productId: string, userId: string) => {
    return reviews.some(r => r.productId === productId && r.userId === userId);
  };

  return (
    <ReviewContext.Provider value={{ reviews, addReview, getProductReviews, getAverageRating, hasUserReviewed }}>
      {children}
    </ReviewContext.Provider>
  );
};

export const useReviews = () => {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error('useReviews must be used within a ReviewProvider');
  }
  return context;
};
