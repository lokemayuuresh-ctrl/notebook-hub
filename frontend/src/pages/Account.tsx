import Layout from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { MapPin, User, Phone, Mail, Lock } from 'lucide-react';

const Account = () => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState((user as any)?.phone || '');
  const [address, setAddress] = useState((user as any)?.address || '');
  const [city, setCity] = useState((user as any)?.city || '');
  const [district, setDistrict] = useState((user as any)?.district || '');
  const [state, setState] = useState((user as any)?.state || '');
  const [pinCode, setPinCode] = useState((user as any)?.pinCode || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone((user as any)?.phone || '');
      setAddress((user as any)?.address || '');
      setCity((user as any)?.city || '');
      setDistrict((user as any)?.district || '');
      setState((user as any)?.state || '');
      setPinCode((user as any)?.pinCode || '');
    }
  }, [user]);

  const save = async () => {
    if (!name.trim()) {
      toast({ 
        title: 'Validation Error', 
        description: 'Name is required', 
        variant: 'destructive' 
      });
      return;
    }

    setIsSaving(true);
    const result = await updateProfile({ name, phone, address, city, district, state, pinCode });
    setIsSaving(false);
    if (result.success) {
      toast({ title: 'Profile updated successfully' });
    } else {
      toast({ 
        title: 'Update failed', 
        description: result.error || 'Could not update profile', 
        variant: 'destructive' 
      });
    }
  };

  const updatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ 
        title: 'Validation Error', 
        description: 'All password fields are required', 
        variant: 'destructive' 
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ 
        title: 'Validation Error', 
        description: 'New passwords do not match', 
        variant: 'destructive' 
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({ 
        title: 'Validation Error', 
        description: 'Password must be at least 6 characters', 
        variant: 'destructive' 
      });
      return;
    }

    setIsSaving(true);
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    try {
      const res = await fetch(`${base}/api/users/me/password`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (res.ok) {
        toast({ title: 'Password updated successfully' });
        setShowPasswordForm(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const error = await res.json().catch(() => ({ message: 'Failed to update password' }));
        toast({ 
          title: 'Update failed', 
          description: error.message || 'Could not update password', 
          variant: 'destructive' 
        });
      }
    } catch (err: any) {
      toast({ 
        title: 'Update failed', 
        description: err.message || 'Network error', 
        variant: 'destructive' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-serif font-bold mb-8">Account Settings</h1>
        
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Profile Information */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </h2>
            
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input 
                id="name"
                value={name} 
                onChange={e => setName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                value={user?.email || ''} 
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone"
                type="tel"
                value={phone} 
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 9876543210"
              />
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <Textarea 
                id="address"
                value={address} 
                onChange={e => setAddress(e.target.value)}
                placeholder="Enter your complete address"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city"
                  value={city} 
                  onChange={e => setCity(e.target.value)}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="district">District</Label>
                <Input 
                  id="district"
                  value={district} 
                  onChange={e => setDistrict(e.target.value)}
                  placeholder="District"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input 
                id="state"
                value={state} 
                onChange={e => setState(e.target.value)}
                placeholder="State"
              />
            </div>

            <div>
              <Label htmlFor="pinCode">PIN Code *</Label>
              <Input 
                id="pinCode"
                value={pinCode} 
                onChange={e => setPinCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                pattern="[0-9]*"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={save} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>

            <div className="text-sm text-muted-foreground pt-4 border-t border-border">
              <p className="mb-1 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email: <span className="font-medium text-foreground">{user?.email}</span>
              </p>
              <p className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Role: <span className="font-medium text-foreground capitalize">{user?.role}</span>
              </p>
            </div>
          </div>

          {/* Password Change */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </h2>

            {!showPasswordForm ? (
              <Button 
                variant="outline" 
                onClick={() => setShowPasswordForm(true)}
                className="w-full"
              >
                Change Password
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password *</Label>
                  <Input 
                    id="currentPassword"
                    type="password"
                    value={currentPassword} 
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <Label htmlFor="newPassword">New Password *</Label>
                  <Input 
                    id="newPassword"
                    type="password"
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                  <Input 
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={updatePassword} 
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? 'Updating...' : 'Update Password'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowPasswordForm(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Account;
