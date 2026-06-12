"use client";

import { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { db } from '@/lib/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Check, X, ExternalLink } from 'lucide-react';
import { sendCredentialEmail } from '@/lib/email';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export default function AdminPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('date', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orderList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(orderList);
      setLoading(false);
    }, async (err) => {
      const permissionError = new FirestorePermissionError({
        path: 'orders',
        operation: 'list',
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleVerify = async (order: any) => {
    try {
      // 1. Update status
      const orderRef = doc(db, 'orders', order.id);
      updateDoc(orderRef, { status: 'verified' })
        .catch(async () => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: orderRef.path,
            operation: 'update',
            requestResourceData: { status: 'verified' }
          }));
        });

      // 2. Generate account details
      const accountId = Math.random().toString(36).substring(7).toUpperCase();
      const login = Math.floor(1000000 + Math.random() * 9000000).toString();
      const password = Math.random().toString(36).substring(2, 12);
      
      const accountData = {
        userId: order.userId,
        email: order.email,
        plan: order.plan,
        size: order.size,
        mt5Login: login,
        mt5Password: password,
        mt5Server: "PrimeFunded-Demo",
        balance: parseFloat(order.size.replace('$', '').replace('k', '000')),
        status: "active",
        startDate: new Date().toISOString(),
        daysTraded: 0,
        winRate: 0,
        profit: 0
      };

      const accountRef = doc(db, 'accounts', accountId);
      setDoc(accountRef, accountData)
        .catch(async () => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: accountRef.path,
            operation: 'create',
            requestResourceData: accountData
          }));
        });

      // 3. Send email
      await sendCredentialEmail(order.email, {
        login,
        password,
        server: "PrimeFunded-Demo",
        plan: order.plan,
        size: order.size
      });

      toast({ title: "Order Verified", description: `Account created for ${order.email}` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Verification Failed", description: err.message });
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-headline font-bold mb-1">Admin Oversight</h1>
            <p className="text-muted-foreground">Manage order verification and account provisioning.</p>
          </div>
          <Badge variant="outline" className="h-8 px-4 border-primary/50 text-primary">Admin Session Active</Badge>
        </header>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-headline">Pending Verifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                    <th className="pb-4 pt-0 px-2">Order ID</th>
                    <th className="pb-4 pt-0 px-2">User</th>
                    <th className="pb-4 pt-0 px-2">Challenge</th>
                    <th className="pb-4 pt-0 px-2">Hash</th>
                    <th className="pb-4 pt-0 px-2">Status</th>
                    <th className="pb-4 pt-0 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-4 px-2 font-mono text-xs text-muted-foreground">{order.id.substring(0, 8)}...</td>
                      <td className="py-4 px-2">
                        <div className="font-semibold">{order.email}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">{order.userId.substring(0, 10)}</div>
                      </td>
                      <td className="py-4 px-2">
                        <Badge variant="secondary" className="text-[10px] uppercase">{order.plan}</Badge>
                        <div className="font-bold">{order.size}</div>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2 group cursor-pointer" title={order.txHash}>
                          <span className="font-mono text-xs max-w-[100px] truncate">{order.txHash}</span>
                          <ExternalLink className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <Badge variant={order.status === 'pending' ? 'outline' : 'default'} className={order.status === 'pending' ? 'text-primary' : 'bg-accent text-accent-foreground'}>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-2 text-right">
                        {order.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-destructive border-destructive/20" onClick={() => {}}>
                              <X className="w-4 h-4" />
                            </Button>
                            <Button size="sm" className="h-8 px-3 font-bold bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => handleVerify(order)}>
                              <Check className="w-4 h-4 mr-1" /> Approve
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && !loading && (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-muted-foreground">No orders found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
