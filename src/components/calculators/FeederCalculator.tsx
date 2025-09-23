import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";

const FeederCalculator = () => {
  const [feedAmount, setFeedAmount] = useState("");
  const [feedingTime, setFeedingTime] = useState("");
  const [result, setResult] = useState(0);

  const calculateFeederRate = () => {
    const amount = parseFloat(feedAmount);
    const time = parseFloat(feedingTime);
    if (amount && time) {
      const rate = amount / time; // kg per hour
      setResult(rate);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="feed-amount">Daily Feed Amount (kg)</Label>
        <Input
          id="feed-amount"
          value={feedAmount}
          onChange={(e) => setFeedAmount(e.target.value)}
          placeholder="50"
          type="number"
        />
      </div>
      <div>
        <Label htmlFor="feeding-time">Total Feeding Hours per Day</Label>
        <Input
          id="feeding-time"
          value={feedingTime}
          onChange={(e) => setFeedingTime(e.target.value)}
          placeholder="8"
          type="number"
        />
      </div>
      <Button onClick={calculateFeederRate} className="w-full">
        <Calculator className="h-4 w-4 mr-2" />
        Calculate Feeder Rate
      </Button>
      {result > 0 && (
        <div className="p-4 bg-primary/10 rounded-lg">
          <p className="text-lg font-bold">Feeder Rate: {result.toFixed(2)} kg/hour</p>
          <p className="text-sm text-muted-foreground">
            Set your auto-feeder to dispense {result.toFixed(2)} kg per hour
          </p>
        </div>
      )}
    </div>
  );
};

export default FeederCalculator;