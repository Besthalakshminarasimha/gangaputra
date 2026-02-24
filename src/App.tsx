import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Suspense, lazy } from "react";
import PageTransition from "./components/PageTransition";
import { PageSkeleton } from "./components/LoadingSkeletons";
import BottomNavigation from "./components/BottomNavigation";
import AIAssistant from "./components/AIAssistant";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Farm = lazy(() => import("./pages/Farm"));
const Aquapedia = lazy(() => import("./pages/Aquapedia"));
const Calculators = lazy(() => import("./pages/Calculators"));
const Store = lazy(() => import("./pages/Store"));
const Orders = lazy(() => import("./pages/Orders"));
const PriceAlertsHistory = lazy(() => import("./pages/PriceAlertsHistory"));
const Jobs = lazy(() => import("./pages/Jobs"));
const AdminAuth = lazy(() => import("./pages/AdminAuth"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageSkeleton />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Index /></PageTransition>} />
          <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
          <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
          <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
          <Route path="/faq" element={<PageTransition><FAQ /></PageTransition>} />
          <Route path="/farm" element={<PageTransition><Farm /></PageTransition>} />
          <Route path="/aquapedia" element={<PageTransition><Aquapedia /></PageTransition>} />
          <Route path="/calculators" element={<PageTransition><Calculators /></PageTransition>} />
          <Route path="/store" element={<PageTransition><Store /></PageTransition>} />
          <Route path="/orders" element={<PageTransition><Orders /></PageTransition>} />
          <Route path="/price-alerts" element={<PageTransition><PriceAlertsHistory /></PageTransition>} />
          <Route path="/jobs" element={<PageTransition><Jobs /></PageTransition>} />
          <Route path="/admin" element={<PageTransition><AdminAuth /></PageTransition>} />
          <Route path="/admin/dashboard" element={<PageTransition><AdminDashboard /></PageTransition>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

// Wrapper component to use keyboard shortcuts inside Router
const KeyboardShortcutsProvider = ({ children }: { children: React.ReactNode }) => {
  useKeyboardShortcuts();
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <KeyboardShortcutsProvider>
          <div className="relative">
            <AnimatedRoutes />
            <BottomNavigation />
            <AIAssistant />
          </div>
        </KeyboardShortcutsProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
