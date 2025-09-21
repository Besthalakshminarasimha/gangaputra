import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  ShoppingCart, 
  Star, 
  Plus, 
  Minus,
  CreditCard,
  Smartphone
} from "lucide-react";

const Store = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<{[key: string]: number}>({});

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
      name: "AquaBot Pro 2.0",
      category: "devices",
      price: 45000,
      originalPrice: 50000,
      rating: 4.8,
      reviews: 124,
      image: "🤖",
      description: "Advanced aqua farming robot with AI monitoring",
      inStock: true,
      featured: true
    },
    {
      id: "2",
      name: "PowerMon Elite",
      category: "devices",
      price: 15000,
      originalPrice: 18000,
      rating: 4.6,
      reviews: 89,
      image: "⚡",
      description: "Smart electricity monitoring for aqua farms",
      inStock: true,
      featured: true
    },
    {
      id: "3",
      name: "Premium Vannamei Feed",
      category: "feed",
      price: 2500,
      originalPrice: 2800,
      rating: 4.7,
      reviews: 256,
      image: "🦐",
      description: "High protein feed for optimal shrimp growth - 25kg",
      inStock: true,
      featured: false
    },
    {
      id: "4",
      name: "Aqua-Safe Medicine Kit",
      category: "medicine",
      price: 1200,
      originalPrice: 1400,
      rating: 4.5,
      reviews: 178,
      image: "💊",
      description: "Complete medicine kit for common aqua diseases",
      inStock: true,
      featured: false
    },
    {
      id: "5",
      name: "Super Aerator 500W",
      category: "aerators",
      price: 8500,
      originalPrice: 9500,
      rating: 4.4,
      reviews: 67,
      image: "💨",
      description: "High efficiency aerator for large ponds",
      inStock: false,
      featured: false
    },
    {
      id: "6",
      name: "Water Test Kit Pro",
      category: "test-kits",
      price: 3500,
      originalPrice: 4000,
      rating: 4.6,
      reviews: 134,
      image: "🔬",
      description: "Complete water testing kit with digital meters",
      inStock: true,
      featured: true
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

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Aqua Store</h1>
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
                <Button>
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
    </div>
  );
};

export default Store;