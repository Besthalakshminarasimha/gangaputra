import { useState } from "react";
import { Home, Fish, BookOpen, Calculator, Briefcase, ShoppingBag, Bot, Menu, Stethoscope, LogOut, User, QrCode, Package } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const navigationItems = [
  { id: "home", icon: Home, label: "Home", path: "/dashboard" },
  { id: "farm", icon: Fish, label: "Farm", path: "/farm" },
  { id: "passport", icon: QrCode, label: "Farm Passport", path: "/passport" },
  { id: "store", icon: ShoppingBag, label: "Store", path: "/store" },
  { id: "orders", icon: Package, label: "My Orders", path: "/orders" },
  { id: "aquapedia", icon: BookOpen, label: "Aquapedia", path: "/aquapedia" },
  { id: "calculators", icon: Calculator, label: "Calculators", path: "/calculators" },
  { id: "jobs", icon: Briefcase, label: "Jobs", path: "/jobs" },
  { id: "ai-agents", icon: Bot, label: "AI Agents", path: "/ai-agents" },
  { id: "profile", icon: User, label: "Profile", path: "/profile" },
];

const HIDDEN_PREFIXES = ["/auth", "/admin", "/health-report", "/passport/view", "/.lovable"];

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user || location.pathname === "/" || HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p))) return null;

  const handleLogout = async () => {
    setOpen(false);
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card">
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="flex min-w-[64px] flex-col items-center rounded-lg px-2 py-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Menu className="mb-1 h-5 w-5" />
            <span className="text-xs font-medium">Menu</span>
          </button>
          <Link
            to="/doctors"
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-3 font-semibold text-destructive-foreground shadow",
              location.pathname === "/doctors" && "ring-2 ring-destructive/40"
            )}
          >
            <Stethoscope className="h-5 w-5" />
            Aqua Doctors · Emergency
          </Link>
        </div>
      </nav>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex w-72 flex-col">
          <SheetHeader>
            <SheetTitle>GANGAPUTRA</SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex-1 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default BottomNavigation;
