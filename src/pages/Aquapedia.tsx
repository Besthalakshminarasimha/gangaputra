import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
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
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
  const { toast } = useToast();

  const hatcheries = [
    // Andhra Pradesh & Tamil Nadu - Major Shrimp/Aqua Hatcheries
    {
      name: "Srinidhi Biotechnologies",
      location: "Palmanpeta, Edatam Village, Payakaraopeta Mandal, Visakhapatnam District, AP",
      contact: "9849444057",
      species: ["L. vannamei"],
      type: "Private Hatchery",
      region: "Andhra Pradesh"
    },
    {
      name: "SVR Hatcheries",
      location: "Vemavaram Village, Addaripeta Post, Thondangi Mandal, East Godavari District, AP",
      contact: "9440965995",
      species: ["L. vannamei"],
      type: "Private Hatchery",
      region: "Andhra Pradesh"
    },
    {
      name: "Ananda Aqua Applications",
      location: "27-8-21, Sivarao pet, Bhimavaram, West Godavari District, AP",
      contact: "9849556699",
      species: ["Shrimp"],
      type: "Hatchery & Aqua Applications",
      region: "Andhra Pradesh"
    },
    {
      name: "BMR Hatcheries Ltd. (Administrative Office)",
      location: "16/3-509, Mini Bye-pass Road, Ramamurthi Nagar, Nellore – 524003, AP",
      contact: "+91 861 2325515",
      species: ["Shrimp"],
      type: "Private Hatchery (BMR Group)",
      region: "Andhra Pradesh"
    },
    {
      name: "Nellore Hatcheries (BMR Group)",
      location: "Mypadu, Indukurpet Mandal, Nellore District, AP",
      contact: "9849049118",
      species: ["Shrimp"],
      type: "Private Hatchery",
      region: "Andhra Pradesh"
    },
    {
      name: "Alpha Hatchery, Unit-I",
      location: "S No. 178-B-546/2, Koruturu Village, Indukurpet Mandal, Nellore District, AP",
      contact: "9394930100",
      species: ["L. vannamei"],
      type: "Private Hatchery",
      region: "Andhra Pradesh"
    },
    {
      name: "Gayathri Hatcheries",
      location: "Kothavodarevu, Pandurangapuram Village, Bapatla – 522101, Guntur District, AP",
      contact: "9849815566",
      species: ["L. vannamei"],
      type: "Private Hatchery",
      region: "Andhra Pradesh"
    },
    {
      name: "Sapthagiri Hatcheries",
      location: "Srirampuram, A. Malliyavani (P.O), Kakinada, AP",
      contact: "Contact via website",
      species: ["SPF Post-Larvae (PLs)"],
      type: "SPF Hatchery",
      region: "Andhra Pradesh"
    },
    {
      name: "Sudhith Shrimp Hatchery",
      location: "107, Perunthuravu Village, Seekanakuppam Post, Koovathur – 603305, Cheyyur Taluk, Kancheepuram District, TN",
      contact: "Contact for inquiries",
      species: ["L. vannamei"],
      type: "Private Hatchery",
      region: "Tamil Nadu"
    },
    {
      name: "Vaisakhi Bio-marine Private Limited, Unit – I",
      location: "Kaipenikuppam Village, Marakkanam Post, Thindivanam Taluk, Villupuram District – 604303, TN",
      contact: "Contact for inquiries",
      species: ["L. vannamei"],
      type: "Private Hatchery",
      region: "Tamil Nadu"
    },
    {
      name: "BMR Industries Pvt. Ltd. (Classwin Hatchery)",
      location: "2/154, East Coast Road, Muttukadu Village, Kancheepuram District, TN",
      contact: "Contact for inquiries",
      species: ["L. vannamei"],
      type: "Private Hatchery",
      region: "Tamil Nadu"
    },
    // Government / Research Institutes
    {
      name: "Rajiv Gandhi Center for Aquaculture (RGCA)",
      location: "Kancheepuram, Tamil Nadu & other centers in Andhra Pradesh",
      contact: "075988 42296, 099425 22977",
      species: ["Tilapia (GIFT)", "Seabass", "Pompano", "Monodon", "Etroplus"],
      type: "Government/Research Institute",
      region: "Multi-state"
    },
    {
      name: "ICAR-Central Institute of Freshwater Aquaculture (CIFA)",
      location: "Bhubaneshwar, Odisha",
      contact: "7008136480, 9777046042",
      species: ["Catla", "Rohu", "Murrel", "Anabas", "Magur"],
      type: "Government/Research Institute",
      region: "Odisha"
    },
    {
      name: "ICAR-Central Institute of Brackishwater Aquaculture (CIBA)",
      location: "Chennai, Tamil Nadu",
      contact: "+91-44-24618817",
      species: ["Mud Crab", "Prawn", "Seabass", "Milkfish", "Pearl spot", "Mullet"],
      type: "Government/Research Institute",
      region: "Tamil Nadu"
    },
    {
      name: "NFDB-National Freshwater Fish Brood Bank (NFFBB)",
      location: "Bhubaneshwar, Odisha",
      contact: "0674-2465761",
      species: ["Jayanthi Rohu", "Amur Carp", "Improved Catla", "Scampi"],
      type: "Government/Research Institute",
      region: "Odisha"
    },
    // Kerala State-Specific Hatcheries
    {
      name: "Multispecious Shrimp Hatchery ADAK",
      location: "Thiruvambady Beach, Varkkala, Thiruvananthapuram, Kerala",
      contact: "9400699410",
      species: ["Macrobrachium rosenbergii", "P. Indicus", "P. monodon", "Seabass", "Pompano", "Chanos", "Pearl spot"],
      type: "State Hatchery",
      region: "Kerala"
    },
    {
      name: "Satelite Centre on Genetically Improved Farmed Tilapia Breeding and Rearing",
      location: "Neyyardam, Thiruvananthapuram, Kerala",
      contact: "Email: adnyyardam@gmail.com",
      species: ["GIFT Tilapia"],
      type: "Government Breeding Center",
      region: "Kerala"
    },
    {
      name: "Star Fish Farm",
      location: "S.J. Nivas, Kottamam, Dhanuvachapuram, Thiruvananthapuram, Kerala",
      contact: "8589017378",
      species: ["Carp", "Etroplus", "Pangasius", "Anabas"],
      type: "Private Farm",
      region: "Kerala"
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

  const filteredHatcheries = hatcheries.filter(hatchery => {
    const matchesSearch = hatchery.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hatchery.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hatchery.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hatchery.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hatchery.species.some(species => species.toLowerCase().includes(searchQuery.toLowerCase()));
    
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

  const handleBuyMedicine = (medicine: any) => {
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
        <Tabs defaultValue="hatcheries" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="hatcheries">Hatcheries</TabsTrigger>
            <TabsTrigger value="medicines">CAA Medicines</TabsTrigger>
          </TabsList>

          {/* Hatcheries Tab */}
          <TabsContent value="hatcheries" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Major Hatcheries</h2>
              <Badge variant="outline">{filteredHatcheries.length} found</Badge>
            </div>

            {filteredHatcheries.map((hatchery, index) => (
              <Card key={index}>
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

                  <div className="flex justify-end">
                    <Button size="sm" asChild>
                      <a href={`tel:${hatchery.contact.replace(/\s/g, '')}`}>
                        <Phone className="h-4 w-4 mr-1" />
                        Contact
                      </a>
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

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full" size="sm" onClick={() => setSelectedMedicine(medicine)}>
                        View Details & Buy
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Pill className="h-5 w-5" />
                          {medicine.name}
                        </DialogTitle>
                        <DialogDescription>
                          Complete product information and purchase options
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Badge variant="default">CAA Approved</Badge>
                          <Badge variant="outline">{medicine.category}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="font-semibold text-sm">Manufacturer</p>
                            <p className="text-sm text-muted-foreground">{medicine.manufacturer}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Price</p>
                            <p className="text-sm text-primary font-bold">{medicine.price}</p>
                          </div>
                        </div>

                        <div>
                          <p className="font-semibold text-sm">Active Ingredient</p>
                          <p className="text-sm text-muted-foreground">{medicine.activeIngredient}</p>
                        </div>

                        <div>
                          <p className="font-semibold text-sm">Recommended Dosage</p>
                          <p className="text-sm text-muted-foreground">{medicine.dosage}</p>
                        </div>

                        <div>
                          <p className="font-semibold text-sm mb-2">Uses & Applications</p>
                          <div className="flex flex-wrap gap-1">
                            {medicine.uses.map((use: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {use}
                              </Badge>
                            ))}
                          </div>
                        </div>

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
            ))}
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
                      <SelectItem value="Kerala">Kerala</SelectItem>
                      <SelectItem value="Odisha">Odisha</SelectItem>
                      <SelectItem value="Multi-state">Multi-state</SelectItem>
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
                      <SelectItem value="Private Hatchery">Private Hatchery</SelectItem>
                      <SelectItem value="Government/Research Institute">Government/Research</SelectItem>
                      <SelectItem value="State Hatchery">State Hatchery</SelectItem>
                      <SelectItem value="SPF Hatchery">SPF Hatchery</SelectItem>
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
