import { useState } from "react";
import { Home, Fish, BookOpen, Calculator, Briefcase, ShoppingBag, Bot, Menu, LogOut, User, QrCode, Package, Stethoscope, Landmark } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const navigationItems = [
  { id: "home", icon: Home, label: "Home", path: "/dashboard", section: "My farm" },
  { id: "farm", icon: Fish, label: "Farm", path: "/farm", section: "My farm" },
  { id: "loans", icon: Landmark, label: "Farm Loans", path: "/farm?tab=loans", section: "My farm" },
  { id: "passport", icon: QrCode, label: "Farm Passport", path: "/passport", section: "My farm" },
  { id: "doctors", icon: Stethoscope, label: "Aqua Doctors · Emergency help", path: "/doctors", section: "Help & services" },
  { id: "store", icon: ShoppingBag, label: "Store", path: "/store", section: "Help & services" },
  { id: "orders", icon: Package, label: "My Orders", path: "/orders", section: "Help & services" },
  { id: "aquapedia", icon: BookOpen, label: "Aquapedia", path: "/aquapedia", section: "Help & services" },
  { id: "calculators", icon: Calculator, label: "Calculators", path: "/calculators", section: "Tools & learning" },
  { id: "jobs", icon: Briefcase, label: "Jobs", path: "/jobs", section: "Tools & learning" },
  { id: "ai-agents", icon: Bot, label: "AI Agents", path: "/ai-agents", section: "Tools & learning" },
  { id: "profile", icon: User, label: "Profile", path: "/profile", section: "Account" },
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
        <div className="flex items-center justify-start px-3 py-2">
          <Button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            variant="ghost"
            className="h-auto min-w-[64px] flex-col px-2 py-1.5 text-muted-foreground"
          >
            <Menu className="mb-1 h-5 w-5" />
            <span className="text-xs font-medium">Menu</span>
          </Button>
        </div>
      </nav>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="flex w-72 flex-col">
          <SheetHeader>
            <SheetTitle>GANGAPUTRA</SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex-1 space-y-4 overflow-y-auto">
            {navigationItems.map((item, index) => {
              const Icon = item.icon;
              const active = item.id === "loans"
                ? location.pathname === "/farm" && new URLSearchParams(location.search).get("tab") === "loans"
                : item.id === "farm"
                  ? location.pathname === "/farm" && new URLSearchParams(location.search).get("tab") !== "loans"
                  : location.pathname === item.path;
              const startsSection = index === 0 || navigationItems[index - 1]?.section !== item.section;
              return (
                <div key={item.id}>
                  {startsSection && <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.section}</p>}
                  <Link
                    to={item.path}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent",
                      item.id === "doctors" && "text-destructive"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </div>
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
