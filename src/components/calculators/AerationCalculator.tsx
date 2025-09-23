import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";

const AerationCalculator = () => {
  const [pondArea, setPondArea] = useState("");
  const [stockingDensity, setStockingDensity] = useState("");
  const [result, setResult] = useState(0);

  const calculateAeration = () => {
    const area = parseFloat(pondArea);
    const density = parseFloat(stockingDensity);
    if (area && density) {
      // Formula: 1 HP per 1000-1500 sq meters for intensive farming
      const aerationPower = (area * density) / 1000;
      setResult(aerationPower);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="pond-area">Pond Area (sq meters)</Label>
        <Input
          id="pond-area"
          value={pondArea}
          onChange={(e) => setPondArea(e.target.value)}
          placeholder="10000"
          type="number"
        />
      </div>
      <div>
        <Label htmlFor="stocking-density">Stocking Density (per sq meter)</Label>
        <Input
          id="stocking-density"
          value={stockingDensity}
          onChange={(e) => setStockingDensity(e.target.value)}
          placeholder="80"
          type="number"
        />
      </div>
      <Button onClick={calculateAeration} className="w-full">
        <Calculator className="h-4 w-4 mr-2" />
        Calculate Aeration
      </Button>
      {result > 0 && (
        <div className="p-4 bg-primary/10 rounded-lg">
          <p className="text-lg font-bold">Required Aeration: {result.toFixed(2)} HP</p>
          <p className="text-sm text-muted-foreground">
            Number of 1HP aerators needed: {Math.ceil(result)}
          </p>
        </div>
      )}
    </div>
  );
};

export default AerationCalculator;