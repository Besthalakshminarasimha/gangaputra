import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Droplets, Fish, Thermometer, Zap, DollarSign } from "lucide-react";
import { motion, useInView } from "framer-motion";
import dashboardImage from "@/assets/dashboard-preview.jpg";

const DashboardPreview = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

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

  const features = [
    "Real-time IoT sensor monitoring",
    "AI-powered growth predictions",
    "Automated feeding schedules",
    "Water quality alerts",
    "Financial performance tracking",
    "Mobile app synchronization"
  ];

  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-b from-background to-muted/50">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Real-time Farm
            <span className="text-gradient"> Dashboard</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Monitor every aspect of your aqua farm with our comprehensive dashboard. 
            Track water quality, fish health, feeding schedules, and financial performance in real-time.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Dashboard Image */}
          <motion.div 
            initial={{ opacity: 0, x: -60 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -60 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-gradient">
              <img 
                src={dashboardImage} 
                alt="Aqua farming dashboard interface"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent"></div>
            </div>
            
            {/* Floating notification */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="absolute top-4 right-4 glass-card p-3"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">All systems optimal</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Metrics Grid */}
          <motion.div 
            initial={{ opacity: 0, x: 60 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 60 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              {metrics.map((metric, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                >
                  <Card className="metric-card group cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <metric.icon className={`w-6 h-6 ${metric.color}`} />
                        <span className="text-xs text-muted-foreground">{metric.trend}</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{metric.value}</div>
                      <div className="text-sm text-white/80">{metric.title}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="space-y-4"
            >
              <h3 className="text-2xl font-bold">Key Features</h3>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <motion.li 
                    key={index} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, delay: 0.9 + index * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-2 h-2 bg-accent rounded-full"></div>
                    <span className="text-muted-foreground">{feature}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 1.1 }}
            >
              <Button variant="ocean" size="lg" className="w-full">
                Explore Dashboard
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;
