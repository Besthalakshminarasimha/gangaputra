import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, useInView } from "framer-motion";
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
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const
      }
    }
  };

  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Comprehensive
            <span className="text-gradient"> Platform Features</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From IoT monitoring to financial services, our platform covers every aspect 
            of modern aqua farming with cutting-edge technology and expert support.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card 
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 glass-card border-0 h-full"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400 }}
                      className="p-3 rounded-lg bg-gradient-to-br from-muted to-muted/50"
                    >
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </motion.div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional highlight section */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.6, delay: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
          className="mt-20 text-center"
        >
          <div className="glass-card max-w-4xl mx-auto p-8 border-gradient">
            <h3 className="text-2xl font-bold mb-4">Futuristic Features</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="space-y-2"
              >
                <h4 className="font-semibold text-primary">AR Training</h4>
                <p className="text-sm text-muted-foreground">
                  Augmented reality tutorials for pond setup and disease identification
                </p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="space-y-2"
              >
                <h4 className="font-semibold text-accent">Voice Commands</h4>
                <p className="text-sm text-muted-foreground">
                  Multi-language voice control and IVR support for rural farmers
                </p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                className="space-y-2"
              >
                <h4 className="font-semibold text-secondary">Gamification</h4>
                <p className="text-sm text-muted-foreground">
                  Earn badges for sustainable practices and water conservation
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
