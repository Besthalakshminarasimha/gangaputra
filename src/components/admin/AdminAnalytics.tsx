import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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
import { TrendingUp, Package, IndianRupee, CalendarIcon, RefreshCw, Filter } from "lucide-react";
import { format, subDays, isWithinInterval, eachDayOfInterval, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  requestsByStatus: { name: string; value: number }[];
  requestsByDay: { date: string; count: number }[];
  usersByDay: { date: string; count: number }[];
  topCrops: { name: string; value: number }[];
  topDistricts: { name: string; value: number }[];
  totalValue: number;
  avgRequestSize: number;
  totalRequests: number;
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
    totalRequests: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);

    // Fetch all requests
    const { data: requests } = await supabase
      .from('sell_crop_requests')
      .select('*')
      .gte('created_at', startOfDay(dateRange.from).toISOString())
      .lte('created_at', endOfDay(dateRange.to).toISOString())
      .order('created_at', { ascending: true });

    // Fetch all profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .gte('created_at', startOfDay(dateRange.from).toISOString())
      .lte('created_at', endOfDay(dateRange.to).toISOString())
      .order('created_at', { ascending: true });

    if (requests) {
      // Status breakdown
      const statusCount: Record<string, number> = {};
      requests.forEach(r => {
        statusCount[r.status] = (statusCount[r.status] || 0) + 1;
      });
      const requestsByStatus = Object.entries(statusCount).map(([name, value]) => ({ name, value }));

      // Generate days in the range
      const daysInRange = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      const dayLabels = daysInRange.map(d => format(d, 'MMM dd'));
      
      // Requests by day
      const requestsByDay = dayLabels.map((dateStr, index) => {
        const dayStart = startOfDay(daysInRange[index]);
        const dayEnd = endOfDay(daysInRange[index]);
        const count = requests.filter(r => {
          const rDate = new Date(r.created_at);
          return isWithinInterval(rDate, { start: dayStart, end: dayEnd });
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
      const usersByDay = dayLabels.map((dateStr, index) => {
        const dayStart = startOfDay(daysInRange[index]);
        const dayEnd = endOfDay(daysInRange[index]);
        const count = (profiles || []).filter(p => {
          const pDate = new Date(p.created_at);
          return isWithinInterval(pDate, { start: dayStart, end: dayEnd });
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
        totalRequests: requests.length,
      });
    }

    setIsLoading(false);
  };

  const handleQuickRange = (days: number) => {
    setDateRange({
      from: subDays(new Date(), days),
      to: new Date(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Date Range:</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-[130px]">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.from, "MMM dd, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <span className="text-muted-foreground">to</span>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-[130px]">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateRange.to, "MMM dd, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={() => handleQuickRange(7)}>Last 7 days</Button>
              <Button variant="ghost" size="sm" onClick={() => handleQuickRange(30)}>Last 30 days</Button>
              <Button variant="ghost" size="sm" onClick={() => handleQuickRange(90)}>Last 90 days</Button>
            </div>

            <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-center py-8 text-muted-foreground">Loading analytics...</p>
      ) : (
        <>
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
                    <p className="text-sm text-muted-foreground">Total Requests</p>
                    <p className="text-2xl font-bold">{analytics.totalRequests}</p>
                  </div>
                  <CalendarIcon className="h-8 w-8 text-orange-500" />
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
                  {analytics.requestsByStatus.length > 0 ? (
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
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No data for selected period
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Requests Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Requests Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.requestsByDay.slice(-14)}>
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
                  {analytics.topCrops.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.topCrops} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" fontSize={12} />
                        <YAxis dataKey="name" type="category" fontSize={12} width={80} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#00C49F" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No data for selected period
                    </div>
                  )}
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
                  {analytics.topDistricts.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.topDistricts} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" fontSize={12} />
                        <YAxis dataKey="name" type="category" fontSize={12} width={100} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#FFBB28" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No data for selected period
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAnalytics;
