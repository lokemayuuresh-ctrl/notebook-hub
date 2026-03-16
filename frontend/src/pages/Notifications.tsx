import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { useOrders } from '@/context/OrderContext';
import { Button } from '@/components/ui/button';

const NotificationsPage = () => {
  const { user } = useAuth();
  const { notifications, markNotificationRead, clearNotifications } = useOrders();
  const [list, setList] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const filtered = notifications.filter(n => n.userId === user.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setList(filtered);
  }, [user, notifications]);

  // Auto-refresh notifications every 30 seconds (handled by OrderContext)

  if (!user) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-serif font-bold">Notifications</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => clearNotifications(user.id)}>
              Mark all read
            </Button>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <p className="text-lg text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map(n => (
              <div key={n.id} className={`p-4 rounded-lg border ${n.read ? 'bg-muted/10' : 'bg-primary/5 border-primary/20'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {!n.read && (
                      <Button size="sm" onClick={async () => { await markNotificationRead(n.id); }}>
                        Mark read
                      </Button>
                    )}
                    {n.orderId && (
                      <Button variant="ghost" size="sm" onClick={() => window.location.assign(`/my-orders`)}>
                        View order
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NotificationsPage;
