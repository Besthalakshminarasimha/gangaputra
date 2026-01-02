import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Droplets, Thermometer, Gauge, Waves, Wifi, WifiOff, Save } from "lucide-react";

interface WaterParameters {
  ph: string;
  salinity: string;
  dissolvedOxygen: string;
  temperature: string;
}

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

  const handleChange = (field: keyof WaterParameters, value: string) => {
    setParameters(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const { ph, salinity, dissolvedOxygen, temperature } = parameters;
    
    if (!ph || !salinity || !dissolvedOxygen || !temperature) {
      toast({
        title: "Missing Data",
        description: "Please fill in all water parameters",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Parameters Saved",
      description: "Water parameters have been recorded successfully",
    });
  };

  const handleConnectSensor = () => {
    setConnecting(true);
    
    // Simulate sensor connection
    setTimeout(() => {
      setSensorConnected(true);
      setConnecting(false);
      
      // Simulate sensor data
      setParameters({
        ph: "7.8",
        salinity: "18.5",
        dissolvedOxygen: "5.2",
        temperature: "28.5"
      });
      
      toast({
        title: "Sensor Connected",
        description: "IoT sensor data synced successfully",
      });
    }, 2000);
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
          <Badge variant={sensorConnected ? "default" : "secondary"}>
            {sensorConnected ? (
              <>
                <Wifi className="h-3 w-3 mr-1" />
                IoT Connected
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 mr-1" />
                Manual Entry
              </>
            )}
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
                {sensorConnected 
                  ? "Receiving real-time data from sensor" 
                  : "Connect your water quality sensor"}
              </p>
            </div>
            <Button 
              variant={sensorConnected ? "destructive" : "default"}
              size="sm"
              onClick={sensorConnected ? handleDisconnectSensor : handleConnectSensor}
              disabled={connecting}
            >
              {connecting ? "Connecting..." : sensorConnected ? "Disconnect" : "Connect Sensor"}
            </Button>
          </div>
          {!sensorConnected && (
            <p className="text-xs text-muted-foreground mt-2">
              💡 Supported devices: AquaMon Pro, WaterSense IoT, Smart Pond Monitor
            </p>
          )}
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
              disabled={sensorConnected}
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
              disabled={sensorConnected}
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
              disabled={sensorConnected}
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
              disabled={sensorConnected}
            />
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Save Parameters
        </Button>
      </CardContent>
    </Card>
  );
};

export default WaterParametersForm;
