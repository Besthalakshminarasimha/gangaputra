import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Brain, 
  Droplets, 
  Smartphone, 
  CreditCard, 
  MessageCircle, 
  BarChart3,
  Truck,
  Leaf,
  Zap,
  Shield,
  Users,
  Camera
} from "lucide-react";

const FeaturesGrid = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analytics",
      description: "Predictive disease detection, yield forecasting, and feeding optimization using advanced machine learning.",
      color: "text-purple-500"
    },
    {
      icon: Droplets,
      title: "Water Quality Monitoring",
      description: "Real-time tracking of pH, dissolved oxygen, ammonia, and temperature with instant alerts.",
      color: "text-blue-500"
    },
    {
      icon: Smartphone,
      title: "Mobile-First Design",
      description: "Access your farm data anywhere with our responsive web and mobile app with offline sync.",
      color: "text-green-500"
    },
    {
      icon: CreditCard,
      title: "Financial Services",
      description: "Low-cost credit, crop financing, payment tracking, and micro-loan calculators.",
      color: "text-emerald-500"
    },
    {
      icon: MessageCircle,
      title: "24/7 Expert Support",
      description: "Chat, WhatsApp, video calls with aquaculture experts and AI-powered virtual assistant.",
      color: "text-cyan-500"
    },
    {
      icon: BarChart3,
      title: "Farm Performance",
      description: "Track FCR, growth rates, feed conversion, profitability with regional benchmarking.",
      color: "text-indigo-500"
    },
    {
      icon: Truck,
      title: "Harvest & Logistics",
      description: "Farm-gate procurement, cold chain tracking, spot payments, and harvest scheduling.",
      color: "text-orange-500"
    },
    {
      icon: Leaf,
      title: "Sustainability Tracking",
      description: "Monitor carbon footprint, water usage, eco-impact with certification compliance.",
      color: "text-teal-500"
    },
    {
      icon: Zap,
      title: "IoT Integration",
      description: "Connect auto-feeders, sensors, aerators with Hardware-as-a-Service subscriptions.",
      color: "text-yellow-500"
    },
    {
      icon: Shield,
      title: "Insurance & Protection",
      description: "Stock, disease, weather insurance with easy claim management and risk assessment.",
      color: "text-red-500"
    },
    {
      icon: Users,
      title: "Farmer Community",
      description: "Connect with peer farmers, share knowledge, participate in forums and Q&A groups.",
      color: "text-pink-500"
    },
    {
      icon: Camera,
      title: "Traceability & QR",
      description: "Farm-to-fork traceability with QR codes for consumers and export quality assurance.",
      color: "text-violet-500"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Comprehensive
            <span className="text-gradient"> Platform Features</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From IoT monitoring to financial services, our platform covers every aspect 
            of modern aqua farming with cutting-edge technology and expert support.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 glass-card border-0"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-muted to-muted/50 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional highlight section */}
        <div className="mt-20 text-center">
          <div className="glass-card max-w-4xl mx-auto p-8 border-gradient">
            <h3 className="text-2xl font-bold mb-4">Futuristic Features</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold text-primary">AR Training</h4>
                <p className="text-sm text-muted-foreground">
                  Augmented reality tutorials for pond setup and disease identification
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-accent">Voice Commands</h4>
                <p className="text-sm text-muted-foreground">
                  Multi-language voice control and IVR support for rural farmers
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-secondary">Gamification</h4>
                <p className="text-sm text-muted-foreground">
                  Earn badges for sustainable practices and water conservation
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;