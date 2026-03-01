import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/api';

export type UserRole = 'buyer' | 'seller';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  isVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, role: UserRole, phone?: string, address?: string, city?: string, district?: string, state?: string, pinCode?: string) => Promise<{ success: boolean; error?: string; userId?: string }>;
  checkAvailability: (email?: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (idToken: string, role?: UserRole) => Promise<{ success: boolean; error?: string; needsProfileCompletion?: boolean }>;
  sendOTP: (userId: string, email?: string, phone?: string) => Promise<{ success: boolean; error?: string; sentVia?: { email: boolean; phone: boolean }; errors?: string[] }>;
  verifyOTP: (userId: string, code: string) => Promise<{ success: boolean; error?: string }>;
  requestPhoneOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyPhoneUpdate: (phone: string, code: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface StoredUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const socketRef = useRef<any | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
    }
  }, []);

  // Keep socket connected for realtime notifications (dynamic CDN import of socket.io client)
  const connectSocket = async (userId?: string) => {
    try {
      if (socketRef.current) return socketRef.current;
      // Use VITE_API_URL if set, otherwise default to backend port 5000
      const url = API_BASE_URL;

      // Try a few CDN sources for the ESM bundle (some CDNs/versions may 404 or block CORS)
      const cdnCandidates = [
        'https://cdn.jsdelivr.net/npm/socket.io-client@4.8.1/dist/socket.io.esm.min.js',
        'https://unpkg.com/socket.io-client@4.8.1/dist/socket.io.esm.min.js',
        'https://cdn.socket.io/4.8.1/socket.io.esm.min.js'
      ];

      let mod: any = null;
      for (const cdn of cdnCandidates) {
        try {
          // @vite-ignore so Vite doesn't statically analyze this external import
          mod = await import(/* @vite-ignore */ cdn);
          if (mod) break;
        } catch (err) {
          console.warn('Socket CDN import failed for', cdn, err);
        }
      }

      if (!mod) {
        console.warn('All socket CDN imports failed, realtime disabled');
        return null;
      }

      const io = mod?.io || mod?.default?.io || mod?.default || mod;
      if (!io) {
        console.warn('Socket module does not export `io`, realtime disabled');
        return null;
      }

      const s = io(url, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      s.on('connect', () => {
        console.log('Socket.IO connected to', url);
        if (userId) s.emit('identify', userId);
      });

      s.on('connect_error', (error: any) => {
        console.warn('Socket.IO connection error:', error.message);
      });

      s.on('disconnect', (reason: string) => {
        console.log('Socket.IO disconnected:', reason);
      });

      s.on('notification', (n: any) => {
        toast('Notification', { description: n.message || n });
      });

      socketRef.current = s;
      return s;
    } catch (e) {
      console.warn('Socket connect failed', e);
      return null;
    }
  };

  const disconnectSocket = () => {
    try {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    } catch (e) {
      console.warn('Socket disconnect failed', e);
    }
  };

  const base = API_BASE_URL;

  // Verify session on mount and when storage changes (for multi-tab support)
  const verifySession = async () => {
    try {
      // Only verify if user exists in localStorage (short-circuit for guests)
      const storedUser = localStorage.getItem('currentUser');
      if (!storedUser) {
        // No user stored, this is a guest - skip verification
        return false;
      }

      const res = await fetch(`${base}/api/auth/verify`, {
        method: 'GET',
        credentials: 'include', // Include cookies
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        const data = await res.json();
        const user = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          isVerified: data.user.isVerified
        };
        setUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        connectSocket(user.id);
        return true;
      } else {
        setUser(null);
        localStorage.removeItem('currentUser');
        return false;
      }
    } catch (err) {
      console.error('Session verification failed', err);
      setUser(null);
      localStorage.removeItem('currentUser');
      return false;
    }
  };

  // Listen for storage changes (multi-tab support)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentUser') {
        if (e.newValue) {
          try {
            const user = JSON.parse(e.newValue);
            setUser(user);
          } catch (err) {
            console.error('Failed to parse user from storage', err);
          }
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Verify session on mount
    verifySession();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const register = async (name: string, email: string, password: string, role: UserRole, phone?: string, address?: string, city?: string, district?: string, state?: string, pinCode?: string) => {
    try {
      const res = await fetch(`${base}/api/auth/register`, {
        method: 'POST',
        credentials: 'include', // Include cookies
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, phone, address, city, district, state, pinCode })
      });
      if (!res.ok) {
        // Try to extract JSON error message, otherwise fallback to text
        let errBody: any = {};
        try {
          errBody = await res.json();
        } catch (e) {
          errBody = { message: await res.text().catch(() => 'Registration failed') };
        }
        const msg = errBody.message || 'Registration failed';
        console.error('Auth.register failed', { base, status: res.status, body: errBody, message: msg });
        return { success: false, error: msg };
      }
      const data = await res.json();
      const user = { id: data.user.id, name: data.user.name, email: data.user.email, role: data.user.role, isVerified: data.user.isVerified };
      // Cookie is set automatically by server, no need to store token
      localStorage.setItem('currentUser', JSON.stringify(user));
      setUser(user);
      connectSocket(user.id);
      return { success: true, userId: user.id };
    } catch (err: any) {
      const message = err?.message?.includes('fetch') || err?.message?.includes('Network')
        ? `Network error: Unable to reach auth server at ${base || '/api'}`
        : (err.message || 'Registration failed');
      return { success: false, error: message };
    }
  };

  const checkAvailability = async (email?: string, phone?: string) => {
    try {
      const res = await fetch(`${base}/api/auth/check-availability`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone })
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ message: 'Check failed' }));
        return { success: false, error: errBody.message || 'Email or phone already registered' };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${base}/api/auth/login`, {
        method: 'POST',
        credentials: 'include', // Include cookies
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        let errBody: any = {};
        try {
          errBody = await res.json();
        } catch (e) {
          errBody = { message: await res.text().catch(() => 'Login failed') };
        }
        const msg = errBody.message || 'Login failed';
        console.error('Auth.login failed', { base, status: res.status, body: errBody, message: msg });
        return { success: false, error: msg };
      }
      const data = await res.json();
      const user = { id: data.user.id, name: data.user.name, email: data.user.email, role: data.user.role, isVerified: data.user.isVerified };
      // Cookie is set automatically by server, no need to store token
      localStorage.setItem('currentUser', JSON.stringify(user));
      setUser(user);
      connectSocket(user.id);
      return { success: true };
    } catch (err: any) {
      const message = err?.message?.includes('fetch') || err?.message?.includes('Network')
        ? `Network error: Unable to reach auth server at ${base || '/api'}`
        : (err.message || 'Login failed');
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to clear server-side session and cookie
      await fetch(`${base}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.error('Logout request failed', err);
    } finally {
      // Clear local state regardless of API call result
      setUser(null);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token'); // Remove for backward compatibility
      disconnectSocket();
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      const res = await fetch(`${base}/api/users/me`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Update failed' }));
        return { success: false, error: err.message || 'Update failed' };
      }
      const updated = await res.json();
      const u = {
        id: updated._id || updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        phone: updated.phone,
        address: updated.address,
        city: updated.city,
        state: updated.state,
        pinCode: updated.pinCode,
        isVerified: updated.isVerified
      };
      setUser(u);
      localStorage.setItem('currentUser', JSON.stringify(u));
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const res = await fetch(`${base}/api/users/me/password`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Password update failed' }));
        return { success: false, error: err.message || 'Password update failed' };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const requestPhoneOtp = async (phone: string) => {
    try {
      const res = await fetch(`${base}/api/users/me/request-phone-otp`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to send OTP' }));
        return { success: false, error: err.message };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const verifyPhoneUpdate = async (phone: string, code: string) => {
    try {
      const res = await fetch(`${base}/api/users/me/verify-phone-update`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Verification failed' }));
        return { success: false, error: err.message };
      }
      const data = await res.json();
      const updated = data.user;
      const u = {
        id: updated._id || updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        phone: updated.phone,
        address: updated.address,
        city: updated.city,
        state: updated.state,
        pinCode: updated.pinCode,
        isVerified: updated.isVerified
      };
      setUser(u);
      localStorage.setItem('currentUser', JSON.stringify(u));
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const loginWithGoogle = async (idToken: string, role?: UserRole) => {
    try {
      const res = await fetch(`${base}/api/auth/google`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, role })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Google login failed' }));
        return { success: false, error: err.message };
      }
      const data = await res.json();
      const user = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        isVerified: data.user.isVerified
      };
      localStorage.setItem('currentUser', JSON.stringify(user));
      setUser(user);
      connectSocket(user.id);
      return { success: true, needsProfileCompletion: data.user.needsProfileCompletion };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  };

  const sendOTP = async (userId: string, email?: string, phone?: string) => {
    try {
      const res = await fetch(`${base}/api/auth/send-otp`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email, phone })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to send OTP' }));
        return { success: false, error: err.message };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  };

  const verifyOTP = async (userId: string, code: string) => {
    try {
      const res = await fetch(`${base}/api/auth/verify-otp`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Verification failed' }));
        return { success: false, error: err.message };
      }
      // Update local state isVerified
      if (user) {
        const updated = { ...user, isVerified: true };
        setUser(updated);
        localStorage.setItem('currentUser', JSON.stringify(updated));
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Network error' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      register,
      checkAvailability,
      logout,
      updateProfile,
      updatePassword,
      loginWithGoogle,
      sendOTP,
      verifyOTP,
      requestPhoneOtp,
      verifyPhoneUpdate
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
