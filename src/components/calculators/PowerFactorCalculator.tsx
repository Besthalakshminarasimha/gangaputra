import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";

const PowerFactorCalculator = () => {
  const [realPower, setRealPower] = useState("");
  const [apparentPower, setApparentPower] = useState("");
  const [result, setResult] = useState(0);

  const calculatePowerFactor = () => {
    const real = parseFloat(realPower);
    const apparent = parseFloat(apparentPower);
    if (real && apparent) {
      const pf = real / apparent;
      setResult(pf);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="real-power">Real Power (kW)</Label>
        <Input
          id="real-power"
          value={realPower}
          onChange={(e) => setRealPower(e.target.value)}
          placeholder="15"
          type="number"
        />
      </div>
      <div>
        <Label htmlFor="apparent-power">Apparent Power (kVA)</Label>
        <Input
          id="apparent-power"
          value={apparentPower}
          onChange={(e) => setApparentPower(e.target.value)}
          placeholder="20"
          type="number"
        />
      </div>
      <Button onClick={calculatePowerFactor} className="w-full">
        <Calculator className="h-4 w-4 mr-2" />
        Calculate Power Factor
      </Button>
      {result > 0 && (
        <div className="p-4 bg-primary/10 rounded-lg">
          <p className="text-lg font-bold">Power Factor: {result.toFixed(3)}</p>
          <p className="text-sm text-muted-foreground">
            {result < 0.8 ? "⚠️ Low power factor - consider installing capacitors" : "✅ Good power factor"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Efficiency: {(result * 100).toFixed(1)}%
          </p>
        </div>
      )}
    </div>
  );
};

export default PowerFactorCalculator;