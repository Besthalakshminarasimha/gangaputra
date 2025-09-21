import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star, Truck, Shield } from "lucide-react";
import marketplaceImage from "@/assets/marketplace-products.jpg";

const MarketplaceSection = () => {
  const products = [
    {
      name: "Smart Auto-Feeder Pro",
      price: "₹24,999",
      rating: 4.8,
      category: "Automation",
      badge: "Best Seller",
      features: ["Solar powered", "Mobile app control", "Weather resistant"]
    },
    {
      name: "Water Quality Sensor Kit",
      price: "₹8,500",
      rating: 4.9,
      category: "Monitoring",
      badge: "Expert Choice",
      features: ["Real-time monitoring", "pH & DO sensors", "Cloud connectivity"]
    },
    {
      name: "Premium Fish Feed (50kg)",
      price: "₹2,850",
      rating: 4.7,
      category: "Nutrition",
      badge: "Organic",
      features: ["High protein", "Digestible", "Growth optimized"]
    },
    {
      name: "Aerator System 2HP",
      price: "₹18,500",
      rating: 4.6,
      category: "Equipment",
      badge: "Energy Efficient",
      features: ["Low noise", "High efficiency", "Easy maintenance"]
    }
  ];

  const benefits = [
    {
      icon: Shield,
      title: "Expert Verified",
      description: "All products are tested and approved by aquaculture experts"
    },
    {
      icon: Truck,
      title: "Farm Delivery",
      description: "Direct delivery to your farm location with installation support"
    },
    {
      icon: Star,
      title: "Quality Guarantee",
      description: "100% quality guarantee with easy returns and warranty"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-muted/50 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Aqua Farming
            <span className="text-gradient"> Marketplace</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need for successful aqua farming. From IoT devices and feed to 
            equipment and medicines - all in one place with expert recommendations.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Marketplace Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src={marketplaceImage} 
                alt="Aqua farming marketplace products"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
            </div>

            {/* Benefits */}
            <div className="mt-8 space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-4 glass-card p-4">
                  <benefit.icon className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">{benefit.title}</h4>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="space-y-6">
            <div className="grid gap-4">
              {products.map((product, index) => (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-2xl font-bold text-primary">{product.price}</span>
                          <Badge variant="secondary">{product.category}</Badge>
                          {product.badge && (
                            <Badge variant="outline" className="text-accent border-accent">
                              {product.badge}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{product.rating}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-1 mb-4">
                      {product.features.map((feature, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button variant="aqua" className="w-full group">
                      <ShoppingCart className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                      Add to Cart
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center pt-6">
              <Button variant="ocean" size="lg">
                Browse All Products
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketplaceSection;