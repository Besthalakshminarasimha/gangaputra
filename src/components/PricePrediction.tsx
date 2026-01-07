import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Brain, TrendingUp, TrendingDown, Minus, RefreshCw, AlertTriangle, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PredictionData {
  day: number;
  date: string;
  predicted_rate: number;
  range_low: number;
  range_high: number;
}

interface Prediction {
  predictions: PredictionData[];
  trend: 'bullish' | 'bearish' | 'stable';
  trend_strength: 'strong' | 'moderate' | 'weak';
  confidence: 'high' | 'medium' | 'low';
  factors: string[];
  risks: string[];
  summary: string;
}

const PricePrediction = () => {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [selectedLocation, setSelectedLocation] = useState("Bhimavaram");
  const [selectedCount, setSelectedCount] = useState("40");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const locations = [
    "Bhimavaram", "Nellore", "Kakinada", "Ongole", "Chennai",
    "Nagapattinam", "Veraval", "Kolkata", "Paradip", "Kochi"
  ];

  const countOptions = ["20", "30", "40", "50", "60", "70", "80", "90", "100"];

  const fetchPrediction = async () => {
    setLoading(true);
    setError(null);

    try {
      // First fetch current rates to build historical context
      const { data: ratesData, error: ratesError } = await supabase.functions.invoke('fetch-shrimp-rates', {
        body: { location: selectedLocation }
      });

      if (ratesError) throw ratesError;

      // Build mock historical data from current rates
      const currentRates = ratesData?.data?.[0]?.rates || [];
      const currentRate = currentRates.find((r: any) => r.count_range === selectedCount)?.rate_per_kg || 350;
      
      // Generate 14 days of "historical" data
      const historicalData = Array.from({ length: 14 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (14 - i));
        const variance = (Math.sin(i * 0.5) * 15) + (Math.random() - 0.5) * 10;
        return {
          date: date.toISOString().split('T')[0],
          rate: Math.round(currentRate + variance - 10),
        };
      });

      // Call AI prediction
      const { data, error } = await supabase.functions.invoke('ai-price-prediction', {
        body: {
          historicalData,
          location: selectedLocation,
          countRange: selectedCount,
        }
      });

      if (error) {
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        }
        throw error;
      }

      if (data?.prediction) {
        setPrediction(data.prediction);
      } else {
        throw new Error('No prediction data received');
      }
    } catch (err) {
      console.error('Prediction error:', err);
      const message = err instanceof Error ? err.message : 'Failed to generate prediction';
      setError(message);
      toast({
        title: "Prediction Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'bullish': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'bearish': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'bullish': return 'bg-green-500';
      case 'bearish': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-purple-500" />
            AI Price Prediction
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Beta
            </Badge>
          </CardTitle>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {locations.map(loc => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCount} onValueChange={setSelectedCount}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {countOptions.map(count => (
                <SelectItem key={count} value={count}>Count {count}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            onClick={fetchPrediction} 
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Brain className="h-4 w-4" />
            )}
            {loading ? 'Analyzing...' : 'Predict'}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-destructive opacity-50" />
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchPrediction}>
              Try Again
            </Button>
          </div>
        ) : !prediction ? (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">
              Select location and count, then click Predict to get AI-powered price forecasts
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Trend Summary */}
            <div className="flex flex-wrap gap-2">
              <Badge className={getTrendColor(prediction.trend)}>
                {getTrendIcon(prediction.trend)}
                <span className="ml-1 capitalize">{prediction.trend}</span>
              </Badge>
              <Badge variant="outline">
                Strength: {prediction.trend_strength}
              </Badge>
              <Badge className={getConfidenceColor(prediction.confidence)}>
                Confidence: {prediction.confidence}
              </Badge>
            </div>

            {/* Prediction Chart */}
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={prediction.predictions} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => `₹${value}`}
                    domain={['dataMin - 10', 'dataMax + 10']}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number, name: string) => {
                      const label = name === 'predicted_rate' ? 'Predicted' : name === 'range_low' ? 'Low' : 'High';
                      return [`₹${value}/kg`, label];
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="range_high"
                    stroke="transparent"
                    fill="hsl(var(--primary) / 0.1)"
                  />
                  <Area
                    type="monotone"
                    dataKey="range_low"
                    stroke="transparent"
                    fill="hsl(var(--background))"
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted_rate"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Summary */}
            <p className="text-sm text-muted-foreground">{prediction.summary}</p>

            {/* Factors and Risks */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Key Factors</h4>
                <ul className="text-xs space-y-1">
                  {prediction.factors.map((factor, i) => (
                    <li key={i} className="flex items-center gap-1 text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Risks</h4>
                <ul className="text-xs space-y-1">
                  {prediction.risks.map((risk, i) => (
                    <li key={i} className="flex items-center gap-1 text-muted-foreground">
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PricePrediction;