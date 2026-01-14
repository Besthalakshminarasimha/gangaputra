import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    id: 1,
    name: "Rajesh Kumar",
    location: "West Godavari, Andhra Pradesh",
    role: "Shrimp Farmer",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "Gangaputra transformed my 10-acre shrimp farm. The AI disease prediction saved my entire crop last season. My profits increased by 40% in just one year!",
    farmSize: "10 Acres",
    profitIncrease: "40%"
  },
  {
    id: 2,
    name: "Lakshmi Devi",
    location: "Nellore, Andhra Pradesh",
    role: "Fish Farmer",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "The water monitoring system alerts me before problems arise. I can now manage my 5 ponds from my phone. It's like having an expert by my side 24/7.",
    farmSize: "5 Ponds",
    profitIncrease: "35%"
  },
  {
    id: 3,
    name: "Mohammed Ismail",
    location: "Krishna District, Andhra Pradesh",
    role: "Vannamei Farmer",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "From selling my harvest to buying quality feed, everything is on one platform. The live market prices help me get the best rates every time.",
    farmSize: "15 Acres",
    profitIncrease: "50%"
  },
  {
    id: 4,
    name: "Suresh Babu",
    location: "East Godavari, Andhra Pradesh",
    role: "Multi-species Farmer",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "The smart feed calculator reduced my feed costs by 25%. The Aquapedia section helped me learn advanced farming techniques. Highly recommended!",
    farmSize: "8 Acres",
    profitIncrease: "45%"
  },
  {
    id: 5,
    name: "Priya Reddy",
    location: "Guntur, Andhra Pradesh",
    role: "Organic Shrimp Farmer",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "Started with zero knowledge. The disease library and crop manuals taught me everything. Now I'm running a successful organic shrimp farm!",
    farmSize: "3 Acres",
    profitIncrease: "60%"
  }
];

const TestimonialsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  const getVisibleTestimonials = () => {
    const result = [];
    for (let i = -1; i <= 1; i++) {
      const index = (currentIndex + i + testimonials.length) % testimonials.length;
      result.push({ ...testimonials[index], position: i });
    }
    return result;
  };

  return (
    <section 
      ref={sectionRef}
      className="py-20 bg-gradient-to-b from-background via-muted/30 to-background overflow-hidden"
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-semibold text-primary">Farmer Success Stories</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Trusted by <span className="text-primary">10,000+</span> Farmers
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real stories from farmers who transformed their aquaculture business with Gangaputra
          </p>
        </div>

        {/* Carousel */}
        <div className="relative max-w-6xl mx-auto">
          {/* Cards Container */}
          <div className="relative h-[450px] md:h-[400px] flex items-center justify-center">
            {getVisibleTestimonials().map((testimonial, idx) => (
              <div
                key={`${testimonial.id}-${idx}`}
                className={`absolute w-full max-w-lg transition-all duration-500 ease-out ${
                  testimonial.position === 0
                    ? 'z-20 scale-100 opacity-100'
                    : testimonial.position === -1
                    ? 'z-10 -translate-x-[60%] scale-90 opacity-50 blur-[1px]'
                    : 'z-10 translate-x-[60%] scale-90 opacity-50 blur-[1px]'
                }`}
              >
                <div className="bg-card rounded-2xl p-8 shadow-xl border border-border relative overflow-hidden">
                  {/* Quote Icon */}
                  <Quote className="absolute top-4 right-4 w-12 h-12 text-primary/10" />
                  
                  {/* Rating */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>

                  {/* Testimonial Text */}
                  <p className="text-foreground text-lg leading-relaxed mb-6 italic">
                    "{testimonial.text}"
                  </p>

                  {/* Stats */}
                  <div className="flex gap-4 mb-6">
                    <div className="bg-primary/10 rounded-lg px-4 py-2">
                      <div className="text-xs text-muted-foreground">Farm Size</div>
                      <div className="text-sm font-bold text-primary">{testimonial.farmSize}</div>
                    </div>
                    <div className="bg-green-500/10 rounded-lg px-4 py-2">
                      <div className="text-xs text-muted-foreground">Profit Increase</div>
                      <div className="text-sm font-bold text-green-600">{testimonial.profitIncrease}</div>
                    </div>
                  </div>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
                    />
                    <div>
                      <div className="font-bold text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-primary">{testimonial.role}</div>
                      <div className="text-xs text-muted-foreground">{testimonial.location}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="icon"
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-30 rounded-full shadow-lg bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-30 rounded-full shadow-lg bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'w-8 bg-primary' 
                    : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className={`mt-16 text-center transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="flex flex-wrap justify-center gap-8 items-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">₹50Cr+</div>
              <div className="text-sm text-muted-foreground">Farmer Earnings</div>
            </div>
            <div className="h-12 w-px bg-border hidden md:block"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">Districts Covered</div>
            </div>
            <div className="h-12 w-px bg-border hidden md:block"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">95%</div>
              <div className="text-sm text-muted-foreground">Disease Prevention</div>
            </div>
            <div className="h-12 w-px bg-border hidden md:block"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">4.9★</div>
              <div className="text-sm text-muted-foreground">User Rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsCarousel;
