import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const StickyCtaButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      // Show button after scrolling past 600px (roughly past hero)
      const scrollThreshold = 600;
      setIsVisible(window.scrollY > scrollThreshold);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 25 
          }}
          className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-40"
        >
          <Button
            onClick={handleClick}
            size="lg"
            className="group shadow-2xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary px-6 py-6 text-base font-semibold"
          >
            <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
            {user ? "Go to Dashboard" : "Get Started Free"}
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          {/* Glow effect */}
          <div className="absolute inset-0 -z-10 bg-primary/30 blur-xl rounded-full scale-150 animate-pulse" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyCtaButton;
