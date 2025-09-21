import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  MapPin, 
  Phone, 
  Fish, 
  Pill, 
  Filter,
  ExternalLink
} from "lucide-react";

const Aquapedia = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const hatcheries = [
    {
      name: "Godavari Hatcheries",
      location: "Rajahmundry, East Godavari",
      contact: "+91 9876543210",
      species: ["Black Tiger Shrimp", "Vannamei Shrimp"],
      capacity: "10 Million PL/month",
      certification: "CAA Approved",
      distance: "12 km"
    },
    {
      name: "Krishna Aqua Farms",
      location: "Machilipatnam, Krishna",
      contact: "+91 9876543211",
      species: ["Rohu", "Catla", "Mrigal"],
      capacity: "5 Million Fry/month",
      certification: "MPEDA Certified",
      distance: "25 km"
    },
    {
      name: "Coastal Shrimp Hatchery",
      location: "Nellore, Nellore",
      contact: "+91 9876543212",
      species: ["Vannamei Shrimp"],
      capacity: "15 Million PL/month",
      certification: "CAA + MPEDA",
      distance: "45 km"
    }
  ];

  const medicines = [
    {
      name: "Aqua-Safe Plus",
      category: "Water Treatment",
      manufacturer: "AquaPharm Ltd",
      activeIngredient: "Potassium Permanganate",
      dosage: "1-2 ppm",
      price: "₹450/kg",
      caaApproved: true,
      uses: ["Water disinfection", "Pond preparation"]
    },
    {
      name: "Bio-Probiotic",
      category: "Probiotic",
      manufacturer: "Marine Biotech",
      activeIngredient: "Bacillus species",
      dosage: "250g/acre",
      price: "₹850/kg",
      caaApproved: true,
      uses: ["Water quality improvement", "Disease prevention"]
    },
    {
      name: "Oxy-Fresh",
      category: "Oxygenator",
      manufacturer: "Aqua Solutions",
      activeIngredient: "Sodium Percarbonate",
      dosage: "0.5-1 kg/acre",
      price: "₹320/kg",
      caaApproved: true,
      uses: ["Emergency oxygen supply", "Stress reduction"]
    }
  ];

  const filteredHatcheries = hatcheries.filter(hatchery =>
    hatchery.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hatchery.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hatchery.species.some(species => species.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    medicine.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    medicine.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Tabs defaultValue="hatcheries" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="hatcheries">Hatcheries</TabsTrigger>
            <TabsTrigger value="medicines">CAA Medicines</TabsTrigger>
          </TabsList>

          {/* Hatcheries Tab */}
          <TabsContent value="hatcheries" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Hatcheries in Andhra Pradesh</h2>
              <Badge variant="outline">{filteredHatcheries.length} found</Badge>
            </div>

            {filteredHatcheries.map((hatchery, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Fish className="h-5 w-5" />
                    {hatchery.name}
                  </CardTitle>
                  <Badge variant="default" className="w-fit">
                    {hatchery.certification}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {hatchery.location} • {hatchery.distance}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4" />
                    <span className="font-medium">{hatchery.contact}</span>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Species Available:</p>
                    <div className="flex flex-wrap gap-1">
                      {hatchery.species.map((species, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {species}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Capacity: {hatchery.capacity}
                    </span>
                    <Button size="sm">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Medicines Tab */}
          <TabsContent value="medicines" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">CAA Approved Medicines</h2>
              <Badge variant="outline">{filteredMedicines.length} found</Badge>
            </div>

            {filteredMedicines.map((medicine, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    {medicine.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="default">CAA Approved</Badge>
                    <Badge variant="outline">{medicine.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Manufacturer</p>
                      <p className="text-muted-foreground">{medicine.manufacturer}</p>
                    </div>
                    <div>
                      <p className="font-medium">Price</p>
                      <p className="text-muted-foreground">{medicine.price}</p>
                    </div>
                  </div>

                  <div>
                    <p className="font-medium text-sm">Active Ingredient</p>
                    <p className="text-sm text-muted-foreground">{medicine.activeIngredient}</p>
                  </div>

                  <div>
                    <p className="font-medium text-sm">Dosage</p>
                    <p className="text-sm text-muted-foreground">{medicine.dosage}</p>
                  </div>

                  <div>
                    <p className="font-medium text-sm mb-1">Uses:</p>
                    <div className="flex flex-wrap gap-1">
                      {medicine.uses.map((use, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {use}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button className="w-full" size="sm">
                    View Details & Buy
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter Results
              </Button>
              <Button variant="outline" size="sm">
                <MapPin className="h-4 w-4 mr-2" />
                Near Me
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Aquapedia;