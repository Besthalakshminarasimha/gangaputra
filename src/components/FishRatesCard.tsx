import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Fish, RefreshCw, MapPin, IndianRupee } from "lucide-react";

interface FishRate { species: string; rate_per_kg: number; date: string }
interface LocationRates { location: string; state: string; date: string; rates: FishRate[] }

const FishRatesCard = () => {
  const [data, setData] = useState<LocationRates[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = async () => {
    setLoading(true);
    setError(null);
    const { data: res, error: fnError } = await supabase.functions.invoke("fetch-fish-rates");
    if (fnError || !res?.success) setError(res?.error ?? "Could not load published fish prices.");
    else setData(res.data);
    setLoading(false);
  };
  useEffect(() => { fetchRates(); }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Fish className="h-5 w-5" /> Daily Fish Rates</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchRates} disabled={loading} aria-label="Refresh fish rates">
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-20" />)}</div>
        ) : error ? (
          <p className="py-4 text-center text-sm text-destructive">{error}</p>
        ) : data.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No fish prices have been published by the admin yet.</p>
        ) : (
          <div className="max-h-96 space-y-3 overflow-y-auto">
            {data.map((loc) => (
              <div key={`${loc.location}-${loc.state}`} className="rounded-lg border p-3">
                <h4 className="mb-2 flex items-center gap-1 text-sm font-semibold"><MapPin className="h-3 w-3" />{loc.location}{loc.state ? `, ${loc.state}` : ""}</h4>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {loc.rates.map(r => (
                    <div key={r.species} className="rounded bg-muted p-1.5 text-xs">
                      <div className="truncate text-muted-foreground">{r.species}</div>
                      <div className="flex items-center font-bold"><IndianRupee className="h-3 w-3" />{r.rate_per_kg}/kg</div>
                      <div className="text-[10px] text-muted-foreground">{r.date}</div>
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

export default FishRatesCard;
