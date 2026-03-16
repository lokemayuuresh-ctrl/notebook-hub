import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, BookOpen, ArrowLeft } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('notebookhub@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If already authenticated as admin, redirect to admin dashboard
    if (isAuthenticated && user && user.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        // Need to check if the logged in user is actually an admin
        // The context/localStorage will have the user data now
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        if (currentUser.role === 'admin') {
          toast.success("Admin Login Successful", {
            description: "Welcome to the management console.",
          });
          navigate('/admin', { replace: true });
        } else {
          // If not admin, logout or show error
          toast.error("Access Denied", {
            description: "You do not have administrative privileges.",
          });
          // Optional: trigger logout
        }
      } else {
        toast.error("Login Failed", {
          description: result.error || "Invalid admin credentials",
        });
      }
    } catch (err) {
      toast.error("System Error", {
        description: "An unexpected error occurred during login.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Site
      </Link>
      
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-destructive/10 rounded-full">
              <ShieldAlert className="h-10 w-10 text-destructive" />
            </div>
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
            Admin Portal
          </h1>
          <p className="text-muted-foreground">
            Identity verification required for administrative access
          </p>
        </div>

        <div className="bg-card border-2 border-border rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="notebookhub@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Security Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <Button 
                type="submit" 
                className="w-full h-12 text-lg font-semibold bg-destructive hover:bg-destructive/90 text-white" 
                disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Access Management Console'}
            </Button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-border flex items-center justify-center gap-2">
            <BookOpen className="h-5 w-5 text-primary opacity-50" />
            <span className="text-sm font-medium text-muted-foreground">NotebookHub Internal Systems</span>
          </div>
        </div>
        
        <p className="mt-8 text-center text-xs text-muted-foreground uppercase tracking-widest opacity-60">
          Authorization events are logged and monitored
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
