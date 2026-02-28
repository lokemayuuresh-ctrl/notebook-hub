import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth, UserRole } from '@/context/AuthContext';
import { BookOpen, ShoppingBag, Store } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { PhoneVerification } from '@/components/auth/PhoneVerification';
import { ForgotPassword } from '@/components/auth/ForgotPassword';
import { Separator } from '@/components/ui/separator';

const AuthHeader = () => (
  <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="container mx-auto flex h-16 items-center justify-between px-4">
      <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
        <BookOpen className="h-7 w-7 text-primary" />
        <span className="font-serif text-xl font-semibold text-foreground">NotebookHub</span>
      </Link>
      <Link to="/products">
        <Button variant="ghost" size="sm">
          Browse Products
        </Button>
      </Link>
    </div>
  </header>
);

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [role, setRole] = useState<UserRole>('buyer');
  const { login, register, isAuthenticated, user, checkAvailability, loginWithGoogle } = useAuth();
  const [showOTP, setShowOTP] = useState(false);
  const [regStep, setRegStep] = useState(1);
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || null;

  useEffect(() => {
    if (isAuthenticated && user) {
      if (redirectTo) {
        navigate(redirectTo, { replace: true });
      } else if (user.role === 'seller') {
        navigate('/seller/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, redirectTo]);

  if (isAuthenticated && user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      const result = await login(email, password);
      if (result.success) {
        if (redirectTo) {
          navigate(redirectTo, { replace: true });
        } else if (user?.role === 'seller') {
          navigate('/seller/dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        toast.error("Login Failed", {
          description: result.error || "Invalid credentials",
        });
      }
    } else {
      // Step 1 Validation
      if (regStep === 1) {
        if (!name || !name.trim()) {
          toast.error("Name Required", { description: "Please enter your full name" });
          return;
        }
        if (!email || !email.trim()) {
          toast.error("Email Required", { description: "Please enter your email address" });
          return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          toast.error("Invalid Email", { description: "Please enter a valid email address" });
          return;
        }
        if (!password || password.length < 6) {
          toast.error("Password Required", { description: "Password must be at least 6 characters" });
          return;
        }
        setRegStep(2);
        return;
      }

      // Step 2 Validation & Submission
      if (!phone) {
        toast.error("Phone Required", { description: "Please enter your phone number" });
        return;
      }

      const phoneRegex = /^[0-9]{10}$/;
      const cleanPhone = phone.replace(/\D/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        toast.error("Invalid Phone Number", { description: "Phone number must be exactly 10 digits" });
        return;
      }

      if (!pinCode || !/^[0-9]{6}$/.test(pinCode)) {
        toast.error("Invalid PIN Code", { description: "PIN code must be exactly 6 digits" });
        return;
      }

      const availabilityCheck = await checkAvailability(email, cleanPhone);
      if (!availabilityCheck.success) {
        toast.error("Registration Failed", { description: availabilityCheck.error || "Email or phone number already registered" });
        return;
      }

      const result = await register(name, email, password, role, cleanPhone, address, city, district, state, pinCode);

      if (result.success) {
        toast.success("Registration Successful", { description: "Your account has been created successfully" });
        if (redirectTo) navigate(redirectTo, { replace: true });
        else if (role === 'seller') navigate('/seller/dashboard', { replace: true });
        else navigate('/', { replace: true });
      } else {
        toast.error("Registration Failed", { description: result.error || "Failed to create account" });
      }
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    const result = await loginWithGoogle(credentialResponse.credential, role);
    if (result.success) {
      if (!result.needsProfileCompletion) {
        toast.success("Login Successful", { description: "Welcome back!" });
      } else {
        toast("Profile Incomplete", { description: "Please complete your profile to continue." });
        navigate('/profile');
      }
    } else {
      toast.error("Google Login Failed", { description: result.error });
    }
  };

  return (
    <>
      <AuthHeader />
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                {isLogin ? (
                  <ShoppingBag className="h-8 w-8 text-primary" />
                ) : (
                  <Store className="h-8 w-8 text-primary" />
                )}
              </div>
            </div>
            <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-muted-foreground">
              {isLogin
                ? 'Sign in to continue shopping'
                : 'Join us to start selling or buying'}
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-soft">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && regStep === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">I want to</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="role"
                          value="buyer"
                          checked={role === 'buyer'}
                          onChange={(e) => setRole(e.target.value as UserRole)}
                          className="w-4 h-4 cursor-pointer accent-primary"
                        />
                        <span className="text-sm">Buy Products</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="role"
                          value="seller"
                          checked={role === 'seller'}
                          onChange={(e) => setRole(e.target.value as UserRole)}
                          className="w-4 h-4 cursor-pointer accent-primary"
                        />
                        <span className="text-sm">Sell Products</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {!isLogin && regStep === 2 && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium">Contact & Address Details</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setRegStep(1)}
                      className="text-xs"
                    >
                      ← Back to Step 1
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (10 digits)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 10) setPhone(value);
                      }}
                      maxLength={10}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      type="text"
                      placeholder="Street, Area"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        type="text"
                        placeholder="City"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="district">District</Label>
                      <Input
                        id="district"
                        type="text"
                        placeholder="District"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        type="text"
                        placeholder="State"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pinCode">PIN Code</Label>
                      <Input
                        id="pinCode"
                        type="text"
                        placeholder="123456"
                        value={pinCode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 6) setPinCode(val);
                        }}
                        maxLength={6}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {isLogin && (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => {
                        toast.error("Google Login Error");
                      }}
                      useOneTap
                      theme="outline"
                      size="large"
                    />
                  </div>
                </>
              )}

              {isLogin ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <ForgotPassword />
                  </div>
                </>
              ) : null}

              <Button type="submit" className="w-full" size="lg">
                {isLogin ? 'Sign In' : (regStep === 1 ? 'Next Step' : 'Create Account')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setRegStep(1);
                  setEmail('');
                  setPassword('');
                  setName('');
                  setPhone('');
                  setAddress('');
                  setCity('');
                  setDistrict('');
                  setState('');
                  setPinCode('');
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <PhoneVerification
        isOpen={showOTP}
        onClose={() => setShowOTP(false)}
        userId={tempUserId || ""}
        email={email}
        phone={phone}
        onSuccess={() => {
          toast.success("Verification Successful", { description: "Your account is now verified." });
          if (user?.role === 'seller') navigate('/seller/dashboard');
          else navigate('/');
        }}
      />
    </>
  );
};

export default Login;
