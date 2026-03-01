import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { OrderProvider } from "@/context/OrderContext";
import { ProductProvider } from "@/context/ProductContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { ReviewProvider } from "@/context/ReviewContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import Wishlist from "./pages/Wishlist";
import Login from "./pages/Login";
import About from "./pages/About";
import Account from "./pages/Account";
import Help from "./pages/Help";
import Profile from "./pages/Profile";
import SellerDashboard from "./pages/SellerDashboard";
import BuyerDashboard from "./pages/BuyerDashboard";
import Notifications from "./pages/Notifications";
import FAQ from "./pages/FAQ";
import ShippingInfo from "./pages/ShippingInfo";
import ReturnsPolicy from "./pages/ReturnsPolicy";
import Contact from "./pages/Contact";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

// Protected route for sellers only
const SellerRoute = ({ children }: { children: React.ReactNode }) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  if (!currentUser.id) {
    return <Navigate to="/login" replace />;
  }
  if (currentUser.role !== 'seller') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

// Protected route for buyers only (requires login)
const BuyerRoute = ({ children }: { children: React.ReactNode }) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  if (!currentUser.id) {
    return <Navigate to="/login" replace />;
  }
  if (currentUser.role === 'seller') {
    return <Navigate to="/seller/dashboard" replace />;
  }
  return <>{children}</>;
};

// Guest route - allows guests, buyers, and sellers
const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  // Allow all users including sellers
  return <>{children}</>;
};

// Protected route for admins only
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  if (!currentUser.id) {
    return <Navigate to="/login" replace />;
  }
  if (currentUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "PLACEHOLDER"}>
        <AuthProvider>
          <ProductProvider>
            <WishlistProvider>
              <ReviewProvider>
                <CartProvider>
                  <OrderProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                      <ScrollToTop />
                      <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
                        <Route path="/seller/dashboard" element={<SellerRoute><SellerDashboard /></SellerRoute>} />
                        <Route path="/buyer/dashboard" element={<BuyerRoute><BuyerDashboard /></BuyerRoute>} />

                        {/* Public routes - accessible to guests, buyers, but not sellers */}
                        <Route path="/" element={<GuestRoute><Index /></GuestRoute>} />
                        <Route path="/products" element={<GuestRoute><Products /></GuestRoute>} />
                        <Route path="/products/:id" element={<GuestRoute><ProductDetail /></GuestRoute>} />
                        <Route path="/about" element={<GuestRoute><About /></GuestRoute>} />
                        <Route path="/contact" element={<GuestRoute><Contact /></GuestRoute>} />
                        <Route path="/faq" element={<GuestRoute><FAQ /></GuestRoute>} />
                        <Route path="/shipping" element={<GuestRoute><ShippingInfo /></GuestRoute>} />
                        <Route path="/returns" element={<GuestRoute><ReturnsPolicy /></GuestRoute>} />

                        {/* Buyer-only routes - require login and buyer role */}
                        <Route path="/cart" element={<BuyerRoute><Cart /></BuyerRoute>} />
                        <Route path="/checkout" element={<BuyerRoute><Checkout /></BuyerRoute>} />
                        <Route path="/my-orders" element={<BuyerRoute><MyOrders /></BuyerRoute>} />
                        <Route path="/notifications" element={<BuyerRoute><Notifications /></BuyerRoute>} />
                        <Route path="/profile" element={<BuyerRoute><Profile /></BuyerRoute>} />
                        <Route path="/account" element={<BuyerRoute><Account /></BuyerRoute>} />
                        <Route path="/help" element={<BuyerRoute><Help /></BuyerRoute>} />
                        <Route path="/wishlist" element={<BuyerRoute><Wishlist /></BuyerRoute>} />

                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </BrowserRouter>
                  </OrderProvider>
                </CartProvider>
              </ReviewProvider>
            </WishlistProvider>
          </ProductProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
