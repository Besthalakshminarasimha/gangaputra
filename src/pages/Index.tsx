import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";
import DashboardPreview from "@/components/DashboardPreview";
import MarketplaceSection from "@/components/MarketplaceSection";
import FeaturesGrid from "@/components/FeaturesGrid";
import Footer from "@/components/Footer";
import FloatingSupportWidget from "@/components/FloatingSupportWidget";
import StickyCtaButton from "@/components/StickyCtaButton";
import ScrollProgressBar from "@/components/ScrollProgressBar";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    } else if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <ScrollProgressBar />
      <Header />
      <main>
        <HeroSection />
        <TestimonialsCarousel />
        <DashboardPreview />
        <MarketplaceSection />
        <FeaturesGrid />
      </main>
      <Footer />
      <FloatingSupportWidget />
      <StickyCtaButton />
    </div>
  );
};

export default Index;
