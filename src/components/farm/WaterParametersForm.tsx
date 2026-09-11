import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Droplets, Thermometer, Gauge, Waves, WifiOff, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WaterParameters {
  ph: string;
  salinity: string;
  dissolvedOxygen: string;
  temperature: string;
}

type Pond = { id: string; pond_name: string };

const WaterParametersForm = () => {
  const [parameters, setParameters] = useState<WaterParameters>({
    ph: "",
    salinity: "",
    dissolvedOxygen: "",
    temperature: ""
  });
  const [sensorConnected, setSensorConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [selectedPondId, setSelectedPondId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const loadPonds = async () => {
      const { data, error } = await supabase.from("ponds").select("id, pond_name").eq("user_id", user.id).order("created_at");
      if (error) {
        console.error("Unable to load ponds for water logging", error);
        return;
      }
      const nextPonds = data ?? [];
      setPonds(nextPonds);
      setSelectedPondId((current) => current || nextPonds[0]?.id || "");
    };
    void loadPonds();
  }, [user]);

  const handleChange = (field: keyof WaterParameters, value: string) => {
    setParameters(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const { ph, salinity, dissolvedOxygen, temperature } = parameters;
    
    if (!ph || !salinity || !dissolvedOxygen || !temperature) {
      toast({
        title: "Missing Data",
        description: "Please fill in all water parameters",
        variant: "destructive"
      });
      return;
    }

    if (!user || !selectedPondId) {
      toast({ title: "Choose a pond", description: "Add and select a pond before recording water quality.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("water_quality_logs").insert({
      pond_id: selectedPondId,
      user_id: user.id,
      ph: Number(ph),
      salinity: Number(salinity),
      dissolved_oxygen: Number(dissolvedOxygen),
      temperature: Number(temperature),
      source: "manual",
    });
    setSaving(false);

    if (error) {
      toast({ title: "Water reading could not be saved", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: "Parameters Saved",
      description: "Water parameters have been recorded successfully",
    });
  };

  const handleConnectSensor = () => {
    toast({
      title: "Sensor integration unavailable",
      description: "No supported sensor connection is configured. Enter a measured reading manually.",
      variant: "destructive",
    });
  };

  const handleDisconnectSensor = () => {
    setSensorConnected(false);
    toast({
      title: "Sensor Disconnected",
      description: "Manual entry mode enabled",
    });
  };

  const getPhStatus = (ph: number) => {
    if (ph >= 7.5 && ph <= 8.5) return { status: "Optimal", color: "bg-green-500" };
    if (ph >= 7.0 && ph < 7.5) return { status: "Low", color: "bg-yellow-500" };
    if (ph > 8.5 && ph <= 9.0) return { status: "High", color: "bg-yellow-500" };
    return { status: "Critical", color: "bg-red-500" };
  };

  const getDOStatus = (DO: number) => {
    if (DO >= 5) return { status: "Good", color: "bg-green-500" };
    if (DO >= 4 && DO < 5) return { status: "Low", color: "bg-yellow-500" };
    return { status: "Critical", color: "bg-red-500" };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            Water Parameters
          </div>
          <Badge variant="secondary">
            <WifiOff className="h-3 w-3 mr-1" />
            Manual Entry
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* IoT Sensor Connection */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-medium">IoT Sensor Integration</p>
              <p className="text-sm text-muted-foreground">
                Record measured water quality for a selected pond
              </p>
            </div>
            <Button 
              variant={sensorConnected ? "destructive" : "default"}
              size="sm"
              onClick={sensorConnected ? handleDisconnectSensor : handleConnectSensor}
              disabled={connecting}
            >
              {connecting ? "Checking..." : "Check Sensor"}
            </Button>
          </div>
          {!sensorConnected && (
            <p className="text-xs text-muted-foreground mt-2">
              No sensor is connected. Values are saved as manual readings.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="water-pond">Pond</Label>
          <Select value={selectedPondId} onValueChange={setSelectedPondId}>
            <SelectTrigger id="water-pond"><SelectValue placeholder="Choose a pond" /></SelectTrigger>
            <SelectContent>{ponds.map((pond) => <SelectItem key={pond.id} value={pond.id}>{pond.pond_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {/* Parameter Inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ph" className="flex items-center gap-1">
              <Gauge className="h-4 w-4" />
              pH Level
            </Label>
            <Input
              id="ph"
              type="number"
              step="0.1"
              placeholder="7.5 - 8.5"
              value={parameters.ph}
              onChange={(e) => handleChange("ph", e.target.value)}
               disabled={false}
            />
            {parameters.ph && (
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getPhStatus(parseFloat(parameters.ph)).color}`} />
                <span className="text-xs">{getPhStatus(parseFloat(parameters.ph)).status}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="salinity" className="flex items-center gap-1">
              <Waves className="h-4 w-4" />
              Salinity (ppt)
            </Label>
            <Input
              id="salinity"
              type="number"
              step="0.1"
              placeholder="15 - 25"
              value={parameters.salinity}
              onChange={(e) => handleChange("salinity", e.target.value)}
               disabled={false}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="do" className="flex items-center gap-1">
              <Droplets className="h-4 w-4" />
              Dissolved Oxygen (mg/L)
            </Label>
            <Input
              id="do"
              type="number"
              step="0.1"
              placeholder="≥ 5.0"
              value={parameters.dissolvedOxygen}
              onChange={(e) => handleChange("dissolvedOxygen", e.target.value)}
               disabled={false}
            />
            {parameters.dissolvedOxygen && (
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getDOStatus(parseFloat(parameters.dissolvedOxygen)).color}`} />
                <span className="text-xs">{getDOStatus(parseFloat(parameters.dissolvedOxygen)).status}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="temperature" className="flex items-center gap-1">
              <Thermometer className="h-4 w-4" />
              Temperature (°C)
            </Label>
            <Input
              id="temperature"
              type="number"
              step="0.1"
              placeholder="26 - 32"
              value={parameters.temperature}
              onChange={(e) => handleChange("temperature", e.target.value)}
               disabled={false}
            />
          </div>
        </div>

        <Button onClick={handleSave} className="w-full" disabled={saving || !selectedPondId}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Parameters"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default WaterParametersForm;
