import Layout from '@/components/layout/Layout';
import HeroSection from '@/components/home/HeroSection';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import CategorySection from '@/components/home/CategorySection';
import TestimonialSection from '@/components/home/TestimonialSection';
import NewsletterSection from '@/components/home/NewsletterSection';

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <FeaturedProducts />
      <CategorySection />
      <TestimonialSection />
      <NewsletterSection />
    </Layout>
  );
};

export default Index;
