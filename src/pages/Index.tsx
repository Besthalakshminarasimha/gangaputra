import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import DashboardPreview from "@/components/DashboardPreview";
import MarketplaceSection from "@/components/MarketplaceSection";
import FeaturesGrid from "@/components/FeaturesGrid";
import Footer from "@/components/Footer";

const Index = () => {
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
