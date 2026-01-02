import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Fish } from "lucide-react";

const SmartFeedCalculator = () => {
  const [abw, setAbw] = useState(""); // Average Body Weight in grams
  const [survivalRate, setSurvivalRate] = useState(""); // Percentage
  const [stockingDensity, setStockingDensity] = useState(""); // PL/m²
  const [pondArea, setPondArea] = useState(""); // m²
  const [species, setSpecies] = useState("vannamei");
  const [result, setResult] = useState<{
    dailyFeed: number;
    feedingFrequency: number;
    feedPerMeal: number;
    feedRate: number;
    biomass: number;
  } | null>(null);

  // Feed rate tables based on ABW and species (industry standard)
  const getFeedRate = (abw: number, species: string): number => {
    // Feed rate as percentage of body weight
    if (species === "vannamei") {
      if (abw < 1) return 15;
      if (abw < 3) return 10;
      if (abw < 5) return 7;
      if (abw < 10) return 5;
      if (abw < 15) return 4;
      if (abw < 20) return 3.5;
      return 3;
    } else if (species === "tiger") {
      if (abw < 1) return 12;
      if (abw < 5) return 8;
      if (abw < 10) return 6;
      if (abw < 20) return 4.5;
      if (abw < 30) return 3.5;
      return 3;
    } else {
      // Fish (Rohu, Tilapia, etc.)
      if (abw < 50) return 8;
      if (abw < 100) return 5;
      if (abw < 250) return 4;
      if (abw < 500) return 3;
      return 2.5;
    }
  };

  const getFeedingFrequency = (abw: number): number => {
    if (abw < 3) return 6;
    if (abw < 10) return 5;
    if (abw < 15) return 4;
    return 4;
  };

  const calculateFeed = () => {
    const abwValue = parseFloat(abw);
    const survivalValue = parseFloat(survivalRate);
    const densityValue = parseFloat(stockingDensity);
    const areaValue = parseFloat(pondArea);

    if (!abwValue || !survivalValue || !densityValue || !areaValue) {
      return;
    }

    // Calculate surviving population
    const initialStock = densityValue * areaValue;
    const survivingStock = initialStock * (survivalValue / 100);
    
    // Calculate biomass (in kg)
    const biomass = (survivingStock * abwValue) / 1000;
    
    // Get feed rate based on ABW and species
    const feedRate = getFeedRate(abwValue, species);
    
    // Calculate daily feed requirement (in kg)
    const dailyFeed = biomass * (feedRate / 100);
    
    // Get feeding frequency
    const feedingFrequency = getFeedingFrequency(abwValue);
    
    // Calculate feed per meal
    const feedPerMeal = dailyFeed / feedingFrequency;

    setResult({
      dailyFeed: Math.round(dailyFeed * 100) / 100,
      feedingFrequency,
      feedPerMeal: Math.round(feedPerMeal * 100) / 100,
      feedRate,
      biomass: Math.round(biomass)
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fish className="h-5 w-5" />
          Smart Feed Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Species</Label>
          <Select value={species} onValueChange={setSpecies}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vannamei">Vannamei Shrimp</SelectItem>
              <SelectItem value="tiger">Tiger Prawn</SelectItem>
              <SelectItem value="fish">Fish (Rohu/Tilapia)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="abw">Average Body Weight (g)</Label>
            <Input
              id="abw"
              type="number"
              step="0.1"
              placeholder="e.g., 12.5"
              value={abw}
              onChange={(e) => setAbw(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="survival">Survival Rate (%)</Label>
            <Input
              id="survival"
              type="number"
              placeholder="e.g., 85"
              value={survivalRate}
              onChange={(e) => setSurvivalRate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="density">Stocking Density (PL/m²)</Label>
            <Input
              id="density"
              type="number"
              placeholder="e.g., 60"
              value={stockingDensity}
              onChange={(e) => setStockingDensity(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="area">Pond Area (m²)</Label>
            <Input
              id="area"
              type="number"
              placeholder="e.g., 5000"
              value={pondArea}
              onChange={(e) => setPondArea(e.target.value)}
            />
          </div>
        </div>

        <Button onClick={calculateFeed} className="w-full">
          <Calculator className="h-4 w-4 mr-2" />
          Calculate Feed Requirement
        </Button>

        {result && (
          <div className="space-y-3 p-4 bg-primary/10 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Biomass</p>
                <p className="text-xl font-bold">{result.biomass.toLocaleString()} kg</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Feed Rate</p>
                <p className="text-xl font-bold">{result.feedRate}% BW</p>
              </div>
            </div>
            
            <div className="border-t pt-3">
              <p className="text-sm text-muted-foreground">Daily Feed Requirement</p>
              <p className="text-2xl font-bold text-primary">{result.dailyFeed} kg/day</p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-3">
              <div>
                <p className="text-sm text-muted-foreground">Feeding Frequency</p>
                <p className="font-bold">{result.feedingFrequency} times/day</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Per Meal</p>
                <p className="font-bold">{result.feedPerMeal} kg</p>
              </div>
            </div>

            <div className="text-xs text-muted-foreground mt-2">
              💡 Adjust feed based on water quality, weather, and check tray response
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartFeedCalculator;
