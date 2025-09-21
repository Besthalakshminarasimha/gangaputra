import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Droplets, Fish, Thermometer, Zap, DollarSign } from "lucide-react";
import dashboardImage from "@/assets/dashboard-preview.jpg";

const DashboardPreview = () => {
  const metrics = [
    {
      title: "Water Quality",
      value: "98%",
      trend: "+2.3%",
      icon: Droplets,
      color: "text-accent"
    },
    {
      title: "Fish Stock",
      value: "15,420",
      trend: "+12.5%",
      icon: Fish,
      color: "text-primary"
    },
    {
      title: "Temperature",
      value: "28.5°C",
      trend: "Optimal",
      icon: Thermometer,
      color: "text-success"
    },
    {
      title: "Energy Usage",
      value: "245 kWh",
      trend: "-8.2%",
      icon: Zap,
      color: "text-warning"
    },
    {
      title: "Revenue",
      value: "₹2,48,500",
      trend: "+18.7%",
      icon: DollarSign,
      color: "text-success"
    },
    {
      title: "FCR Ratio",
      value: "1.2:1",
      trend: "Excellent",
      icon: TrendingUp,
      color: "text-primary"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Real-time Farm
            <span className="text-gradient"> Dashboard</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Monitor every aspect of your aqua farm with our comprehensive dashboard. 
            Track water quality, fish health, feeding schedules, and financial performance in real-time.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Dashboard Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-gradient">
              <img 
                src={dashboardImage} 
                alt="Aqua farming dashboard interface"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent"></div>
            </div>
            
            {/* Floating notification */}
            <div className="absolute top-4 right-4 glass-card p-3 animate-pulse">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-sm font-medium">All systems optimal</span>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {metrics.map((metric, index) => (
                <Card key={index} className="metric-card group cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <metric.icon className={`w-6 h-6 ${metric.color}`} />
                      <span className="text-xs text-muted-foreground">{metric.trend}</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{metric.value}</div>
                    <div className="text-sm text-white/80">{metric.title}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl font-bold">Key Features</h3>
              <ul className="space-y-3">
                {[
                  "Real-time IoT sensor monitoring",
                  "AI-powered growth predictions",
                  "Automated feeding schedules",
                  "Water quality alerts",
                  "Financial performance tracking",
                  "Mobile app synchronization"
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-accent rounded-full"></div>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button variant="ocean" size="lg" className="w-full">
              Explore Dashboard
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;