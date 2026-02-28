import Layout from '@/components/layout/Layout';

const Help = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-serif font-bold mb-4">Help & Support</h1>
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div>
            <h2 className="font-medium">Ordering</h2>
            <p className="text-sm text-muted-foreground">For questions about orders, delivery, or refunds, contact support@example.com.</p>
          </div>
          <div>
            <h2 className="font-medium">Account</h2>
            <p className="text-sm text-muted-foreground">Manage your account details on the Account page.</p>
          </div>
          <div>
            <h2 className="font-medium">Technical</h2>
            <p className="text-sm text-muted-foreground">If you need help with the app, please open an issue in the repository.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Help;
