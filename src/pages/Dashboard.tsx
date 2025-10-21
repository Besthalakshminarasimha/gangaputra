import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Fish, 
  Zap, 
  AlertTriangle, 
  Plus, 
  Phone, 
  Users, 
  Wrench,
  TrendingUp,
  Droplets,
  Thermometer,
  MapPin,
  Cloud,
  LogOut
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [showAddFarm, setShowAddFarm] = useState(false);
  const [showAddPowerMon, setShowAddPowerMon] = useState(false);
  const [showWeatherMap, setShowWeatherMap] = useState(false);
  const [weatherLocation, setWeatherLocation] = useState("");
  const [temperature, setTemperature] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const farmStats = [
    { label: "Total Ponds", value: "12", icon: Fish, color: "text-blue-600" },
    { label: "Active Devices", value: "8", icon: Zap, color: "text-green-600" },
    { label: "Crop Progress", value: "65%", icon: TrendingUp, color: "text-purple-600" },
    { label: "Water Quality", value: "Good", icon: Droplets, color: "text-blue-500" },
  ];

  const cropData = [
    { species: "Black Tiger Shrimp", progress: 75, ponds: 6, status: "Healthy" },
    { species: "Vannamei Shrimp", progress: 60, ponds: 4, status: "Monitoring" },
    { species: "Rohu Fish", progress: 85, ponds: 2, status: "Excellent" },
  ];

  const powerMonData = [
    { device: "PowerMon-A1", amps: "12.5A", status: "Normal", location: "Pond 1-3" },
    { device: "PowerMon-B2", amps: "15.2A", status: "High", location: "Pond 4-6" },
    { device: "PowerMon-C3", amps: "8.9A", status: "Low", location: "Pond 7-9" },
  ];

  const alarms = [
    { type: "Water Quality", message: "pH level high in Pond 5", time: "2 mins ago", severity: "high" },
    { type: "Equipment", message: "Aerator maintenance due", time: "1 hour ago", severity: "medium" },
    { type: "Feed", message: "Low feed stock alert", time: "3 hours ago", severity: "low" },
  ];

  const handleAddFarm = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Farm Added",
      description: "Your new farm has been added successfully!",
    });
    setShowAddFarm(false);
  };

  const handleAddPowerMon = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "PowerMon Added",
      description: "PowerMon device has been added successfully!",
    });
    setShowAddPowerMon(false);
  };

  const handleRequestService = () => {
    toast({
      title: "Service Requested",
      description: "Our team will contact you shortly.",
    });
  };

  const handleContactAssociate = () => {
    window.location.href = "tel:+918049444057";
  };

  const handleCallSupport = () => {
    window.location.href = "tel:18001234567";
  };

  const handleWeatherCheck = async () => {
    if (!weatherLocation) {
      toast({
        title: "Enter Location",
        description: "Please enter a location to check weather.",
        variant: "destructive",
      });
      return;
    }
    
    // Simulating weather API call
    toast({
      title: "Fetching Weather",
      description: `Getting temperature for ${weatherLocation}...`,
    });
    
    // Mock temperature data
    setTimeout(() => {
      setTemperature(Math.floor(Math.random() * 15) + 20); // Random temp between 20-35°C
    }, 1000);
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark p-6 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Farm Dashboard</h1>
            <p className="text-primary-foreground/80">Welcome back! Here's your farm overview</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-primary-foreground">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Farm Stats */}
        <div className="grid grid-cols-2 gap-4">
          {farmStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-xl font-bold">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Crop Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fish className="h-5 w-5" />
                Crop Progress
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowWeatherMap(true)}>
                <Cloud className="h-4 w-4 mr-2" />
                Weather Map
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cropData.map((crop, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{crop.species}</span>
                  <Badge variant={crop.status === "Excellent" ? "default" : crop.status === "Healthy" ? "secondary" : "outline"}>
                    {crop.status}
                  </Badge>
                </div>
                <Progress value={crop.progress} className="h-2" />
                <p className="text-sm text-muted-foreground">{crop.ponds} ponds • {crop.progress}% complete</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* PowerMon Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              PowerMon Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {powerMonData.map((device, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{device.device}</p>
                  <p className="text-sm text-muted-foreground">{device.location}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{device.amps}</p>
                  <Badge variant={device.status === "Normal" ? "secondary" : device.status === "High" ? "destructive" : "outline"}>
                    {device.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Alarms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Alarms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alarms.map((alarm, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                  alarm.severity === "high" ? "text-red-500" : 
                  alarm.severity === "medium" ? "text-yellow-500" : "text-gray-500"
                }`} />
                <div className="flex-1">
                  <p className="font-medium">{alarm.type}</p>
                  <p className="text-sm text-muted-foreground">{alarm.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alarm.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button className="h-20 flex-col gap-2" onClick={() => setShowAddFarm(true)}>
            <Plus className="h-6 w-6" />
            Add Farm
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setShowAddPowerMon(true)}>
            <Zap className="h-6 w-6" />
            Add PowerMons
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={handleRequestService}>
            <Wrench className="h-6 w-6" />
            Request Service
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={handleContactAssociate}>
            <Users className="h-6 w-6" />
            Contact Associate
          </Button>
        </div>

        {/* Support */}
        <Card>
          <CardContent className="p-4">
            <Button className="w-full" size="lg" onClick={handleCallSupport}>
              <Phone className="h-5 w-5 mr-2" />
              Call Support: 1800-123-4567
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Add Farm Dialog */}
      <Dialog open={showAddFarm} onOpenChange={setShowAddFarm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Farm</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddFarm} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="farmName">Farm Name</Label>
              <Input id="farmName" placeholder="Enter farm name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="Enter location" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ponds">Number of Ponds</Label>
              <Input id="ponds" type="number" placeholder="Enter number of ponds" required />
            </div>
            <Button type="submit" className="w-full">Add Farm</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add PowerMon Dialog */}
      <Dialog open={showAddPowerMon} onOpenChange={setShowAddPowerMon}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add PowerMon Device</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPowerMon} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deviceId">Device ID</Label>
              <Input id="deviceId" placeholder="Enter device ID" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deviceLocation">Location</Label>
              <Input id="deviceLocation" placeholder="e.g., Pond 1-3" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (Amps)</Label>
              <Input id="capacity" type="number" step="0.1" placeholder="Enter capacity" required />
            </div>
            <Button type="submit" className="w-full">Add Device</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Weather Map Dialog */}
      <Dialog open={showWeatherMap} onOpenChange={setShowWeatherMap}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Weather Map</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weatherLocation">Location</Label>
              <div className="flex gap-2">
                <Input 
                  id="weatherLocation" 
                  placeholder="Enter city name" 
                  value={weatherLocation}
                  onChange={(e) => setWeatherLocation(e.target.value)}
                />
                <Button onClick={handleWeatherCheck}>
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {temperature !== null && (
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
                <CardContent className="p-6 text-center">
                  <Thermometer className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-2xl font-bold mb-2">{weatherLocation}</h3>
                  <p className="text-5xl font-bold mb-2">{temperature}°C</p>
                  <p className="text-sm text-muted-foreground">Current Temperature</p>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Humidity</p>
                      <p className="font-bold">65%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Wind Speed</p>
                      <p className="font-bold">12 km/h</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <p className="text-xs text-muted-foreground text-center">
              Enter a location to check current weather conditions
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;