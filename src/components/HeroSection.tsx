import { Button } from "@/components/ui/button";
import { ArrowRight, Fish, Droplets, Zap, BarChart3, TrendingUp, Users, ShieldCheck, Award, Waves, Thermometer, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useRef } from "react";
import heroImage from "@/assets/hero-aqua-farm.jpg";
import dashboardPreview from "@/assets/dashboard-preview.jpg";
import marketplaceProducts from "@/assets/marketplace-products.jpg";

// Animated Counter Component
const AnimatedCounter = ({ end, suffix = "", prefix = "", duration = 2000 }: { 
  end: number; 
  suffix?: string; 
  prefix?: string;
  duration?: number;
}) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          setIsVisible(true);
          hasAnimated.current = true;
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(end * easeOutQuart);
      
      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: heroImage,
      title: "Smart Pond Monitoring",
      description: "Real-time water quality tracking"
    },
    {
      image: dashboardPreview,
      title: "Advanced Analytics",
      description: "AI-powered insights dashboard"
    },
    {
      image: marketplaceProducts,
      title: "Complete Marketplace",
      description: "All aquaculture supplies"
    }
  ];

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const stats = [
    { value: 10000, label: "Active Farmers", icon: Users, suffix: "+" },
    { value: 98, label: "Success Rate", icon: TrendingUp, suffix: "%" },
    { value: 24, label: "Support", icon: ShieldCheck, suffix: "/7" },
    { value: 50, label: "AI Features", icon: Award, suffix: "+" },
  ];

  return (
    <section className="hero-gradient min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-20 h-20 rounded-full bg-primary-glow/20 float-animation"></div>
        <div className="absolute top-40 right-32 w-16 h-16 rounded-full bg-accent/20 float-animation" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-40 w-24 h-24 rounded-full bg-secondary/20 float-animation" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-60 left-1/3 w-12 h-12 rounded-full bg-white/10 float-animation" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-48 right-1/4 w-14 h-14 rounded-full bg-accent/15 float-animation" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-5 py-2.5 rounded-full mb-6 animate-fade-in border border-white/20">
              <Fish className="w-5 h-5 text-accent" />
              <span className="text-white font-semibold text-sm tracking-wide">India's #1 Smart Aqua Farming Platform</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight animate-fade-in">
              <span className="text-gradient block mb-2">GANGAPUTRA</span>
              <span className="text-3xl lg:text-5xl font-medium opacity-95">The Future of</span>
              <br />
              <span className="text-3xl lg:text-5xl font-medium opacity-95">Aqua Farming</span>
            </h1>
            
            <p className="text-lg lg:text-xl text-white/90 mb-8 max-w-xl animate-fade-in leading-relaxed">
              Transform your aquaculture business with <span className="font-semibold text-accent">real-time IoT monitoring</span>, 
              <span className="font-semibold text-accent"> AI-powered disease detection</span>, live market prices, 
              and a complete farm-to-market ecosystem.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in mb-10">
              <Button variant="hero" size="lg" className="group text-base px-8 py-6" onClick={handleGetStarted}>
                {user ? "Go to Dashboard" : "Start Your Farm Journey"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="sustainable" size="lg" className="text-base px-8 py-6" onClick={() => navigate("/aquapedia")}>
                Explore Aquapedia
              </Button>
            </div>

            {/* Animated Trust Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
              {stats.map((stat, index) => (
                <div key={index} className="text-center lg:text-left">
                  <div className="flex items-center gap-2 justify-center lg:justify-start mb-1">
                    <stat.icon className="w-4 h-4 text-accent" />
                    <span className="text-2xl font-bold text-white">
                      <AnimatedCounter end={stat.value} suffix={stat.suffix} duration={2000 + index * 200} />
                    </span>
                  </div>
                  <span className="text-sm text-white/70">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Image Carousel */}
          <div className="relative animate-fade-in">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10">
              {/* Carousel */}
              <div className="relative aspect-[4/3] overflow-hidden">
                {slides.map((slide, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                      index === currentSlide 
                        ? 'opacity-100 translate-x-0' 
                        : index < currentSlide 
                          ? 'opacity-0 -translate-x-full' 
                          : 'opacity-0 translate-x-full'
                    }`}
                  >
                    <img 
                      src={slide.image} 
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent"></div>
                    
                    {/* Slide Info */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                        <h3 className="font-bold text-gray-800 text-lg">{slide.title}</h3>
                        <p className="text-sm text-gray-600">{slide.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Carousel Controls */}
              <button
                onClick={prevSlide}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors z-10"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors z-10"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>

              {/* Dots Indicator */}
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? 'bg-white w-8' 
                        : 'bg-white/50 hover:bg-white/70'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
            
            {/* Enhanced floating metrics */}
            <div className="absolute -top-3 -right-3 bg-white rounded-xl p-4 shadow-xl float-animation border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <Droplets className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-600">Water Quality</span>
              </div>
              <div className="text-xl font-bold text-success">Excellent</div>
              <div className="text-xs text-gray-500 mt-1">pH 7.2 • DO 6.8 mg/L</div>
            </div>
            
            <div className="absolute -bottom-3 -left-3 bg-white rounded-xl p-4 shadow-xl float-animation border border-gray-100" style={{ animationDelay: '1s' }}>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-600">Daily Growth</span>
              </div>
              <div className="text-xl font-bold text-primary">+2.3%</div>
              <div className="text-xs text-gray-500 mt-1">Above average</div>
            </div>

            <div className="absolute top-1/2 -left-6 transform -translate-y-1/2 bg-white rounded-xl p-3 shadow-xl float-animation border border-gray-100 hidden lg:block" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-orange-500" />
                <div>
                  <div className="text-xs text-gray-500">Temp</div>
                  <div className="text-sm font-bold text-gray-800">28°C</div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-1/4 -right-4 bg-white rounded-xl p-3 shadow-xl float-animation border border-gray-100 hidden lg:block" style={{ animationDelay: '1.5s' }}>
              <div className="flex items-center gap-2">
                <Waves className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-xs text-gray-500">Salinity</div>
                  <div className="text-sm font-bold text-gray-800">15 ppt</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature highlights - Enhanced */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-16 animate-fade-in">
          {[
            { icon: Droplets, label: "Water Monitoring", value: "Real-time Sensors", description: "pH, DO, Temp & more" },
            { icon: Fish, label: "Disease Detection", value: "AI-Powered", description: "95% accuracy rate" },
            { icon: Zap, label: "Smart Automation", value: "IoT Control", description: "Aerators & feeders" },
            { icon: BarChart3, label: "Market Prices", value: "Live Updates", description: "All major markets" }
          ].map((feature, index) => (
            <div key={index} className="glass-card text-center p-5 hover:bg-white/15 transition-all duration-300 group cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-accent" />
              </div>
              <div className="text-sm text-white/70 mb-1">{feature.label}</div>
              <div className="font-bold text-white text-lg">{feature.value}</div>
              <div className="text-xs text-white/60 mt-1">{feature.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Wave animation at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-20 wave-animation opacity-30"></div>
    </section>
  );
};

export default HeroSection;
