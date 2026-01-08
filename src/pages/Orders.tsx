import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Package, ArrowLeft, Loader2, Clock, CheckCircle, Truck, PackageCheck, XCircle, AlertTriangle } from "lucide-react";

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  total_amount: number;
  status: string;
  shipping_address: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const Orders = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchOrders();
      
      // Subscribe to order updates
      const channel = supabase
        .channel('user-orders')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const updatedOrder = payload.new as Order;
            setOrders(prev => prev.map(o => 
              o.id === updatedOrder.id ? { ...o, ...updatedOrder, items: (updatedOrder.items as unknown) as OrderItem[] } : o
            ));
            toast({
              title: "Order Updated",
              description: `Your order status is now: ${updatedOrder.status}`,
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data?.map(order => ({
        ...order,
        items: (order.items as unknown) as OrderItem[],
      })) || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    
    setCancellingOrder(orderToCancel.id);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderToCancel.id)
        .eq('user_id', user!.id)
        .eq('status', 'pending');

      if (error) throw error;

      // Update local state
      setOrders(prev => prev.map(o => 
        o.id === orderToCancel.id ? { ...o, status: 'cancelled' } : o
      ));

      toast({
        title: "Order Cancelled",
        description: "Your order has been cancelled successfully",
      });

      // Send notification
      try {
        await supabase.functions.invoke('send-order-status-notification', {
          body: {
            orderId: orderToCancel.id,
            newStatus: 'cancelled',
            userEmail: user?.email,
            userName: user?.user_metadata?.full_name,
            orderTotal: orderToCancel.total_amount,
            itemCount: orderToCancel.items.length,
          },
        });
      } catch (notifError) {
        console.error('Error sending cancellation notification:', notifError);
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: "Error",
        description: "Failed to cancel order. Only pending orders can be cancelled.",
        variant: "destructive"
      });
    } finally {
      setCancellingOrder(null);
      setShowCancelDialog(false);
      setOrderToCancel(null);
    }
  };

  const openCancelDialog = (order: Order) => {
    setOrderToCancel(order);
    setShowCancelDialog(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <PackageCheck className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'shipped': return 'bg-purple-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'pending': return 1;
      case 'confirmed': return 2;
      case 'shipped': return 3;
      case 'delivered': return 4;
      case 'cancelled': return 0;
      default: return 0;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white hover:bg-white/20">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">My Orders</h1>
            <p className="text-white/80">Track your order history and delivery status</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-bold text-lg mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-4">Start shopping to see your orders here</p>
              <Button onClick={() => navigate('/store')}>
                Go to Store
              </Button>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-mono">
                      Order #{order.id.slice(0, 8)}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1">{order.status}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Progress */}
                {order.status !== 'cancelled' && (
                  <div className="flex items-center justify-between">
                    {['pending', 'confirmed', 'shipped', 'delivered'].map((step, index) => {
                      const progress = getStatusProgress(order.status);
                      const isCompleted = progress > index;
                      const isCurrent = progress === index + 1;
                      return (
                        <div key={step} className="flex-1 flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            isCompleted ? 'bg-green-500 text-white' :
                            isCurrent ? 'bg-primary text-primary-foreground' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {index + 1}
                          </div>
                          <span className={`text-xs mt-1 ${isCurrent ? 'font-bold' : ''}`}>
                            {step.charAt(0).toUpperCase() + step.slice(1)}
                          </span>
                          {index < 3 && (
                            <div className={`h-0.5 w-full mt-4 ${isCompleted ? 'bg-green-500' : 'bg-muted'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Items Preview */}
                <div className="space-y-2">
                  {order.items.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.name} × {item.quantity}</span>
                      <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  {order.items.length > 2 && (
                    <p className="text-xs text-muted-foreground">
                      +{order.items.length - 2} more items
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div>
                    <span className="text-sm text-muted-foreground">Total:</span>
                    <span className="font-bold text-lg ml-2">₹{order.total_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => openCancelDialog(order)}
                        disabled={cancellingOrder === order.id}
                      >
                        {cancellingOrder === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancel
                          </>
                        )}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order ID</p>
                  <p className="font-mono">{selectedOrder.id.slice(0, 8)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p>{new Date(selectedOrder.created_at).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p>{new Date(selectedOrder.updated_at).toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm bg-muted p-2 rounded">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted-foreground"> × {item.quantity}</span>
                      </div>
                      <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold mt-4 pt-3 border-t text-lg">
                  <span>Total</span>
                  <span>₹{selectedOrder.total_amount.toLocaleString()}</span>
                </div>
              </div>

              {selectedOrder.shipping_address && (
                <div className="border-t pt-4">
                  <p className="text-muted-foreground text-sm">Shipping Address</p>
                  <p className="text-sm">{selectedOrder.shipping_address}</p>
                </div>
              )}

              {selectedOrder.notes && (
                <div className="border-t pt-4">
                  <p className="text-muted-foreground text-sm">Notes</p>
                  <p className="text-sm">{selectedOrder.notes}</p>
                </div>
              )}

              {selectedOrder.status === 'pending' && (
                <div className="border-t pt-4">
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => {
                      setSelectedOrder(null);
                      openCancelDialog(selectedOrder);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Order
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cancel Order
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {orderToCancel && (
            <div className="bg-muted p-3 rounded-lg text-sm">
              <p><strong>Order ID:</strong> #{orderToCancel.id.slice(0, 8)}</p>
              <p><strong>Total:</strong> ₹{orderToCancel.total_amount.toLocaleString()}</p>
              <p><strong>Items:</strong> {orderToCancel.items.length} items</p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Order
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelOrder}
              disabled={cancellingOrder !== null}
            >
              {cancellingOrder ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Yes, Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
