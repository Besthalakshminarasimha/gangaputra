import { Button } from "@/components/ui/button";
import { ArrowRight, Fish, Droplets, Zap, BarChart3 } from "lucide-react";
import heroImage from "@/assets/hero-aqua-farm.jpg";

const HeroSection = () => {
  return (
    <section className="hero-gradient min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-20 h-20 rounded-full bg-primary-glow/20 float-animation"></div>
        <div className="absolute top-40 right-32 w-16 h-16 rounded-full bg-accent/20 float-animation" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-40 w-24 h-24 rounded-full bg-secondary/20 float-animation" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 animate-fade-in">
              <Fish className="w-5 h-5 text-accent" />
              <span className="text-white font-medium">Smart Aqua Farming Platform</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight animate-fade-in">
              The Future of
              <span className="text-gradient block mt-2">Aqua Farming</span>
            </h1>
            
            <p className="text-xl text-white/90 mb-8 max-w-2xl animate-fade-in">
              Revolutionize your fish farming with IoT monitoring, AI-powered insights, 
              marketplace integration, and complete farm management tools.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in">
              <Button variant="hero" size="lg" className="group">
                Start Your Farm Journey
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="sustainable" size="lg">
                Watch Demo
              </Button>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12 animate-fade-in">
              {[
                { icon: Droplets, label: "Water Quality", value: "Real-time" },
                { icon: Fish, label: "Fish Health", value: "AI Monitoring" },
                { icon: Zap, label: "IoT Devices", value: "Auto Control" },
                { icon: BarChart3, label: "Analytics", value: "Smart Insights" }
              ].map((feature, index) => (
                <div key={index} className="glass-card text-center p-4">
                  <feature.icon className="w-8 h-8 text-accent mx-auto mb-2" />
                  <div className="text-sm text-white/80">{feature.label}</div>
                  <div className="font-semibold text-white">{feature.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative animate-fade-in">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src={heroImage} 
                alt="Modern aqua farming with IoT technology"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
            </div>
            
            {/* Floating metrics */}
            <div className="absolute -top-4 -right-4 glass-card p-3 float-animation">
              <div className="text-sm text-card-foreground">Water Quality</div>
              <div className="text-lg font-bold text-success">Excellent</div>
            </div>
            
            <div className="absolute -bottom-4 -left-4 glass-card p-3 float-animation" style={{ animationDelay: '1s' }}>
              <div className="text-sm text-card-foreground">Daily Growth</div>
              <div className="text-lg font-bold text-primary">+2.3%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave animation at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-20 wave-animation opacity-30"></div>
    </section>
  );
};

export default HeroSection;