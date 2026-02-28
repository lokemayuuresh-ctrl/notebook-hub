import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  User as UserIcon,
  Package,
  Settings,
  LogOut,
  MapPin,
  Phone,
  Mail,
  ShoppingBag,
  Store,
  ChevronRight,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const Profile = () => {
  const {
    user,
    logout,
    updateProfile,
    updatePassword,
    requestPhoneOtp,
    verifyPhoneUpdate
  } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    pinCode: user?.pinCode || '',
  });

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Phone Update State
  const [newPhone, setNewPhone] = useState(user?.phone || '');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [showPhoneOtpModal, setShowPhoneOtpModal] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        pinCode: user.pinCode || '',
      });
      setNewPhone(user.phone || '');
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profileData.pinCode && !/^[0-9]{6}$/.test(profileData.pinCode)) {
      toast.error('Pin code must be exactly 6 digits');
      return;
    }
    const res = await updateProfile(profileData);
    if (res.success) {
      toast.success('Profile updated successfully');
    } else {
      toast.error(res.error || 'Failed to update profile');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    const res = await updatePassword(passwordData.currentPassword, passwordData.newPassword);
    if (res.success) {
      toast.success('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      toast.error(res.error || 'Failed to update password');
    }
  };

  const handleRequestPhoneOtp = async () => {
    if (!/^[0-9]{10}$/.test(newPhone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    if (newPhone === user?.phone) {
      toast.info('This is already your current phone number');
      return;
    }
    setIsSendingOtp(true);
    const res = await requestPhoneOtp(newPhone);
    setIsSendingOtp(false);
    if (res.success) {
      setShowPhoneOtpModal(true);
      toast.success('Verification code sent to your mobile and email');
    } else {
      toast.error(res.error || 'Failed to send verification code');
    }
  };

  const handleVerifyPhoneUpdate = async () => {
    if (phoneOtp.length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }
    setIsVerifyingOtp(true);
    const res = await verifyPhoneUpdate(newPhone, phoneOtp);
    setIsVerifyingOtp(false);
    if (res.success) {
      toast.success('Phone number updated and verified successfully');
      setShowPhoneOtpModal(false);
      setPhoneOtp('');
    } else {
      toast.error(res.error || 'Invalid verification code');
    }
  };

  return (
    <Layout>
      <div className="min-h-[80vh] bg-background">
        {/* Profile Header Block */}
        <div className="bg-primary/5 border-b border-border">
          <div className="container mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src="" />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {getInitials(user?.name || '')}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                  <h1 className="text-3xl font-serif font-bold text-foreground">
                    {user?.name || 'User'}
                  </h1>
                  <Badge variant={user?.role === 'seller' ? 'default' : 'secondary'} className="capitalize">
                    {user?.role === 'seller' ? (
                      <><Store className="w-3 h-3 mr-1" /> Seller</>
                    ) : (
                      <><ShoppingBag className="w-3 h-3 mr-1" /> Buyer</>
                    )}
                  </Badge>
                  {user?.isVerified && (
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                      <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-primary/70" />
                    <span className="text-sm">{user?.email}</span>
                  </div>
                  {user?.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-primary/70" />
                      <span className="text-sm">{user?.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={handleLogout} className="text-destructive hover:bg-destructive/10">
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} className="space-y-6" onValueChange={setActiveTab}>
            <div className="flex items-center justify-center md:justify-start">
              <TabsList className="bg-muted/50 p-1 border border-border">
                <TabsTrigger value="overview" className="data-[state=active]:bg-background">
                  <UserIcon className="w-4 h-4 mr-2" /> Overview
                </TabsTrigger>
                <TabsTrigger value="orders" className="data-[state=active]:bg-background">
                  <Package className="w-4 h-4 mr-2" /> Orders
                </TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-background">
                  <Settings className="w-4 h-4 mr-2" /> Account Settings
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 shadow-soft border-border/60">
                  <CardHeader>
                    <CardTitle className="text-xl">Profile Information</CardTitle>
                    <CardDescription>Manage your basic account details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Name</p>
                        <p className="font-medium">{user?.name}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email Address</p>
                        <p className="font-medium">{user?.email}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone Number</p>
                        <p className="font-medium flex items-center gap-2">
                          {user?.phone || 'Not provided'}
                          {user?.phone && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Account Role</p>
                        <Badge variant="outline" className="capitalize">{user?.role}</Badge>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" /> Saved Address
                      </h3>
                      {user?.address ? (
                        <div className="p-4 rounded-lg border bg-muted/30 text-sm">
                          <p className="font-medium mb-1 font-serif">{user.name}</p>
                          <p className="text-muted-foreground">{user.address}</p>
                          {user.city && <p className="text-muted-foreground">{user.city}, {user.state} {user.pinCode}</p>}
                        </div>
                      ) : (
                        <div className="text-center p-8 border border-dashed rounded-lg bg-muted/10">
                          <p className="text-sm text-muted-foreground mb-4">No address saved yet</p>
                          <Button variant="outline" size="sm" onClick={() => setActiveTab('settings')}>
                            Add Address
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card className="shadow-soft border-border/60 bg-primary/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {user?.role === 'seller' ? (
                        <Link to="/seller/dashboard">
                          <Button className="w-full justify-between" variant="default">
                            Seller Dashboard <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      ) : (
                        <Link to="/seller/onboarding">
                          <Button className="w-full justify-between" variant="outline">
                            Become a Seller <Store className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}
                      {user?.role === 'seller' ? (
                        <Link to="/seller/dashboard">
                          <Button className="w-full justify-between" variant="ghost">
                            Manage Inventory <Package className="w-4 h-4" />
                          </Button>
                        </Link>
                      ) : (
                        <Link to="/my-orders">
                          <Button className="w-full justify-between" variant="ghost">
                            View Orders <Package className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="shadow-soft border-border/60">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Need Help?</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Having trouble with your account or orders? Our support team is here to help.
                      </p>
                      <Link to="/help">
                        <Button variant="link" className="px-0 h-auto text-primary">
                          Visit Help Center
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="orders">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Track and manage your order history</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-6 bg-muted rounded-full mb-4">
                    <Package className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">Your orders will appear here</h3>
                  <p className="text-muted-foreground text-sm max-w-xs mb-6">
                    You haven't placed any orders yet. Visit our shop to find premium notebooks.
                  </p>
                  <Link to="/products">
                    <Button>Start Shopping</Button>
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information */}
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-primary" /> Personal Information
                    </CardTitle>
                    <CardDescription>Update your general profile data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={profileData.address}
                          onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={profileData.city}
                            onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            value={profileData.state}
                            onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pinCode">Pin Code</Label>
                        <Input
                          id="pinCode"
                          value={profileData.pinCode}
                          onChange={(e) => setProfileData({ ...profileData, pinCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                          placeholder="6-digit number"
                        />
                      </div>
                      <Button type="submit" className="w-full">Save Changes</Button>
                    </form>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  {/* Phone Number Update */}
                  <Card className="shadow-soft">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Phone className="w-5 h-5 text-primary" /> Phone Number
                      </CardTitle>
                      <CardDescription>Confirm your mobile number with OTP</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Mobile Number</Label>
                        <div className="flex gap-2">
                          <Input
                            id="phone"
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="10 digit number"
                          />
                          <Button
                            variant="secondary"
                            onClick={handleRequestPhoneOtp}
                            disabled={isSendingOtp || newPhone === user?.phone}
                          >
                            {isSendingOtp ? 'Sending...' : 'Verify'}
                          </Button>
                        </div>
                        {user?.phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-500" /> Currently: {user.phone}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Security */}
                  <Card className="shadow-soft">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-primary" /> Security
                      </CardTitle>
                      <CardDescription>Update your account password</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <div className="relative">
                            <Input
                              id="currentPassword"
                              type={showCurrentPass ? "text" : "password"}
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-2.5 text-muted-foreground"
                              onClick={() => setShowCurrentPass(!showCurrentPass)}
                            >
                              {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <div className="relative">
                            <Input
                              id="newPassword"
                              type={showNewPass ? "text" : "password"}
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-2.5 text-muted-foreground"
                              onClick={() => setShowNewPass(!showNewPass)}
                            >
                              {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          />
                        </div>
                        <Button type="submit" variant="secondary" className="w-full">Update Password</Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Phone OTP Verification Modal */}
      <Dialog open={showPhoneOtpModal} onOpenChange={setShowPhoneOtpModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Phone Number</DialogTitle>
            <DialogDescription>
              We've sent a 6-digit verification code to <span className="font-semibold">{newPhone}</span>.
              Please enter it below to confirm your change.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={phoneOtp}
              onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="text-center text-3xl font-bold tracking-[0.5em] h-16"
              maxLength={6}
            />
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="ghost" onClick={() => setShowPhoneOtpModal(false)}>Cancel</Button>
            <Button onClick={handleVerifyPhoneUpdate} disabled={isVerifyingOtp} className="sm:flex-1">
              {isVerifyingOtp ? 'Verifying...' : 'Verify & Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Profile;
