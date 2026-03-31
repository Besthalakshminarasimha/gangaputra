import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Fish, 
  MapPin, 
  Droplets, 
  Thermometer, 
  Calendar,
  Star,
  Search,
  Calculator,
  Wrench,
  DollarSign,
  FileText
} from "lucide-react";
import WaterParametersForm from "@/components/farm/WaterParametersForm";
import AIDiseasePredictor from "@/components/farm/AIDiseasePredictor";
import WeatherForecast from "@/components/farm/WeatherForecast";
import SmartFeedCalculator from "@/components/calculators/SmartFeedCalculator";
import ProfitLossLedger from "@/components/farm/ProfitLossLedger";
import TraceabilityLog from "@/components/farm/TraceabilityLog";
import DoctorDirectory from "@/components/farm/DoctorDirectory";

const Farm = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [searchLocation, setSearchLocation] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

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

  const aquacultureTypes = [
    {
      type: "Shrimp Farming",
      species: ["Black Tiger Shrimp", "Vannamei Shrimp"],
      suitability: "Coastal areas with saline water",
      seasonality: "Year-round with peak in winter",
      icon: "🦐",
      difficulty: "Medium",
      profitability: "High"
    },
    {
      type: "Fish Farming",
      species: ["Rohu", "Catla", "Mrigal", "Tilapia"],
      suitability: "Freshwater ponds, rivers",
      seasonality: "Monsoon to winter",
      icon: "🐟",
      difficulty: "Easy",
      profitability: "Medium"
    },
    {
      type: "Crab Farming",
      species: ["Mud Crab", "Blue Swimmer Crab"],
      suitability: "Mangrove areas, brackish water",
      seasonality: "Winter months preferred",
      icon: "🦀",
      difficulty: "Hard",
      profitability: "Very High"
    },
    {
      type: "Ornamental Fish",
      species: ["Goldfish", "Koi", "Guppy", "Angel Fish"],
      suitability: "Controlled environment tanks",
      seasonality: "Year-round",
      icon: "🐠",
      difficulty: "Medium",
      profitability: "High"
    }
  ];

  const aiSuggestions = [
    {
      location: "Coastal Andhra Pradesh",
      waterType: "Saline",
      season: "Winter",
      recommendations: [
        { species: "Vannamei Shrimp", score: 95, reason: "Perfect water salinity and temperature" },
        { species: "Black Tiger Shrimp", score: 88, reason: "Good market demand and suitable conditions" },
        { species: "Mud Crab", score: 75, reason: "High value but requires expertise" }
      ]
    },
    {
      location: "Freshwater Areas",
      waterType: "Fresh",
      season: "Current",
      recommendations: [
        { species: "Rohu", score: 92, reason: "Traditional fish with stable market" },
        { species: "Tilapia", score: 85, reason: "Fast growth and disease resistant" },
        { species: "Catla", score: 80, reason: "Good for polyculture systems" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Farm Tools & Resources</h1>
        <p className="text-white/80">Complete farm management toolkit</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Main Tabs */}
        <Tabs defaultValue="tools" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tools" className="flex items-center gap-1 text-xs">
              <Wrench className="h-4 w-4" />
              Tools
            </TabsTrigger>
            <TabsTrigger value="calculator" className="flex items-center gap-1 text-xs">
              <Calculator className="h-4 w-4" />
              Feed
            </TabsTrigger>
            <TabsTrigger value="finance" className="flex items-center gap-1 text-xs">
              <DollarSign className="h-4 w-4" />
              Finance
            </TabsTrigger>
            <TabsTrigger value="traceability" className="flex items-center gap-1 text-xs">
              <FileText className="h-4 w-4" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tools" className="mt-4 space-y-6">
            {/* Weather Forecast & Pond Advisory */}
            <WeatherForecast />

            {/* Water Parameters & IoT */}
            <WaterParametersForm />

            {/* AI Disease Predictor */}
            <AIDiseasePredictor />

            {/* Doctor Directory */}
            <DoctorDirectory />

            {/* Location Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter your location (e.g., Guntur, AP)"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="flex-1"
                  />
                  <Button>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Aquaculture Types */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Aquaculture Types</h2>
              {aquacultureTypes.map((type, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{type.icon}</div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold">{type.type}</h3>
                          <div className="flex gap-2">
                            <Badge variant="outline">{type.difficulty}</Badge>
                            <Badge variant={type.profitability === "Very High" ? "default" : "secondary"}>
                              {type.profitability}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{type.suitability}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {type.seasonality}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {type.species.map((species, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {species}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* AI Recommendations */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                AI-Driven Suggestions
              </h2>
              {aiSuggestions.map((suggestion, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{suggestion.location}</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline">{suggestion.waterType} Water</Badge>
                      <Badge variant="outline">{suggestion.season}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {suggestion.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{rec.species}</p>
                          <p className="text-sm text-muted-foreground">{rec.reason}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-primary">{rec.score}</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.floor(rec.score / 20) ? "text-yellow-500 fill-current" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Environmental Factors */}
            <Card>
              <CardHeader>
                <CardTitle>Current Environmental Conditions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Thermometer className="h-6 w-6 text-orange-500" />
                    <div>
                      <p className="font-medium">Temperature</p>
                      <p className="text-sm text-muted-foreground">28°C - Optimal</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <Droplets className="h-6 w-6 text-blue-500" />
                    <div>
                      <p className="font-medium">Water Quality</p>
                      <p className="text-sm text-muted-foreground">pH 7.2 - Good</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calculator" className="mt-4">
            <SmartFeedCalculator />
          </TabsContent>

          <TabsContent value="finance" className="mt-4">
            <ProfitLossLedger />
          </TabsContent>

          <TabsContent value="traceability" className="mt-4">
            <TraceabilityLog />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Farm;