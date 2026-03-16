import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export const ForgotPassword = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<1 | 2>(1); // 1: Email Request, 2: OTP & New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return toast.error('Please enter your email address');

        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiUrl}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase() }),
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                setStep(2);
            } else {
                toast.error(data.message || 'Failed to send OTP');
            }
        } catch (err) {
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp || !newPassword) return toast.error('Please fill all fields');
        if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');

        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const res = await fetch(`${apiUrl}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase(), code: otp, newPassword }),
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(data.message);
                setIsOpen(false);
                // Reset state
                setTimeout(() => {
                    setStep(1);
                    setEmail('');
                    setOtp('');
                    setNewPassword('');
                }, 500);
            } else {
                toast.error(data.message || 'Failed to reset password');
            }
        } catch (err) {
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button type="button" className="text-sm font-medium text-primary hover:underline w-full text-right mt-1">
                    Forgot Password?
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                        {step === 1
                            ? "Enter your email address and we'll send you an OTP to reset your password."
                            : "Enter the OTP sent to your email and your new password."}
                    </DialogDescription>
                </DialogHeader>

                {step === 1 ? (
                    <form onSubmit={handleSendOTP} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="reset-email">Email Address</Label>
                            <Input
                                id="reset-email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Sending...' : 'Send OTP'}
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="reset-otp">Verification Code (OTP)</Label>
                            <Input
                                id="reset-otp"
                                type="text"
                                placeholder="Enter 6-digit code"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                required
                                disabled={loading}
                                maxLength={6}
                                className="text-center tracking-widest font-mono text-lg"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                disabled={loading}
                                minLength={6}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full mt-2"
                            onClick={() => setStep(1)}
                            disabled={loading}
                        >
                            Back
                        </Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};
