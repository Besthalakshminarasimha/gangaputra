import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, RefreshCw, MapPin, IndianRupee } from "lucide-react";

interface RateData { count_range: string; rate_per_kg: number; date: string }
interface LocationRates { location: string; date: string; rates: RateData[] }

const ShrimpRatesCard = () => {
  const [allRates, setAllRates] = useState<LocationRates[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fnError } = await supabase.functions.invoke("fetch-shrimp-rates");
    if (fnError || !data?.success) setError(data?.error ?? "Could not load published shrimp prices.");
    else setAllRates(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchRates(); }, []);

  const shown = selectedLocation === "all" ? allRates : allRates.filter(r => r.location === selectedLocation);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" />Daily Shrimp Rates</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchRates} disabled={loading} className="gap-1">
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />Refresh
          </Button>
        </div>
        {allRates.length > 0 && (
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="mt-2 w-[180px]"><SelectValue placeholder="Select market" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Markets</SelectItem>
              {allRates.map((loc) => <SelectItem key={loc.location} value={loc.location}>{loc.location}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
        ) : error ? (
          <p className="py-4 text-center text-sm text-destructive">{error}</p>
        ) : allRates.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No shrimp prices have been published by the admin yet.</p>
        ) : (
          <div className="space-y-4">
            {shown.map((loc) => (
              <div key={loc.location} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="flex items-center gap-1 font-semibold"><MapPin className="h-4 w-4" />{loc.location}</h4>
                  <span className="text-xs text-muted-foreground">Updated {loc.date}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {loc.rates.map((rate) => (
                    <div key={rate.count_range} className="rounded bg-muted p-2 text-center">
                      <p className="text-xs text-muted-foreground">Count {rate.count_range}</p>
                      <p className="flex items-center justify-center font-bold text-primary"><IndianRupee className="h-3 w-3" />{rate.rate_per_kg}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <p className="text-center text-xs text-muted-foreground">Admin-published market rates</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShrimpRatesCard;
