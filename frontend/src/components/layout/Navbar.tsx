import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, BookOpen, Menu, X, LogOut, Package, Heart, Store, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useOrders } from '@/context/OrderContext';
import { useWishlist } from '@/context/WishlistContext';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const Navbar = () => {
  const { itemCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const { getUnreadNotifications } = useOrders();
  const { wishlist } = useWishlist();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadCount = user ? getUnreadNotifications(user.id).length : 0;
  const wishlistCount = wishlist.length;

  // Nav links - hide Products for sellers
  const navLinks = [
    { href: '/', label: 'Home' },
    ...(user?.role !== 'seller' ? [{ href: '/products', label: 'Products' }] : []),
    { href: '/about', label: 'About' },
  ];

  const isSellerOnDashboard = user?.role === 'seller' && location.pathname === '/seller/dashboard';

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <BookOpen className="h-7 w-7 text-primary" />
          <span className="font-serif text-xl font-semibold text-foreground">NotebookHub</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(link => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive(link.href) ? "text-primary" : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated && user?.role === 'seller' && (
            <Link to="/seller/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <Store className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          )}
          {isAuthenticated && user?.role === 'buyer' && (
            <>
              <Link to="/wishlist">
                <Button variant="ghost" size="icon" className="relative">
                  <Heart className="h-5 w-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-xs font-semibold text-destructive-foreground flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Link to="/my-orders">
                <Button variant="ghost" size="icon" className="relative">
                  <Package className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-xs font-semibold text-destructive-foreground flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </Link>
            </>
          )}
          <Link to="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs font-semibold text-primary-foreground flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link to="/notifications">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-xs font-semibold text-destructive-foreground flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Link to="/profile" className="text-sm text-muted-foreground hover:text-primary">
                Hi, <span className="font-medium text-foreground">{user?.name}</span>
              </Link>
              <Button variant="outline" size="sm" className="gap-2" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                Login
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-3">
          {isAuthenticated && user?.role === 'buyer' && (
            <>
              <Link to="/wishlist">
                <Button variant="ghost" size="icon" className="relative">
                  <Heart className="h-5 w-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-xs font-semibold text-destructive-foreground flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </Button>
              </Link>
              <Link to="/my-orders">
                <Button variant="ghost" size="icon" className="relative">
                  <Package className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-xs font-semibold text-destructive-foreground flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </Link>
            </>
          )}
          <Link to="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs font-semibold text-primary-foreground flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background animate-fade-in">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "text-sm font-medium py-2 transition-colors",
                  isActive(link.href) ? "text-primary" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && user?.role === 'seller' && (
              <Link
                to="/seller/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium py-2 text-muted-foreground flex items-center gap-2"
              >
                <Store className="h-4 w-4" />
                Seller Dashboard
              </Link>
            )}
            {isAuthenticated && user?.role === 'buyer' && (
              <>
                <Link
                  to="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium py-2 text-muted-foreground flex items-center gap-2"
                >
                  <Heart className="h-4 w-4" />
                  Wishlist
                  {wishlistCount > 0 && (
                    <span className="h-5 w-5 rounded-full bg-destructive text-xs font-semibold text-destructive-foreground flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/my-orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium py-2 text-muted-foreground flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  My Orders
                  {unreadCount > 0 && (
                    <span className="h-5 w-5 rounded-full bg-destructive text-xs font-semibold text-destructive-foreground flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </>
            )}
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground py-2">
                  Hi, <span className="font-medium text-foreground">{user?.name}</span>
                </span>
                <Button variant="outline" className="w-full gap-2" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full gap-2">
                  <User className="h-4 w-4" />
                  Login
                </Button>
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
