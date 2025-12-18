import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Package, Calendar, MapPin, Phone, Clock } from "lucide-react";

interface TradeRequest {
  id: string;
  crop_type: string;
  count: number;
  quantity_tons: number;
  pickup_date: string;
  state: string;
  district: string;
  address: string;
  phone_number: string | null;
  preferred_contact_time: string | null;
  expected_price_per_kg: number | null;
  status: string;
  created_at: string;
  admin_notes: string | null;
}

const MyTradeRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TradeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('sell_crop_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching trade requests:', error);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Confirmed</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-600">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            My Trade Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          My Trade Requests
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No trade requests yet. Use "Sell Crop" to submit your first request.
          </p>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{request.crop_type}</h3>
                  <p className="text-sm text-muted-foreground">
                    Count: {request.count} • {request.quantity_tons} Tons
                  </p>
                </div>
                {getStatusBadge(request.status)}
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(request.pickup_date).toLocaleDateString('en-IN')}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{request.district}, {request.state}</span>
                </div>
                {request.phone_number && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{request.phone_number}</span>
                  </div>
                )}
                {request.expected_price_per_kg && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-medium">₹{request.expected_price_per_kg}/kg</span>
                  </div>
                )}
              </div>

              {request.admin_notes && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-2">
                  <p className="text-sm text-blue-800">
                    <strong>Admin Note:</strong> {request.admin_notes}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                <Clock className="h-3 w-3" />
                <span>Submitted: {new Date(request.created_at).toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default MyTradeRequests;
