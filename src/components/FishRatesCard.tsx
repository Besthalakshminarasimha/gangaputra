import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Fish, RefreshCw, MapPin, IndianRupee, TrendingUp, TrendingDown } from "lucide-react";

interface FishRate { species: string; rate_per_kg: number; }
interface LocationRates {
  location: string; state: string; date: string; trend: 'up' | 'down'; rates: FishRate[];
}

const FishRatesCard = () => {
  const [data, setData] = useState<LocationRates[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRates = async () => {
    setLoading(true);
    const { data: res } = await supabase.functions.invoke("fetch-fish-rates");
    if (res?.success) setData(res.data);
    setLoading(false);
  };
  useEffect(() => { fetchRates(); }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Fish className="h-5 w-5" /> Daily Fish Rates</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchRates} disabled={loading}>
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data.map((loc) => (
              <div key={loc.location} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm flex items-center gap-1"><MapPin className="h-3 w-3" />{loc.location}, {loc.state}</h4>
                  <Badge variant={loc.trend === 'up' ? 'default' : 'secondary'} className="gap-1 text-xs">
                    {loc.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {loc.trend}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {loc.rates.map(r => (
                    <div key={r.species} className="bg-muted p-1.5 rounded text-xs">
                      <div className="truncate text-muted-foreground">{r.species}</div>
                      <div className="font-bold flex items-center"><IndianRupee className="h-3 w-3" />{r.rate_per_kg}/kg</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FishRatesCard;
