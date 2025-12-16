import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  TrendingDown,
  RefreshCw, 
  MapPin,
  IndianRupee
} from "lucide-react";

interface RateData {
  count_range: string;
  rate_per_kg: number;
}

interface LocationRates {
  location: string;
  state: string;
  date: string;
  dateISO: string;
  rates: RateData[];
  trend: 'up' | 'down';
  lastUpdated: string;
}

const ShrimpRatesCard = () => {
  const [allRates, setAllRates] = useState<LocationRates[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchRates = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('fetch-shrimp-rates');

      if (fnError) {
        console.error('Function error:', fnError);
        setError('Failed to fetch rates. Please try again.');
        return;
      }

      if (data?.success && data?.data) {
        setAllRates(data.data);
        setLastUpdated(new Date().toLocaleTimeString('en-IN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }));
      } else {
        setError(data?.error || 'Failed to load rates');
      }
    } catch (err) {
      console.error('Error fetching rates:', err);
      setError('Failed to connect. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const filteredRates = selectedLocation === "all" 
    ? allRates 
    : allRates.filter(r => r.location === selectedLocation);

  const uniqueLocations = [...new Set(allRates.map(r => r.location))];

  // Get grouped by state for summary
  const stateGroups = allRates.reduce((acc, rate) => {
    if (!acc[rate.state]) {
      acc[rate.state] = [];
    }
    acc[rate.state].push(rate);
    return acc;
  }, {} as Record<string, LocationRates[]>);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Daily Shrimp Rates
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchRates}
            disabled={loading}
            className="gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Markets</SelectItem>
              {uniqueLocations.map((loc) => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated: {lastUpdated}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-sm text-destructive text-center py-4">
            {error}
            <Button variant="outline" size="sm" onClick={fetchRates} className="ml-2">
              Retry
            </Button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : selectedLocation === "all" ? (
          // Summary view showing all states
          <div className="space-y-4">
            {Object.entries(stateGroups).map(([state, locations]) => (
              <div key={state} className="border rounded-lg p-3">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {state}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {locations.slice(0, 4).map((loc) => {
                    const avgRate = Math.round(
                      loc.rates.reduce((sum, r) => sum + r.rate_per_kg, 0) / loc.rates.length
                    );
                    return (
                      <div 
                        key={loc.location} 
                        className="bg-muted p-2 rounded text-sm cursor-pointer hover:bg-muted/80"
                        onClick={() => setSelectedLocation(loc.location)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">{loc.location}</span>
                          {loc.trend === 'up' ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                        <div className="flex items-center text-primary font-bold">
                          <IndianRupee className="h-3 w-3" />
                          {avgRate}/kg avg
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground text-center">
              AI-estimated rates • Select a market for detailed prices
            </p>
          </div>
        ) : (
          // Detailed view for selected location
          <div className="space-y-3">
            {filteredRates.map((locRate) => (
              <div key={locRate.location}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {locRate.location}
                    </h4>
                    <p className="text-xs text-muted-foreground">{locRate.state} • {locRate.date}</p>
                  </div>
                  <Badge variant={locRate.trend === 'up' ? 'default' : 'secondary'} className="gap-1">
                    {locRate.trend === 'up' ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {locRate.trend === 'up' ? 'Rising' : 'Falling'}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {locRate.rates.map((rate) => (
                    <div key={rate.count_range} className="bg-muted p-2 rounded text-center">
                      <p className="text-xs text-muted-foreground">Count {rate.count_range}</p>
                      <p className="font-bold text-primary flex items-center justify-center">
                        <IndianRupee className="h-3 w-3" />
                        {rate.rate_per_kg}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2"
              onClick={() => setSelectedLocation("all")}
            >
              View All Markets
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShrimpRatesCard;
