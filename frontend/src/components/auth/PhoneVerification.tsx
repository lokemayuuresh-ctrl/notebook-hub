import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface PhoneVerificationProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    email?: string;
    phone?: string;
    onSuccess: () => void;
}

export const PhoneVerification = ({
    isOpen,
    onClose,
    userId,
    email,
    phone,
    onSuccess,
}: PhoneVerificationProps) => {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [timer, setTimer] = useState(0);
    const { sendOTP, verifyOTP } = useAuth();

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleSendOTP = async () => {
        if (timer > 0) return;
        setSending(true);
        const res = await sendOTP(userId, email, phone);
        setSending(false);
        if (res.success) {
            setTimer(60);
            const methods = [];
            if (res.sentVia?.email) methods.push("email");
            if (res.sentVia?.phone) methods.push("mobile");

            if (methods.length > 0) {
                toast.success(`Verification code sent to your ${methods.join(" and ")}!`);
            }

            if (res.errors && res.errors.length > 0) {
                toast.error("Some delivery methods failed", {
                    description: res.errors.join(", ")
                });
            }
        } else {
            toast.error(res.error || "Failed to send OTP");
        }
    };

    const handleVerify = async () => {
        if (code.length < 6) {
            toast.error("Please enter a valid 6-digit code");
            return;
        }
        setLoading(true);
        const res = await verifyOTP(userId, code);
        setLoading(false);
        if (res.success) {
            toast.success("Verification successful!");
            onSuccess();
            onClose();
        } else {
            toast.error(res.error || "Invalid verification code");
        }
    };

    useEffect(() => {
        if (isOpen) {
            handleSendOTP();
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Verify Your Account</DialogTitle>
                    <DialogDescription>
                        We've sent a 6-digit verification code to
                        {email && <span className="font-semibold"> {email}</span>}
                        {phone && (
                            <>
                                {" "}
                                and mobile <span className="font-semibold">{phone}</span>
                            </>
                        )}
                        .
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <Input
                        placeholder="Enter 6-digit code"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="text-center text-2xl tracking-widest font-bold h-14"
                        maxLength={6}
                    />
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Didn't receive code?</span>
                        <Button
                            variant="link"
                            onClick={handleSendOTP}
                            disabled={sending || timer > 0}
                            className="p-0 h-auto"
                        >
                            {sending ? "Sending..." : timer > 0 ? `Resend Code (${timer}s)` : "Resend Code"}
                        </Button>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleVerify} disabled={loading}>
                        {loading ? "Verifying..." : "Verify & Continue"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
