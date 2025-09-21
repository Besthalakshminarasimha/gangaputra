import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Thermometer
} from "lucide-react";

const Dashboard = () => {
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

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark p-6 text-primary-foreground">
        <h1 className="text-2xl font-bold mb-2">Farm Dashboard</h1>
        <p className="text-primary-foreground/80">Welcome back! Here's your farm overview</p>
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
            <CardTitle className="flex items-center gap-2">
              <Fish className="h-5 w-5" />
              Crop Progress
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
          <Button className="h-20 flex-col gap-2">
            <Plus className="h-6 w-6" />
            Add Farm
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2">
            <Zap className="h-6 w-6" />
            Add PowerMons
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2">
            <Wrench className="h-6 w-6" />
            Request Service
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2">
            <Users className="h-6 w-6" />
            Contact Associate
          </Button>
        </div>

        {/* Support */}
        <Card>
          <CardContent className="p-4">
            <Button className="w-full" size="lg">
              <Phone className="h-5 w-5 mr-2" />
              Call Support: 1800-XXX-XXXX
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;