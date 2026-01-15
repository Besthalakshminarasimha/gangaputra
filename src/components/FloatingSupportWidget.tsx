import { useState } from "react";
import { Phone, MessageCircle, X, Headphones, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

const FloatingSupportWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  const supportOptions = [
    {
      icon: Phone,
      title: "Call Support",
      description: "Talk to an expert",
      action: "tel:7569373499",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      icon: MessageCircle,
      title: "WhatsApp",
      description: "Quick chat support",
      action: "https://wa.me/917569373499",
      color: "bg-emerald-500 hover:bg-emerald-600",
    },
    {
      icon: Mail,
      title: "Email Us",
      description: "Send your query",
      action: "mailto:support@gangaputra.com",
      color: "bg-primary hover:bg-primary/90",
    },
  ];

  return (
    <div className="fixed bottom-20 left-4 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4"
          >
            <Card className="w-72 shadow-2xl border-primary/20 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary to-accent p-4 text-primary-foreground">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Headphones className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">Farmer Support</h3>
                      <div className="flex items-center gap-1 text-xs opacity-90">
                        <Clock className="w-3 h-3" />
                        <span>24/7 Available</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Support Options */}
              <div className="p-4 space-y-3">
                <p className="text-sm text-muted-foreground mb-3">
                  How can we help you today?
                </p>
                
                {supportOptions.map((option, index) => (
                  <motion.a
                    key={index}
                    href={option.action}
                    target={option.action.startsWith("http") ? "_blank" : undefined}
                    rel={option.action.startsWith("http") ? "noopener noreferrer" : undefined}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-3 p-3 rounded-lg ${option.color} text-white transition-all duration-200 group`}
                  >
                    <option.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-medium text-sm">{option.title}</div>
                      <div className="text-xs opacity-90">{option.description}</div>
                    </div>
                  </motion.a>
                ))}

                {/* Quick info */}
                <div className="mt-4 pt-3 border-t text-center">
                  <p className="text-xs text-muted-foreground">
                    Expert support in Telugu, Hindi & English
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 1 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={`h-14 w-14 rounded-full shadow-lg ${
            isOpen ? "bg-destructive hover:bg-destructive/90" : "bg-gradient-to-r from-primary to-accent hover:opacity-90"
          }`}
        >
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Headphones className="h-6 w-6" />
            )}
          </motion.div>
        </Button>
        
        {/* Pulse ring */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
        )}
      </motion.div>
    </div>
  );
};

export default FloatingSupportWidget;
