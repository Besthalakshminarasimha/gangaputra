import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { TrendingUp, TrendingDown, Package, Users, IndianRupee, Calendar } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface AnalyticsData {
  requestsByStatus: { name: string; value: number }[];
  requestsByDay: { date: string; count: number }[];
  usersByDay: { date: string; count: number }[];
  topCrops: { name: string; value: number }[];
  topDistricts: { name: string; value: number }[];
  totalValue: number;
  avgRequestSize: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    requestsByStatus: [],
    requestsByDay: [],
    usersByDay: [],
    topCrops: [],
    topDistricts: [],
    totalValue: 0,
    avgRequestSize: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);

    // Fetch all requests
    const { data: requests } = await supabase
      .from('sell_crop_requests')
      .select('*')
      .order('created_at', { ascending: true });

    // Fetch all profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (requests) {
      // Status breakdown
      const statusCount: Record<string, number> = {};
      requests.forEach(r => {
        statusCount[r.status] = (statusCount[r.status] || 0) + 1;
      });
      const requestsByStatus = Object.entries(statusCount).map(([name, value]) => ({ name, value }));

      // Requests by day (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return format(date, 'MMM dd');
      });
      const requestsByDay = last7Days.map(dateStr => {
        const count = requests.filter(r => {
          const rDate = format(new Date(r.created_at), 'MMM dd');
          return rDate === dateStr;
        }).length;
        return { date: dateStr, count };
      });

      // Top crops
      const cropCount: Record<string, number> = {};
      requests.forEach(r => {
        cropCount[r.crop_type] = (cropCount[r.crop_type] || 0) + 1;
      });
      const topCrops = Object.entries(cropCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

      // Top districts
      const districtCount: Record<string, number> = {};
      requests.forEach(r => {
        districtCount[r.district] = (districtCount[r.district] || 0) + 1;
      });
      const topDistricts = Object.entries(districtCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

      // Total estimated value
      const totalValue = requests.reduce((sum, r) => sum + (r.total_value_estimate || 0), 0);
      const avgRequestSize = requests.length > 0 
        ? requests.reduce((sum, r) => sum + r.quantity_tons, 0) / requests.length 
        : 0;

      // Users by day
      const usersByDay = last7Days.map(dateStr => {
        const count = (profiles || []).filter(p => {
          const pDate = format(new Date(p.created_at), 'MMM dd');
          return pDate === dateStr;
        }).length;
        return { date: dateStr, count };
      });

      setAnalytics({
        requestsByStatus,
        requestsByDay,
        usersByDay,
        topCrops,
        topDistricts,
        totalValue,
        avgRequestSize,
      });
    }

    setIsLoading(false);
  };

  if (isLoading) {
    return <p className="text-center py-8 text-muted-foreground">Loading analytics...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Est. Total Value</p>
                <p className="text-2xl font-bold">₹{analytics.totalValue.toLocaleString()}</p>
              </div>
              <IndianRupee className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Request Size</p>
                <p className="text-2xl font-bold">{analytics.avgRequestSize.toFixed(1)} tons</p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top Crop</p>
                <p className="text-2xl font-bold">{analytics.topCrops[0]?.name || "N/A"}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top District</p>
                <p className="text-2xl font-bold">{analytics.topDistricts[0]?.name || "N/A"}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Requests by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.requestsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.requestsByStatus.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Requests Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Requests (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.requestsByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#0088FE" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Crops */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Crops</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topCrops} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" fontSize={12} />
                  <YAxis dataKey="name" type="category" fontSize={12} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Districts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Districts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.topDistricts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" fontSize={12} />
                  <YAxis dataKey="name" type="category" fontSize={12} width={100} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#FFBB28" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
