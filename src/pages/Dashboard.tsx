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
import { supabase } from "@/integrations/supabase/client";
import ShrimpRatesCard from "@/components/ShrimpRatesCard";
import TradeSection from "@/components/TradeSection";
import MyTradeRequests from "@/components/MyTradeRequests";
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
  LogOut,
  User
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [showAddFarm, setShowAddFarm] = useState(false);
  const [showAddPowerMon, setShowAddPowerMon] = useState(false);
  const [showWeatherMap, setShowWeatherMap] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [weatherLocation, setWeatherLocation] = useState("");
  const [temperature, setTemperature] = useState<number | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [farms, setFarms] = useState<any[]>([]);
  const [powerMonDevices, setPowerMonDevices] = useState<any[]>([]);
  const [shrimpRates, setShrimpRates] = useState<any[]>([]); // Kept for backward compatibility
  const [farmName, setFarmName] = useState("");
  const [farmLocation, setFarmLocation] = useState("");
  const [farmPonds, setFarmPonds] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [deviceLocation, setDeviceLocation] = useState("");
  const [deviceCapacity, setDeviceCapacity] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
    
    if (user) {
      fetchProfile();
      fetchFarms();
      fetchPowerMonDevices();
      // Removed fetchShrimpRates() - now handled by ShrimpRatesCard component
    }
  }, [user, loading, navigate]);
  
  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
    } else {
      setProfile(data);
    }
  };

  const fetchFarms = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error fetching farms:', error);
    } else {
      setFarms(data || []);
    }
  };

  const fetchPowerMonDevices = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('powermon_devices')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error fetching PowerMon devices:', error);
    } else {
      setPowerMonDevices(data || []);
    }
  };

  const fetchShrimpRates = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const { data, error } = await supabase
        .from('shrimp_rates' as any)
        .select('*')
        .eq('location', 'Bhimavaram')
        .eq('date', today)
        .order('count_range');
      
      if (error) {
        console.error('Error fetching shrimp rates:', error);
      } else {
        setShrimpRates(data || []);
      }
    } catch (error) {
      console.error('Error fetching shrimp rates:', error);
    }
  };

  const totalPonds = farms.reduce((sum, farm) => sum + farm.number_of_ponds, 0);
  const activeDevices = powerMonDevices.length;

  const farmStats = [
    { label: "Total Ponds", value: totalPonds.toString(), icon: Fish, color: "text-blue-600" },
    { label: "Active Devices", value: activeDevices.toString(), icon: Zap, color: "text-green-600" },
    { label: "Total Farms", value: farms.length.toString(), icon: TrendingUp, color: "text-purple-600" },
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
    { type: "Water Quality", message: "pH level monitoring active", time: "2 mins ago", severity: "low" },
    { type: "Equipment", message: "All systems operational", time: "1 hour ago", severity: "low" },
    { type: "Feed", message: "Feed stock normal", time: "3 hours ago", severity: "low" },
  ];

  const handleAddFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    const { error } = await supabase
      .from('farms')
      .insert({
        user_id: user.id,
        farm_name: farmName,
        location: farmLocation,
        number_of_ponds: parseInt(farmPonds)
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add farm. Please try again.",
        variant: "destructive",
      });
      console.error('Error adding farm:', error);
    } else {
      toast({
        title: "Farm Added",
        description: "Your new farm has been added successfully!",
      });
      setShowAddFarm(false);
      setFarmName("");
      setFarmLocation("");
      setFarmPonds("");
      fetchFarms();
    }
  };

  const handleAddPowerMon = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    const { error } = await supabase
      .from('powermon_devices')
      .insert({
        user_id: user.id,
        device_id: deviceId,
        location: deviceLocation,
        capacity: parseFloat(deviceCapacity),
        current_amps: 0,
        status: 'Normal'
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add PowerMon device. Please try again.",
        variant: "destructive",
      });
      console.error('Error adding PowerMon:', error);
    } else {
      toast({
        title: "PowerMon Added",
        description: "PowerMon device has been added successfully!",
      });
      setShowAddPowerMon(false);
      setDeviceId("");
      setDeviceLocation("");
      setDeviceCapacity("");
      fetchPowerMonDevices();
    }
  };

  const handleRequestService = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('service_requests')
      .insert({
        user_id: user.id,
        status: 'pending'
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to submit service request. Please try again.",
        variant: "destructive",
      });
      console.error('Error requesting service:', error);
    } else {
      toast({
        title: "Service Requested",
        description: "Our team will contact you shortly.",
      });
    }
  };

  const handleContactAssociate = () => {
    window.location.href = "tel:+918049444057";
  };

  const handleCallSupport = () => {
    window.location.href = "tel:7569373499";
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
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/profile")} 
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout} 
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
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
              <Button size="sm" variant="outline" onClick={() => window.open('https://zoom.earth/maps/temperature/#view=28.2,84.6,4.66z/model=icon', '_blank')}>
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
            {powerMonDevices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No PowerMon devices added yet. Click "Add PowerMons" to get started.
              </p>
            ) : (
              powerMonDevices.map((device, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{device.device_id}</p>
                    <p className="text-sm text-muted-foreground">{device.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{device.current_amps || 0}A</p>
                    <Badge variant={device.status === "Normal" ? "secondary" : device.status === "High" ? "destructive" : "outline"}>
                      {device.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Shrimp Rates - New Pan-India Component */}
        <ShrimpRatesCard />

        {/* Trade Section */}
        <TradeSection />

        {/* My Trade Requests */}
        <MyTradeRequests />

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
              Call Support: 7569373499
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
              <Input 
                id="farmName" 
                placeholder="Enter farm name" 
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input 
                id="location" 
                placeholder="Enter location" 
                value={farmLocation}
                onChange={(e) => setFarmLocation(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ponds">Number of Ponds</Label>
              <Input 
                id="ponds" 
                type="number" 
                placeholder="Enter number of ponds" 
                value={farmPonds}
                onChange={(e) => setFarmPonds(e.target.value)}
                required 
              />
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
              <Input 
                id="deviceId" 
                placeholder="Enter device ID" 
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deviceLocation">Location</Label>
              <Input 
                id="deviceLocation" 
                placeholder="e.g., Pond 1-3" 
                value={deviceLocation}
                onChange={(e) => setDeviceLocation(e.target.value)}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (Amps)</Label>
              <Input 
                id="capacity" 
                type="number" 
                step="0.1" 
                placeholder="Enter capacity" 
                value={deviceCapacity}
                onChange={(e) => setDeviceCapacity(e.target.value)}
                required 
              />
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

      {/* Profile Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-10 w-10 text-primary" />
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label className="text-sm text-muted-foreground">Email</Label>
                <p className="text-base font-medium">{user?.email}</p>
              </div>
              
              <div>
                <Label className="text-sm text-muted-foreground">Full Name</Label>
                <p className="text-base font-medium">{profile?.full_name || "Not set"}</p>
              </div>
              
              <div>
                <Label className="text-sm text-muted-foreground">User ID</Label>
                <p className="text-xs font-mono bg-muted p-2 rounded break-all">{user?.id}</p>
              </div>
              
              <div>
                <Label className="text-sm text-muted-foreground">Account Created</Label>
                <p className="text-base">
                  {profile?.created_at 
                    ? new Date(profile.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : "N/A"
                  }
                </p>
              </div>
            </div>

            <div className="pt-4 flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowProfile(false)}
              >
                Close
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;