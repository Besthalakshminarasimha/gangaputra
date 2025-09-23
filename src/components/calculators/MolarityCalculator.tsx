import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";

const MolarityCalculator = () => {
  const [pondVolume, setPondVolume] = useState("");
  const [targetMolarity, setTargetMolarity] = useState("");
  const [molecularWeight, setMolecularWeight] = useState("142.04"); // CaCl2·2H2O
  const [result, setResult] = useState(0);

  const calculateMolarity = () => {
    const volume = parseFloat(pondVolume);
    const molarity = parseFloat(targetMolarity);
    const mw = parseFloat(molecularWeight);
    if (volume && molarity && mw) {
      // Amount = Molarity × Volume × Molecular Weight
      const amount = molarity * volume * mw;
      setResult(amount);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="pond-volume">Pond Volume (liters)</Label>
        <Input
          id="pond-volume"
          value={pondVolume}
          onChange={(e) => setPondVolume(e.target.value)}
          placeholder="100000"
          type="number"
        />
      </div>
      <div>
        <Label htmlFor="target-molarity">Target Molarity (mM)</Label>
        <Input
          id="target-molarity"
          value={targetMolarity}
          onChange={(e) => setTargetMolarity(e.target.value)}
          placeholder="5"
          type="number"
        />
      </div>
      <div>
        <Label htmlFor="molecular-weight">Molecular Weight (g/mol)</Label>
        <Input
          id="molecular-weight"
          value={molecularWeight}
          onChange={(e) => setMolecularWeight(e.target.value)}
          placeholder="142.04"
          type="number"
        />
        <p className="text-xs text-muted-foreground mt-1">
          CaCl₂·2H₂O: 142.04, MgSO₄·7H₂O: 246.47
        </p>
      </div>
      <Button onClick={calculateMolarity} className="w-full">
        <Calculator className="h-4 w-4 mr-2" />
        Calculate Amount
      </Button>
      {result > 0 && (
        <div className="p-4 bg-primary/10 rounded-lg">
          <p className="text-lg font-bold">Required Amount: {result.toFixed(2)} grams</p>
          <p className="text-sm text-muted-foreground">
            Add {(result / 1000).toFixed(3)} kg of the compound to achieve target molarity
          </p>
        </div>
      )}
    </div>
  );
};

export default MolarityCalculator;