import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import AquaNews from "@/components/AquaNews";
import Community from "@/components/Community";
import HatcheryMap from "@/components/HatcheryMap";
import { 
  Search, 
  MapPin, 
  Phone, 
  Fish, 
  Pill, 
  Filter,
  Newspaper,
  Users,
  Mail,
  Globe,
  CheckCircle,
  XCircle,
  Map
} from "lucide-react";

interface Hatchery {
  id: string;
  name: string;
  location: string;
  region: string;
  type: string;
  species: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface Medicine {
  id: string;
  name: string;
  category: string;
  manufacturer: string;
  active_ingredient: string | null;
  dosage: string | null;
  price: number | null;
  approved: boolean;
  uses: string | null;
  description: string | null;
  image_url: string | null;
}

const Aquapedia = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const { toast } = useToast();

  // Database data
  const [dbHatcheries, setDbHatcheries] = useState<Hatchery[]>([]);
  const [dbMedicines, setDbMedicines] = useState<Medicine[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      
      // Fetch hatcheries from database
      const { data: hatcheriesData } = await supabase
        .from("hatcheries")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      // Fetch medicines from database
      const { data: medicinesData } = await supabase
        .from("medicines")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (hatcheriesData) setDbHatcheries(hatcheriesData);
      if (medicinesData) setDbMedicines(medicinesData);
      
      setLoadingData(false);
    };

    fetchData();
  }, []);

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

  // Combine database hatcheries with fallback hardcoded data if database is empty
  const hatcheries: Hatchery[] = dbHatcheries.length > 0 ? dbHatcheries : [
    { id: "1", name: "Alpha Hatchery", location: "Nellore", region: "Andhra Pradesh", type: "Private", species: "L. vannamei", phone: "9394930100", email: null, website: null, latitude: 14.4426, longitude: 79.9865 },
    { id: "2", name: "Nellore Hatcheries", location: "Nellore", region: "Andhra Pradesh", type: "Private", species: "Shrimp", phone: "9849049118", email: null, website: null, latitude: 14.4510, longitude: 79.9868 },
    { id: "3", name: "Srinidhi Biotechnologies", location: "Anakapalli", region: "Andhra Pradesh", type: "Private", species: "L. vannamei", phone: "9849444057", email: null, website: null, latitude: 17.6914, longitude: 83.0038 },
  ];

  // Combine database medicines with fallback hardcoded data if database is empty
  const medicines: Medicine[] = dbMedicines.length > 0 ? dbMedicines : [
    {
      id: "1",
      name: "Aqua-Safe Plus",
      category: "Water Treatment",
      manufacturer: "AquaPharm Ltd",
      active_ingredient: "Potassium Permanganate",
      dosage: "1-2 ppm",
      price: 450,
      approved: true,
      uses: "Water disinfection, Pond preparation",
      description: null,
      image_url: null
    },
    {
      id: "2",
      name: "Bio-Probiotic",
      category: "Probiotic",
      manufacturer: "Marine Biotech",
      active_ingredient: "Bacillus species",
      dosage: "250g/acre",
      price: 850,
      approved: true,
      uses: "Water quality improvement, Disease prevention",
      description: null,
      image_url: null
    },
  ];

  const filteredHatcheries = hatcheries.filter(hatchery => {
    const matchesSearch = hatchery.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hatchery.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hatchery.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hatchery.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hatchery.species.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRegion = selectedRegion === "all" || hatchery.region === selectedRegion;
    const matchesType = selectedType === "all" || hatchery.type === selectedType;
    
    return matchesSearch && matchesRegion && matchesType;
  });

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    medicine.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    medicine.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNearMe = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          toast({
            title: "Location detected",
            description: "Showing hatcheries near you (feature in development)",
          });
        },
        (error) => {
          toast({
            title: "Location access denied",
            description: "Please enable location access to use this feature",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
    }
  };

  const handleBuyMedicine = (medicine: Medicine) => {
    toast({
      title: "Purchase initiated",
      description: `Redirecting to purchase ${medicine.name}...`,
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Aquapedia</h1>
        <p className="text-white/80">Your comprehensive aquaculture knowledge base</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Search Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search hatcheries, medicines, or information..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="news" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="news" className="gap-1 text-xs sm:text-sm">
              <Newspaper className="h-4 w-4" />
              <span className="hidden sm:inline">News</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="gap-1 text-xs sm:text-sm">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Community</span>
            </TabsTrigger>
            <TabsTrigger value="hatcheries" className="text-xs sm:text-sm">Hatcheries</TabsTrigger>
            <TabsTrigger value="medicines" className="text-xs sm:text-sm">Medicines</TabsTrigger>
          </TabsList>

          {/* News Tab */}
          <TabsContent value="news" className="space-y-4 mt-4">
            <AquaNews />
          </TabsContent>

          {/* Community Tab */}
          <TabsContent value="community" className="space-y-4 mt-4">
            <Community />
          </TabsContent>

          {/* Hatcheries Tab */}
          <TabsContent value="hatcheries" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Major Hatcheries</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant={showMap ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowMap(!showMap)}
                >
                  <Map className="h-4 w-4 mr-1" />
                  {showMap ? "List" : "Map"}
                </Button>
                <Badge variant="outline">
                  {loadingData ? "Loading..." : `${filteredHatcheries.length} found`}
                </Badge>
              </div>
            </div>

            {showMap && (
              <HatcheryMap hatcheries={filteredHatcheries as any} />
            )}

            {loadingData ? (
              <p className="text-center text-muted-foreground py-8">Loading hatcheries...</p>
            ) : filteredHatcheries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hatcheries found</p>
            ) : (
              filteredHatcheries.map((hatchery) => (
                <Card key={hatchery.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Fish className="h-5 w-5" />
                      {hatchery.name}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="default" className="w-fit">
                        {hatchery.region}
                      </Badge>
                      <Badge variant="outline" className="w-fit">
                        {hatchery.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{hatchery.location}</span>
                    </div>
                    
                    {hatchery.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4" />
                        <span className="font-medium">{hatchery.phone}</span>
                      </div>
                    )}

                    {hatchery.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4" />
                        <span>{hatchery.email}</span>
                      </div>
                    )}

                    {hatchery.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4" />
                        <a href={hatchery.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {hatchery.website}
                        </a>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium mb-2">Species Available:</p>
                      <div className="flex flex-wrap gap-1">
                        {hatchery.species.split(",").map((species, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {species.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {hatchery.phone && (
                      <div className="flex justify-end">
                        <Button size="sm" asChild>
                          <a href={`tel:${hatchery.phone.replace(/\s/g, '')}`}>
                            <Phone className="h-4 w-4 mr-1" />
                            Contact
                          </a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Medicines Tab */}
          <TabsContent value="medicines" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Aquaculture Medicines</h2>
              <Badge variant="outline">
                {loadingData ? "Loading..." : `${filteredMedicines.length} found`}
              </Badge>
            </div>

            {loadingData ? (
              <p className="text-center text-muted-foreground py-8">Loading medicines...</p>
            ) : filteredMedicines.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No medicines found</p>
            ) : (
              filteredMedicines.map((medicine) => (
                <Card key={medicine.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {medicine.image_url && (
                        <img src={medicine.image_url} alt={medicine.name} className="h-10 w-10 object-cover rounded" />
                      )}
                      {!medicine.image_url && <Pill className="h-5 w-5" />}
                      {medicine.name}
                    </CardTitle>
                    <div className="flex gap-2">
                      {medicine.approved ? (
                        <Badge variant="default" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          CAA Approved
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          Not Approved
                        </Badge>
                      )}
                      <Badge variant="outline">{medicine.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Manufacturer</p>
                        <p className="text-muted-foreground">{medicine.manufacturer}</p>
                      </div>
                      {medicine.price && (
                        <div>
                          <p className="font-medium">Price</p>
                          <p className="text-muted-foreground">₹{medicine.price}</p>
                        </div>
                      )}
                    </div>

                    {medicine.active_ingredient && (
                      <div>
                        <p className="font-medium text-sm">Active Ingredient</p>
                        <p className="text-sm text-muted-foreground">{medicine.active_ingredient}</p>
                      </div>
                    )}

                    {medicine.dosage && (
                      <div>
                        <p className="font-medium text-sm">Dosage</p>
                        <p className="text-sm text-muted-foreground">{medicine.dosage}</p>
                      </div>
                    )}

                    {medicine.uses && (
                      <div>
                        <p className="font-medium text-sm mb-1">Uses:</p>
                        <div className="flex flex-wrap gap-1">
                          {medicine.uses.split(",").map((use, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {use.trim()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full" size="sm" onClick={() => setSelectedMedicine(medicine)}>
                          View Details & Buy
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            {medicine.image_url ? (
                              <img src={medicine.image_url} alt={medicine.name} className="h-12 w-12 object-cover rounded" />
                            ) : (
                              <Pill className="h-5 w-5" />
                            )}
                            {medicine.name}
                          </DialogTitle>
                          <DialogDescription>
                            Complete product information and purchase options
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            {medicine.approved ? (
                              <Badge variant="default">CAA Approved</Badge>
                            ) : (
                              <Badge variant="secondary">Not Approved</Badge>
                            )}
                            <Badge variant="outline">{medicine.category}</Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="font-semibold text-sm">Manufacturer</p>
                              <p className="text-sm text-muted-foreground">{medicine.manufacturer}</p>
                            </div>
                            {medicine.price && (
                              <div>
                                <p className="font-semibold text-sm">Price</p>
                                <p className="text-sm text-primary font-bold">₹{medicine.price}</p>
                              </div>
                            )}
                          </div>

                          {medicine.active_ingredient && (
                            <div>
                              <p className="font-semibold text-sm">Active Ingredient</p>
                              <p className="text-sm text-muted-foreground">{medicine.active_ingredient}</p>
                            </div>
                          )}

                          {medicine.dosage && (
                            <div>
                              <p className="font-semibold text-sm">Recommended Dosage</p>
                              <p className="text-sm text-muted-foreground">{medicine.dosage}</p>
                            </div>
                          )}

                          {medicine.description && (
                            <div>
                              <p className="font-semibold text-sm">Description</p>
                              <p className="text-sm text-muted-foreground">{medicine.description}</p>
                            </div>
                          )}

                          {medicine.uses && (
                            <div>
                              <p className="font-semibold text-sm mb-2">Uses & Applications</p>
                              <div className="flex flex-wrap gap-1">
                                {medicine.uses.split(",").map((use, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {use.trim()}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="pt-4 flex gap-2">
                            <Button className="flex-1" onClick={() => handleBuyMedicine(medicine)}>
                              Buy Now
                            </Button>
                            <Button variant="outline" className="flex-1">
                              Add to Cart
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Filter & Quick Access */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleNearMe}>
                <MapPin className="h-4 w-4 mr-2" />
                Near Me
              </Button>
            </div>

            {showFilters && (
              <div className="space-y-3 pt-2 border-t">
                <div>
                  <label className="text-sm font-medium mb-2 block">Filter by Region</label>
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Regions</SelectItem>
                      <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
                      <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                      <SelectItem value="West Bengal">West Bengal</SelectItem>
                      <SelectItem value="Odisha">Odisha</SelectItem>
                      <SelectItem value="Gujarat">Gujarat</SelectItem>
                      <SelectItem value="Kerala">Kerala</SelectItem>
                      <SelectItem value="Karnataka">Karnataka</SelectItem>
                      <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Filter by Type</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Private">Private Hatchery</SelectItem>
                      <SelectItem value="Government">Government</SelectItem>
                      <SelectItem value="Research Institute">Research Institute</SelectItem>
                      <SelectItem value="Cooperative">Cooperative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    setSelectedRegion("all");
                    setSelectedType("all");
                    toast({
                      title: "Filters cleared",
                      description: "Showing all hatcheries",
                    });
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Aquapedia;
