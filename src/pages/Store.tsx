import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  ShoppingCart, 
  Star, 
  Plus, 
  Minus,
  CreditCard,
  Smartphone,
  X
} from "lucide-react";

const Store = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<{[key: string]: number}>({});
  const [showCart, setShowCart] = useState(false);
  const { toast } = useToast();

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

  const categories = [
    { id: "all", name: "All", icon: "🏪" },
    { id: "devices", name: "Devices", icon: "📱" },
    { id: "feed", name: "Shrimp Feed", icon: "🦐" },
    { id: "medicine", name: "Medicine", icon: "💊" },
    { id: "minerals", name: "Minerals", icon: "⚡" },
    { id: "aerators", name: "Aerators", icon: "💨" },
    { id: "test-kits", name: "Test Kits", icon: "🔬" },
    { id: "disinfectants", name: "Disinfectants", icon: "🧽" },
    { id: "electrical", name: "Electrical", icon: "⚡" },
  ];

  const products = [
    {
      id: "1",
      name: "2HP Shrimp Farming Aerator",
      category: "aerators",
      price: 34000,
      originalPrice: 38000,
      rating: 4.8,
      reviews: 156,
      image: "💨",
      description: "Surface Floating Aerator, Up to 27m Visible Flow, 2.5-2.8 kg O2/hrs",
      inStock: true,
      featured: true,
      url: "https://www.indiamart.com/proddetail/2hp-shrimp-farming-aerator-6453643888.html"
    },
    {
      id: "2",
      name: "Fish Pond Shrimp Prawn Aerator",
      category: "aerators",
      price: 26000,
      originalPrice: 29000,
      rating: 4.6,
      reviews: 89,
      image: "💨",
      description: "1 HP Portable Aerator, 1.3-1.5 Kg O2/Hr, SS 304 Grade",
      inStock: true,
      featured: false,
      url: "https://www.indiamart.com/proddetail/fish-pond-shrimp-prawn-aerator-20621069730.html"
    },
    {
      id: "3",
      name: "Paddle Wheel Aerator 1HP",
      category: "aerators",
      price: 28000,
      originalPrice: 32000,
      rating: 4.5,
      reviews: 134,
      image: "💨",
      description: "High efficiency paddle wheel aerator for aquaculture ponds",
      inStock: true,
      featured: false,
      url: "https://dir.indiamart.com/impcat/paddle-wheel-aerator.html"
    },
    {
      id: "4",
      name: "Vannamei Shrimp Feed - Premium",
      category: "feed",
      price: 55,
      originalPrice: 60,
      rating: 4.7,
      reviews: 342,
      image: "🦐",
      description: "High protein Vannamei feed, 29% protein, 1.5mm pellet size - Per Kg",
      inStock: true,
      featured: true,
      url: "https://www.exportersindia.com/indian-suppliers/shrimp-feed.htm"
    },
    {
      id: "5",
      name: "Vannamei Feed - Standard",
      category: "feed",
      price: 48,
      originalPrice: 52,
      rating: 4.5,
      reviews: 267,
      image: "🦐",
      description: "Quality Vannamei shrimp feed for optimal growth - Per Kg",
      inStock: true,
      featured: false,
      url: "https://dir.indiamart.com/chennai/shrimp-feed.html"
    },
    {
      id: "6",
      name: "Aquaculture Water Testing Kit",
      category: "test-kits",
      price: 2870,
      originalPrice: 3200,
      rating: 4.6,
      reviews: 178,
      image: "🔬",
      description: "Complete water testing kit with pH, DO, Ammonia, Nitrite tests",
      inStock: true,
      featured: true,
      url: "https://www.indiamart.com/proddetail/aquaculture-water-testing-kit-3726374762.html"
    },
    {
      id: "7",
      name: "API Pond Master Test Kit",
      category: "test-kits",
      price: 1850,
      originalPrice: 2100,
      rating: 4.4,
      reviews: 156,
      image: "🔬",
      description: "Portable water testing kit with color comparing chart",
      inStock: true,
      featured: false,
      url: "https://www.indiamart.com/proddetail/api-pond-master-test-kit-24260360730.html"
    },
    {
      id: "8",
      name: "Dissolved Oxygen Test Kit",
      category: "test-kits",
      price: 950,
      originalPrice: 1100,
      rating: 4.3,
      reviews: 98,
      image: "🔬",
      description: "Professional DO testing kit for aquaculture",
      inStock: true,
      featured: false,
      url: "https://dir.indiamart.com/impcat/dissolved-oxygen-test-kit.html"
    },
    {
      id: "9",
      name: "Aqua Probiotic Liquid (Power PS)",
      category: "medicine",
      price: 850,
      originalPrice: 950,
      rating: 4.6,
      reviews: 234,
      image: "💊",
      description: "Shrimp probiotic liquid for gut health and disease prevention - 1L",
      inStock: true,
      featured: true,
      url: "https://www.indiamart.com/proddetail/aqua-shrimp-probiotic-liquid-power-ps-24225948191.html"
    },
    {
      id: "10",
      name: "Probiotics for Vannamei Shrimp",
      category: "medicine",
      price: 1200,
      originalPrice: 1400,
      rating: 4.7,
      reviews: 189,
      image: "💊",
      description: "Specialized probiotics for Vannamei shrimp aquaculture - 1kg",
      inStock: true,
      featured: true,
      url: "https://www.indiamart.com/proddetail/probiotics-for-vennamai-shrimp-in-aquaculture-23295263630.html"
    },
    {
      id: "11",
      name: "Aqua Gut Pro Probiotics",
      category: "medicine",
      price: 980,
      originalPrice: 1150,
      rating: 4.5,
      reviews: 167,
      image: "💊",
      description: "Gut health optimizer probiotic for shrimp farming - 500g",
      inStock: true,
      featured: false,
      url: "https://www.indiamart.com/proddetail/aqua-gut-pro-pr-probiotics-18688209062.html"
    },
    {
      id: "12",
      name: "Microbial Antibiotic Alternative",
      category: "medicine",
      price: 1450,
      originalPrice: 1650,
      rating: 4.4,
      reviews: 145,
      image: "💊",
      description: "Natural alternative to antibiotics for fish and shrimp - 1kg",
      inStock: false,
      featured: false,
      url: "https://www.indiamart.com/proddetail/microbial-alternative-to-antibiotics-in-fish-and-shrimp-farming-2855763808655.html"
    },
    {
      id: "13",
      name: "Aqua Minerals Mix",
      category: "minerals",
      price: 680,
      originalPrice: 750,
      rating: 4.5,
      reviews: 203,
      image: "⚡",
      description: "Essential mineral supplement for shrimp growth - 5kg",
      inStock: true,
      featured: false,
      url: "https://dir.indiamart.com/impcat/shrimp-feed.html"
    },
    {
      id: "14",
      name: "Calcium Mineral Supplement",
      category: "minerals",
      price: 520,
      originalPrice: 600,
      rating: 4.3,
      reviews: 167,
      image: "⚡",
      description: "Calcium enriched mineral for shell hardening - 10kg",
      inStock: true,
      featured: false,
      url: "https://dir.indiamart.com/impcat/shrimp-feed.html"
    },
    {
      id: "15",
      name: "Aqua Disinfectant Powder",
      category: "disinfectants",
      price: 780,
      originalPrice: 850,
      rating: 4.4,
      reviews: 189,
      image: "🧽",
      description: "Pond disinfectant for disease control - 5kg",
      inStock: true,
      featured: false,
      url: "https://dir.indiamart.com/impcat/water-testing-equipment.html"
    },
    {
      id: "16",
      name: "Chlorine Dioxide Disinfectant",
      category: "disinfectants",
      price: 920,
      originalPrice: 1050,
      rating: 4.6,
      reviews: 156,
      image: "🧽",
      description: "Powerful water disinfectant for aquaculture - 1L",
      inStock: true,
      featured: false,
      url: "https://dir.indiamart.com/impcat/water-testing-equipment.html"
    }
  ];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (productId: string) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => ({
      ...prev,
      [productId]: Math.max((prev[productId] || 0) - 1, 0)
    }));
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, count) => sum + count, 0);
  };

  const getTotalAmount = () => {
    return Object.entries(cart).reduce((total, [productId, count]) => {
      const product = products.find(p => p.id === productId);
      return total + (product ? product.price * count : 0);
    }, 0);
  };

  const handleCheckout = () => {
    if (getTotalItems() === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to cart before checkout",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Redirecting to IndiaMART",
      description: "Taking you to complete your purchase...",
    });
    
    setTimeout(() => {
      window.open("https://dir.indiamart.com/search.mp?ss=aqua+&prdsrc=1&v=4&mcatid=&catid=&crs=xnh-city&trc=xim&cq=Bengaluru&tags=res:RC3|ktp:N0|mtp:S|wc:1|lcf:3|cq:bengaluru|qr_nm:gl-gd|cs:16997|com-cf:nl|ptrs:na|mc:156180|cat:13|qry_typ:P|lang:en|tyr:1|qrd:251018|mrd:251004|prdt:251021|msf:hs|pfen:1|gli:G0I0|gc:Bengaluru|ic:Bengaluru|scw:1", "_blank");
      setShowCart(false);
    }, 500);
  };

  const cartItems = Object.entries(cart).filter(([_, count]) => count > 0).map(([productId, count]) => {
    const product = products.find(p => p.id === productId);
    return { product, count };
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Ganga Store</h1>
        <p className="text-white/80">Everything you need for successful aqua farming</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Search Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search products..."
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

        {/* Categories */}
        <div className="overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="whitespace-nowrap"
              >
                <span className="mr-1">{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className={product.featured ? "ring-2 ring-primary/20" : ""}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="text-4xl">{product.image}</div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-sm">{product.name}</h3>
                      {product.featured && (
                        <Badge variant="default" className="text-xs">Featured</Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground">{product.description}</p>
                    
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium">{product.rating}</span>
                      <span className="text-xs text-muted-foreground">({product.reviews})</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">₹{product.price.toLocaleString()}</span>
                      {product.originalPrice > product.price && (
                        <span className="text-sm text-muted-foreground line-through">
                          ₹{product.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {product.inStock ? (
                        <>
                          {cart[product.id] > 0 ? (
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => removeFromCart(product.id)}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="font-medium">{cart[product.id]}</span>
                              <Button size="sm" variant="outline" onClick={() => addToCart(product.id)}>
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" onClick={() => addToCart(product.id)}>
                              <ShoppingCart className="h-3 w-3 mr-1" />
                              Add to Cart
                            </Button>
                          )}
                        </>
                      ) : (
                        <Badge variant="secondary">Out of Stock</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Cart Summary */}
        {getTotalItems() > 0 && (
          <Card className="fixed bottom-20 left-4 right-4 z-30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold">{getTotalItems()} items in cart</p>
                  <p className="text-sm text-muted-foreground">
                    Total: ₹{getTotalAmount().toLocaleString()}
                  </p>
                </div>
                <Button onClick={() => setShowCart(true)}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  View Cart
                </Button>
              </div>
              
              {/* Payment Options */}
              <div className="grid grid-cols-3 gap-2">
                <Button size="sm" variant="outline">
                  <CreditCard className="h-3 w-3 mr-1" />
                  Card
                </Button>
                <Button size="sm" variant="outline">
                  <Smartphone className="h-3 w-3 mr-1" />
                  UPI
                </Button>
                <Button size="sm" variant="outline">
                  📱 PayLater
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Featured Banner */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="p-4 text-center">
            <h3 className="font-bold mb-2">🎉 Special Offer!</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Get 15% off on orders above ₹25,000. Use code: AQUA15
            </p>
            <Button size="sm">Shop Now</Button>
          </CardContent>
        </Card>
      </div>

      {/* Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Shopping Cart ({getTotalItems()} items)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {cartItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Your cart is empty</p>
            ) : (
              <>
                {cartItems.map(({ product, count }) => product && (
                  <div key={product.id} className="flex gap-3 p-3 bg-muted rounded-lg">
                    <div className="text-3xl">{product.image}</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{product.name}</h4>
                      <p className="text-xs text-muted-foreground">{product.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold">₹{(product.price * count).toLocaleString()}</span>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => removeFromCart(product.id)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-medium">{count}</span>
                          <Button size="sm" variant="outline" onClick={() => addToCart(product.id)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setCart(prev => ({ ...prev, [product.id]: 0 }))}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>₹{getTotalAmount().toLocaleString()}</span>
                  </div>
                  <Button className="w-full" size="lg" onClick={handleCheckout}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Proceed to Checkout
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    You'll be redirected to IndiaMART to complete your purchase
                  </p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Store;