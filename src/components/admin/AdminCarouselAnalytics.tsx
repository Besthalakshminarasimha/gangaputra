import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Line,
  Legend
} from "recharts";
import { Eye, MousePointer, Share2, CalendarIcon, RefreshCw, Filter, TrendingUp } from "lucide-react";
import { format, subDays, eachDayOfInterval, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { cn } from "@/lib/utils";

interface CarouselUpdate {
  id: string;
  title: string;
  media_type: string;
  created_at: string;
}

interface AnalyticsEntry {
  update_id: string;
  view_type: string;
  created_at: string;
}

interface CarouselAnalyticsData {
  totalViews: number;
  totalClicks: number;
  totalShares: number;
  viewsByUpdate: { name: string; views: number; clicks: number }[];
  viewsByDay: { date: string; views: number; clicks: number }[];
  viewsByType: { name: string; value: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AdminCarouselAnalytics = () => {
  const [analytics, setAnalytics] = useState<CarouselAnalyticsData>({
    totalViews: 0,
    totalClicks: 0,
    totalShares: 0,
    viewsByUpdate: [],
    viewsByDay: [],
    viewsByType: [],
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

    // Fetch all carousel updates
    const { data: updates } = await supabase
      .from('admin_carousel_updates')
      .select('id, title, media_type, created_at');

    // Fetch analytics data
    const { data: analyticsData } = await supabase
      .from('carousel_analytics')
      .select('*')
      .gte('created_at', startOfDay(dateRange.from).toISOString())
      .lte('created_at', endOfDay(dateRange.to).toISOString());

    if (updates && analyticsData) {
      // Count by type
      const views = analyticsData.filter(a => a.view_type === 'view').length;
      const clicks = analyticsData.filter(a => a.view_type === 'click').length;
      const shares = analyticsData.filter(a => a.view_type === 'share').length;

      // Views by update
      const updateMap = new Map(updates.map(u => [u.id, u.title]));
      const viewsByUpdateMap: Record<string, { views: number; clicks: number }> = {};
      
      analyticsData.forEach(a => {
        const title = updateMap.get(a.update_id) || 'Unknown';
        if (!viewsByUpdateMap[title]) {
          viewsByUpdateMap[title] = { views: 0, clicks: 0 };
        }
        if (a.view_type === 'view') {
          viewsByUpdateMap[title].views++;
        } else if (a.view_type === 'click') {
          viewsByUpdateMap[title].clicks++;
        }
      });

      const viewsByUpdate = Object.entries(viewsByUpdateMap)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

      // Views by day
      const daysInRange = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      const viewsByDay = daysInRange.map((day) => {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);
        const dayData = analyticsData.filter(a => {
          const date = new Date(a.created_at);
          return isWithinInterval(date, { start: dayStart, end: dayEnd });
        });
        return {
          date: format(day, 'MMM dd'),
          views: dayData.filter(a => a.view_type === 'view').length,
          clicks: dayData.filter(a => a.view_type === 'click').length,
        };
      }).slice(-14);

      // Views by type (pie chart)
      const viewsByType = [
        { name: 'Views', value: views },
        { name: 'Clicks', value: clicks },
        { name: 'Shares', value: shares },
      ].filter(v => v.value > 0);

      setAnalytics({
        totalViews: views,
        totalClicks: clicks,
        totalShares: shares,
        viewsByUpdate,
        viewsByDay,
        viewsByType,
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
        <p className="text-center py-8 text-muted-foreground">Loading carousel analytics...</p>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Views</p>
                    <p className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</p>
                  </div>
                  <Eye className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Clicks</p>
                    <p className="text-2xl font-bold">{analytics.totalClicks.toLocaleString()}</p>
                  </div>
                  <MousePointer className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Click Rate</p>
                    <p className="text-2xl font-bold">
                      {analytics.totalViews > 0 
                        ? ((analytics.totalClicks / analytics.totalViews) * 100).toFixed(1) 
                        : 0}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Engagement by Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Engagement by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {analytics.viewsByType.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.viewsByType}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {analytics.viewsByType.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No engagement data yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Engagement Over Time */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Engagement Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.viewsByDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="views" stroke="#0088FE" strokeWidth={2} name="Views" />
                      <Line type="monotone" dataKey="clicks" stroke="#00C49F" strokeWidth={2} name="Clicks" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Updates by Engagement */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Top Updates by Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {analytics.viewsByUpdate.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.viewsByUpdate} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" fontSize={12} />
                        <YAxis dataKey="name" type="category" fontSize={12} width={150} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="views" fill="#0088FE" name="Views" />
                        <Bar dataKey="clicks" fill="#00C49F" name="Clicks" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No update data yet
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

export default AdminCarouselAnalytics;
