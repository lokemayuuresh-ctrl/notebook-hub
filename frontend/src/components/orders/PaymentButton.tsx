import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Banknote, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface PaymentButtonProps {
  orderId: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  onPaymentSuccess?: () => void;
}

export const PaymentButton = ({ 
  orderId, 
  amount, 
  paymentMethod, 
  paymentStatus,
  onPaymentSuccess 
}: PaymentButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'online' | 'cash'>('online');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${base}/api/payments/process`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId,
          paymentMethod: selectedMethod === 'online' ? 'razorpay' : 'cod',
          amount
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast({
          title: "Payment Successful",
          description: `Payment of ₹${amount.toLocaleString('en-IN')} has been processed successfully!`,
        });
        setIsOpen(false);
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
        // Refresh page to update order status
        window.location.reload();
      } else {
        toast({
          title: "Payment Failed",
          description: data.message || "Payment processing failed. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Payment error', error);
      toast({
        title: "Payment Error",
        description: error.message || "An error occurred while processing payment.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentStatus === 'paid') {
    return (
      <Button variant="outline" disabled className="gap-2">
        <CheckCircle className="h-4 w-4 text-green-600" />
        Payment Completed
      </Button>
    );
  }

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)} 
        className="gap-2"
        variant="default"
      >
        <CreditCard className="h-4 w-4" />
        Pay Now
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Order #{orderId.slice(-8).toUpperCase()} - Amount: ₹{amount.toLocaleString('en-IN')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-base font-semibold mb-3 block">Select Payment Method</Label>
              <RadioGroup value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as 'online' | 'cash')}>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="online" id="online" />
                  <Label htmlFor="online" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Online Payment</p>
                        <p className="text-sm text-muted-foreground">Pay via Razorpay (UPI, Cards, Net Banking)</p>
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Banknote className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Cash Payment</p>
                        <p className="text-sm text-muted-foreground">Confirm cash payment received</p>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {selectedMethod === 'online' && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Note:</strong> This is a demo payment. In production, this would redirect to Razorpay payment gateway.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handlePayment} disabled={isProcessing} className="gap-2">
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {selectedMethod === 'online' ? (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Pay ₹{amount.toLocaleString('en-IN')}
                    </>
                  ) : (
                    <>
                      <Banknote className="h-4 w-4" />
                      Confirm Cash Payment
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
