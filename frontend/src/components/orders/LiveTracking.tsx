import { useEffect, useState } from 'react';
import { useOrders } from '@/context/OrderContext';
import { OrderStatus } from '@/context/OrderContext';
import {
  Package,
  CheckCircle,
  Truck,
  MapPin,
  Clock,
  XCircle,
  Ban
} from 'lucide-react';
import { Card } from '@/components/ui/card';

interface LiveTrackingProps {
  orderId: string;
  orderStatus: OrderStatus;
  shippingDate?: string;
  estimatedDelivery?: string;
  deliveryDate?: string;
  trackingInfo?: string;
}

interface TrackingStep {
  id: string;
  label: string;
  description: string;
  icon: JSX.Element;
  status: 'completed' | 'current' | 'pending';
  date?: string;
}

export const LiveTracking = ({
  orderId,
  orderStatus,
  shippingDate,
  estimatedDelivery,
  deliveryDate,
  trackingInfo
}: LiveTrackingProps) => {
  const { fetchTrackingForOrder } = useOrders();
  const [tracking, setTracking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadTracking = async () => {
      setIsLoading(true);
      try {
        const t = await fetchTrackingForOrder(orderId);
        if (mounted) {
          setTracking(t);
        }
      } catch (e) {
        // ignore, use props-based steps
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    loadTracking();

    // Refresh tracking every 30 seconds for live updates
    const interval = setInterval(loadTracking, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]); // intentionally omit fetchTrackingForOrder — it's not memoized


  const getTrackingSteps = (): TrackingStep[] => {
    const steps: TrackingStep[] = [
      {
        id: 'ordered',
        label: 'Order Placed',
        description: 'Your order has been placed successfully',
        icon: <Package className="h-5 w-5" />,
        status: 'completed',
        date: tracking?.history?.[0]?.at || new Date().toISOString()
      },
      {
        id: 'confirmed',
        label: 'Order Confirmed',
        description: orderStatus === 'rejected' ? 'Order was rejected' : 'Seller has confirmed your order',
        icon: <CheckCircle className="h-5 w-5" />,
        status: orderStatus === 'rejected' || orderStatus === 'cancelled' ? 'pending' :
          (orderStatus === 'pending' ? 'pending' : 'completed'),
        date: shippingDate
      },
      {
        id: 'shipped',
        label: 'Shipped',
        description: trackingInfo || 'Your order has been shipped',
        icon: <Truck className="h-5 w-5" />,
        status: ['shipped', 'delivered'].includes(orderStatus) ? 'completed' :
          (orderStatus === 'accepted' ? 'current' : 'pending'),
        date: shippingDate
      },
      {
        id: 'out_for_delivery',
        label: 'Out for Delivery',
        description: estimatedDelivery ? `Expected delivery: ${new Date(estimatedDelivery).toLocaleDateString()}` : 'Your order is out for delivery',
        icon: <MapPin className="h-5 w-5" />,
        status: orderStatus === 'delivered' ? 'completed' :
          (orderStatus === 'shipped' ? 'current' : 'pending'),
        date: estimatedDelivery
      },
      {
        id: 'delivered',
        label: 'Delivered',
        description: deliveryDate ? `Delivered on ${new Date(deliveryDate).toLocaleDateString()}` : 'Your order has been delivered',
        icon: <CheckCircle className="h-5 w-5" />,
        status: orderStatus === 'delivered' ? 'completed' : 'pending',
        date: deliveryDate
      }
    ];

    // Handle rejected/cancelled orders
    if (orderStatus === 'rejected' || orderStatus === 'cancelled') {
      steps[0].status = 'completed';
      steps[1].status = orderStatus === 'rejected' ? 'current' : 'pending';
      steps[1].icon = orderStatus === 'rejected' ? <XCircle className="h-5 w-5" /> : <Ban className="h-5 w-5" />;
      steps[1].description = orderStatus === 'rejected' ? 'Order was rejected by seller' : 'Order was cancelled';
      return steps.slice(0, 2);
    }

    return steps;
  };

  const steps = getTrackingSteps();
  const currentStepIndex = steps.findIndex(s => s.status === 'current');
  const completedSteps = steps.filter(s => s.status === 'completed').length;

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-4">
                <div className="h-12 w-12 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">Live Order Tracking</h3>
        <p className="text-sm text-muted-foreground">Order ID: {orderId}</p>
      </div>

      <div className="relative">
        {/* Vertical line connecting steps */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border">
          <div
            className="absolute top-0 left-0 w-full bg-primary transition-all duration-500"
            style={{
              height: `${(completedSteps / steps.length) * 100}%`,
              maxHeight: currentStepIndex >= 0 ? `${((currentStepIndex + 0.5) / steps.length) * 100}%` : '100%'
            }}
          />
        </div>

        <div className="space-y-8">
          {steps.map((step, index) => (
            <div key={step.id} className="relative flex gap-4">
              {/* Step Icon */}
              <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${step.status === 'completed'
                  ? 'bg-primary border-primary text-primary-foreground'
                  : step.status === 'current'
                    ? 'bg-primary/20 border-primary text-primary animate-pulse'
                    : 'bg-background border-border text-muted-foreground'
                }`}>
                {step.status === 'completed' ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  step.icon
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 pb-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className={`font-semibold text-base mb-1 ${step.status === 'completed' || step.status === 'current'
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                      }`}>
                      {step.label}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {step.description}
                    </p>
                    {step.date && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(step.date).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>

                  {step.status === 'current' && (
                    <div className="flex items-center gap-2 text-primary">
                      <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium">In Progress</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Estimated Delivery Info */}
      {estimatedDelivery && orderStatus !== 'delivered' && (
        <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">Estimated Delivery</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Your order is expected to be delivered by{' '}
            <span className="font-semibold text-foreground">
              {new Date(estimatedDelivery).toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </p>
        </div>
      )}

      {/* Tracking Info */}
      {trackingInfo && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium text-foreground mb-1">Tracking Details</p>
          <p className="text-sm text-muted-foreground">{trackingInfo}</p>
        </div>
      )}
    </Card>
  );
};
