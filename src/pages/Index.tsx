import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import DashboardPreview from "@/components/DashboardPreview";
import MarketplaceSection from "@/components/MarketplaceSection";
import FeaturesGrid from "@/components/FeaturesGrid";
import Footer from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <DashboardPreview />
        <MarketplaceSection />
        <FeaturesGrid />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
