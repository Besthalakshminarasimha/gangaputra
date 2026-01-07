import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  ShoppingCart, 
  Star, 
  Plus, 
  Minus,
  CreditCard,
  Smartphone,
  X,
  Loader2,
  Play
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discount_price: number | null;
  category: string | null;
  image_urls: string[];
  video_url: string | null;
  in_stock: boolean;
  specifications: any;
}

const Store = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<{[key: string]: number}>({});
  const [showCart, setShowCart] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      });
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  if (authLoading) {
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

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
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
      const price = product?.discount_price || product?.price || 0;
      return total + (price * count);
    }, 0);
  };

  const handleCheckout = async () => {
    if (getTotalItems() === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to cart before checkout",
        variant: "destructive"
      });
      return;
    }

    // Build order items
    const orderItems = Object.entries(cart)
      .filter(([_, count]) => count > 0)
      .map(([productId, count]) => {
        const product = products.find(p => p.id === productId);
        return {
          productId,
          name: product?.name || 'Unknown',
          price: product?.discount_price || product?.price || 0,
          quantity: count,
        };
      });

    try {
      const { error } = await supabase
        .from('orders')
        .insert({
          user_id: user!.id,
          items: orderItems,
          total_amount: getTotalAmount(),
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: "Order Placed",
        description: "Your order has been placed successfully! We will contact you soon.",
      });
      setCart({});
      setShowCart(false);
    } catch (err) {
      console.error('Error placing order:', err);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive"
      });
    }
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
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No products found. Check back later!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Product Image */}
                  <div 
                    className="relative h-48 bg-muted cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                  >
                    {product.image_urls && product.image_urls.length > 0 ? (
                      <img 
                        src={product.image_urls[0]} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        📦
                      </div>
                    )}
                    {product.video_url && (
                      <div className="absolute top-2 right-2 bg-black/50 rounded-full p-2">
                        <Play className="h-4 w-4 text-white" />
                      </div>
                    )}
                    {!product.in_stock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="secondary">Out of Stock</Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 space-y-3">
                    <h3 className="font-bold text-sm line-clamp-2">{product.name}</h3>
                    
                    {product.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">
                        ₹{(product.discount_price || product.price).toLocaleString()}
                      </span>
                      {product.discount_price && product.discount_price < product.price && (
                        <span className="text-sm text-muted-foreground line-through">
                          ₹{product.price.toLocaleString()}
                        </span>
                      )}
                    </div>
                    
                    {product.in_stock ? (
                      cart[product.id] > 0 ? (
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
                        <Button size="sm" className="w-full" onClick={() => addToCart(product.id)}>
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          Add to Cart
                        </Button>
                      )
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Your Cart</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {cartItems.length === 0 ? (
              <p className="text-center text-muted-foreground">Your cart is empty</p>
            ) : (
              <>
                {cartItems.map(({ product, count }) => product && (
                  <div key={product.id} className="flex gap-4 items-center border-b pb-4">
                    <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden">
                      {product.image_urls && product.image_urls.length > 0 ? (
                        <img src={product.image_urls[0]} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ₹{(product.discount_price || product.price).toLocaleString()} × {count}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => removeFromCart(product.id)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span>{count}</span>
                      <Button size="sm" variant="outline" onClick={() => addToCart(product.id)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{getTotalAmount().toLocaleString()}</span>
                  </div>
                  <Button className="w-full mt-4" onClick={handleCheckout}>
                    Place Order
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedProduct.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Images Gallery */}
                {selectedProduct.image_urls && selectedProduct.image_urls.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProduct.image_urls.map((url, idx) => (
                      <img 
                        key={idx}
                        src={url} 
                        alt={`${selectedProduct.name} ${idx + 1}`}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                {/* Video */}
                {selectedProduct.video_url && (
                  <video 
                    src={selectedProduct.video_url} 
                    controls 
                    className="w-full rounded-lg"
                  />
                )}

                <p className="text-muted-foreground">{selectedProduct.description}</p>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-2xl">
                    ₹{(selectedProduct.discount_price || selectedProduct.price).toLocaleString()}
                  </span>
                  {selectedProduct.discount_price && selectedProduct.discount_price < selectedProduct.price && (
                    <span className="text-lg text-muted-foreground line-through">
                      ₹{selectedProduct.price.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Specifications */}
                {selectedProduct.specifications && Object.keys(selectedProduct.specifications).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-bold">Specifications</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                        <div key={key} className="bg-muted p-2 rounded">
                          <p className="text-xs text-muted-foreground">{key}</p>
                          <p className="font-medium">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProduct.in_stock ? (
                  <Button className="w-full" onClick={() => {
                    addToCart(selectedProduct.id);
                    setSelectedProduct(null);
                  }}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                ) : (
                  <Badge variant="secondary" className="w-full justify-center py-2">Out of Stock</Badge>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Store;
