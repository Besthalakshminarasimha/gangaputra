import { Home, Fish, BookOpen, Calculator, Briefcase, ShoppingBag, Bot } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navigationItems = [
  { id: "home", icon: Home, label: "Home", path: "/dashboard" },
  { id: "farm", icon: Fish, label: "Farm", path: "/farm" },
  { id: "store", icon: ShoppingBag, label: "Store", path: "/store" },
  { id: "aquapedia", icon: BookOpen, label: "Aquapedia", path: "/aquapedia" },
  { id: "calculators", icon: Calculator, label: "Calc", path: "/calculators" },
  { id: "jobs", icon: Briefcase, label: "Jobs", path: "/jobs" },
];

const BottomNavigation = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around py-2">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center min-w-[60px] py-2 px-1 rounded-lg transition-colors",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;