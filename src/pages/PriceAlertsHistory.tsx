import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Bell, 
  Calendar,
  IndianRupee,
  Filter,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";

interface PriceAlertData {
  location: string;
  count: string;
  previousRate: number;
  currentRate: number;
  changePercent: number;
  direction: 'up' | 'down';
}

interface PriceAlertNotification {
  id: string;
  title: string;
  message: string;
  data: PriceAlertData | null;
  is_read: boolean | null;
  created_at: string;
}

const PriceAlertsHistory = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [alerts, setAlerts] = useState<PriceAlertNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [filterDirection, setFilterDirection] = useState<string>("all");

  const locations = [
    "all", "Bhimavaram", "Nellore", "Kakinada", "Ongole", "Chennai",
    "Nagapattinam", "Veraval", "Kolkata", "Paradip", "Kochi"
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const fetchPriceAlerts = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'price_alert')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching price alerts:', error);
    } else {
      // Cast data to our interface - data field contains the price alert info
      const alertsData = (data || []).map(item => ({
        ...item,
        data: item.data as unknown as PriceAlertData | null
      }));
      setAlerts(alertsData);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchPriceAlerts();
    }
  }, [user]);

  const filteredAlerts = alerts.filter(alert => {
    const alertData = alert.data;
    if (!alertData) return false;
    
    const matchesLocation = filterLocation === "all" || alertData.location === filterLocation;
    const matchesDirection = filterDirection === "all" || alertData.direction === filterDirection;
    
    return matchesLocation && matchesDirection;
  });

  // Calculate statistics
  const stats = {
    total: alerts.length,
    increases: alerts.filter(a => a.data?.direction === 'up').length,
    decreases: alerts.filter(a => a.data?.direction === 'down').length,
    avgChange: alerts.length > 0 
      ? Math.round(alerts.reduce((sum, a) => sum + Math.abs(a.data?.changePercent || 0), 0) / alerts.length * 10) / 10
      : 0,
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Price Alerts History</h1>
              <p className="text-sm text-muted-foreground">Track shrimp price changes over time</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Alerts</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Price Increases</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-green-600">{stats.increases}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-sm text-muted-foreground">Price Decreases</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-red-600">{stats.decreases}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Avg Change</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.avgChange}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Select value={filterLocation} onValueChange={setFilterLocation}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(loc => (
                    <SelectItem key={loc} value={loc}>
                      {loc === "all" ? "All Locations" : loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterDirection} onValueChange={setFilterDirection}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Changes</SelectItem>
                  <SelectItem value="up">Increases Only</SelectItem>
                  <SelectItem value="down">Decreases Only</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                size="icon"
                onClick={fetchPriceAlerts}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alerts Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Alert History
              <Badge variant="secondary" className="ml-2">
                {filteredAlerts.length} alerts
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No price alerts yet</p>
                <p className="text-sm mt-1">
                  You'll receive alerts when shrimp prices change by 5% or more
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Count</TableHead>
                      <TableHead className="text-right">Previous</TableHead>
                      <TableHead className="text-right">Current</TableHead>
                      <TableHead className="text-right">Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAlerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {format(new Date(alert.created_at), 'MMM d, yyyy')}
                          <span className="block text-xs text-muted-foreground">
                            {format(new Date(alert.created_at), 'h:mm a')}
                          </span>
                        </TableCell>
                        <TableCell>{alert.data?.location || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{alert.data?.count || '-'}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{alert.data?.previousRate || 0}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{alert.data?.currentRate || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            className={`gap-1 ${
                              alert.data?.direction === 'up' 
                                ? 'bg-green-500 hover:bg-green-600' 
                                : 'bg-red-500 hover:bg-red-600'
                            }`}
                          >
                            {alert.data?.direction === 'up' ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {alert.data?.changePercent > 0 ? '+' : ''}
                            {alert.data?.changePercent || 0}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PriceAlertsHistory;