import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Droplets, Fish, Activity, Shield, TrendingUp, Package, Sprout, FileText } from "lucide-react";

const FAQ = () => {
  const navigate = useNavigate();

  const pondPreparation = [
    {
      question: "What are the key steps in pond preparation?",
      answer: "1. Drain the pond completely and remove all debris. 2. Sun-dry the pond bottom for 7-10 days. 3. Remove excess mud and level the bottom. 4. Apply lime at 200-300 kg/acre. 5. Fill water to 1 meter depth. 6. Apply organic manure (cow dung or poultry litter) at 500-1000 kg/acre. 7. Apply urea and DAP fertilizers. 8. Allow 7-10 days for plankton bloom before stocking."
    },
    {
      question: "How much lime should be applied during pond preparation?",
      answer: "For acidic soils (pH below 7), apply 200-300 kg of lime per acre. For neutral to alkaline soils, 100-150 kg per acre is sufficient. Lime helps in adjusting pH, eliminating pathogens, and improving soil quality. Agricultural lime or dolomite lime is recommended."
    },
    {
      question: "What is the ideal pond depth for shrimp farming?",
      answer: "The ideal pond depth is 1.2 to 1.5 meters. This depth helps maintain stable water quality, adequate oxygen levels, and proper temperature control. Shallower ponds can have temperature fluctuations, while deeper ponds may have oxygen depletion at the bottom."
    },
    {
      question: "How to eliminate unwanted fish and predators from the pond?",
      answer: "Apply mahua oil cake at 200-250 ppm (200-250 kg per meter depth per acre) or tea seed powder. Allow 7-10 days before stocking. Alternatively, use chlorine at 30 ppm. Ensure complete removal by checking with a fine mesh net before stocking seeds."
    }
  ];

  const waterQuality = [
    {
      question: "What are the ideal water quality parameters for vannamei shrimp?",
      answer: "Temperature: 26-30°C, pH: 7.5-8.5, Dissolved Oxygen (DO): >5 mg/L, Salinity: 10-25 ppt (can tolerate 0.5-40 ppt), Ammonia: <0.1 mg/L, Nitrite: <0.1 mg/L, Alkalinity: 80-120 mg/L, Transparency (Secchi disk): 30-40 cm."
    },
    {
      question: "How often should I check water quality parameters?",
      answer: "Daily: Temperature, pH, DO (morning and evening), Transparency. Every 3 days: Alkalinity, Hardness. Weekly: Ammonia, Nitrite, Nitrate. Before and after water exchange: Complete parameter check. During disease outbreak: Check all parameters daily."
    },
    {
      question: "How to maintain dissolved oxygen levels in the pond?",
      answer: "Use paddle wheel aerators - minimum 4-6 HP per acre. Run aerators especially during night (10 PM to 6 AM) when oxygen is lowest. Maintain plankton at optimal levels. Avoid overfeeding. Do regular water exchange. Monitor stocking density. Add probiotics to improve water quality."
    },
    {
      question: "What causes sudden pH drops in shrimp ponds?",
      answer: "Causes: Heavy rainfall, algal death, organic matter decomposition, low alkalinity, CO2 accumulation. Solutions: Apply lime at 5-10 kg per acre. Increase aeration. Stop feeding temporarily. Do partial water exchange (10-20%). Apply dolomite for long-term pH stability."
    },
    {
      question: "How to manage ammonia levels in the pond?",
      answer: "Reduce feeding amount temporarily. Increase aeration to promote nitrification. Apply probiotics (Bacillus species). Do partial water exchange (15-20%). Add zeolite at 5-10 kg per acre. Check aerator functionality. Avoid overstocking. Regular pond bottom cleaning."
    }
  ];

  const feedManagement = [
    {
      question: "What is the recommended feeding rate for vannamei shrimp?",
      answer: "Week 1-4: 5-10% of body weight. Week 5-8: 4-6% of body weight. Week 9-12: 3-4% of body weight. Week 13+: 2-3% of body weight. Adjust based on feed consumption (check with check trays after 2 hours). Feed 3-4 times daily initially, increasing to 4-6 times for larger shrimp."
    },
    {
      question: "How to calculate daily feed requirement?",
      answer: "Formula: Daily Feed (kg) = (Average Body Weight in grams × Total Number of Shrimp × Feeding Rate %) / 1000. Example: If you have 100,000 shrimp averaging 10g at 5% feeding rate: (10 × 100,000 × 5) / 1000 = 50 kg feed per day. Always verify with check trays."
    },
    {
      question: "What protein content should feed have at different stages?",
      answer: "PL to 3 grams: 38-40% protein. 3-10 grams: 36-38% protein. 10-20 grams: 34-36% protein. Above 20 grams: 32-34% protein. Use high-quality branded feed. Store feed in cool, dry place. Use feed within 3 months of manufacture."
    },
    {
      question: "How to use check trays effectively?",
      answer: "Install 4-6 check trays per acre. Place in different pond areas. Give feed in check trays. Check after 1.5-2 hours. If feed completely consumed: increase feed amount. If feed remains: reduce feed amount. If shrimp are inactive: check water quality. Clean check trays daily."
    }
  ];

  const diseaseManagement = [
    {
      question: "What are common diseases in shrimp farming?",
      answer: "White Spot Syndrome Virus (WSSV): Most serious viral disease. Early Mortality Syndrome (EMS): Affects digestive system. Vibriosis: Bacterial infection causing shell disease. White Feces Disease: Digestive disorder. Black Gill Disease: Affects gills and respiration. Prevention is key - maintain good water quality and biosecurity."
    },
    {
      question: "How to prevent White Spot Disease?",
      answer: "Use SPF (Specific Pathogen Free) seeds. Screen water intake with fine mesh. Maintain optimal water quality. Avoid stress conditions. Don't overstock. Regular probiotic use. Maintain proper temperature (>28°C). Quarantine new stock. Remove infected/dead shrimp immediately."
    },
    {
      question: "What are signs of disease in shrimp?",
      answer: "Reduced feeding activity. Swimming near pond edges or surface. Loose shell or soft body. White spots on shell. Reddish discoloration. Gill discoloration (black/brown). White feces floating. Lethargy and weak swimming. Mortality increase. Immediate action required if any symptoms observed."
    },
    {
      question: "How to manage disease outbreaks?",
      answer: "Stop or reduce feeding. Increase aeration. Do water exchange (20-30%). Add probiotics and vitamins. Apply lime if needed. Consult aquaculture expert. Remove dead shrimp. Improve biosecurity. Test water quality. Consider partial harvest if severe. Document all observations."
    }
  ];

  const hatcherySeed = [
    {
      question: "What to look for when buying shrimp seeds (PL)?",
      answer: "Buy only SPF (Specific Pathogen Free) seeds. Check for: Active swimming against water current, Uniform size and color, Filled gut (black/dark line), No fouling on body, Age 10-12 days post larvae (PL10-PL12), PCR tested certificates available, Reputed hatchery with good track record."
    },
    {
      question: "How to acclimatize shrimp seeds before stocking?",
      answer: "Float the seed bags in pond water for 15-20 minutes to equalize temperature. Gradually add pond water to bags over 30-45 minutes. Check salinity difference - should not exceed 2-3 ppt. Maintain dissolved oxygen in bags. Release seeds gently during early morning or evening. Avoid direct sunlight during release."
    },
    {
      question: "What is the recommended stocking density?",
      answer: "For traditional ponds: 20-30 PL per square meter. For intensive farming with good aeration: 40-60 PL per square meter. For super-intensive with advanced systems: 80-120 PL per square meter. Higher density requires better management, more aeration, and expertise."
    },
    {
      question: "When is the best time to stock shrimp seeds?",
      answer: "Stock during stable weather conditions. Avoid rainy or very hot periods. Early morning (6-8 AM) or late evening (5-7 PM) is ideal. Ensure pond has good plankton bloom (green color). Water temperature should be 28-30°C. pH should be stable at 7.8-8.2. Complete all pond preparation 7-10 days before stocking."
    }
  ];

  const harvestPostHarvest = [
    {
      question: "When is the right time to harvest shrimp?",
      answer: "Shrimp size: 20-30 count per kg for good market price. Culture period: 90-120 days typically. FCR (Feed Conversion Ratio): Not increasing beyond 1.5-1.6. Market demand: Check current market rates. Pond conditions: Before water quality deteriorates. Always consider market price trends before harvesting."
    },
    {
      question: "How to harvest shrimp properly?",
      answer: "Stop feeding 24 hours before harvest. Lower water level gradually. Use cast nets or drag nets. Harvest during early morning (cool temperature). Keep harvested shrimp in ice immediately (1:1 ice to shrimp ratio). Avoid rough handling. Complete harvest within 3-4 hours. Transport in insulated containers with ice."
    },
    {
      question: "How to maintain shrimp quality after harvest?",
      answer: "Use clean ice made from potable water. Maintain 0-4°C temperature. Add ice at 1:1 ratio. Use insulated containers. Add sodium metabisulfite (SMS) to prevent blackspot (1-2 grams per kg). Remove dead or broken shrimp. Layer shrimp and ice properly. Transport to market/processing within 6-8 hours."
    },
    {
      question: "What are the current market size preferences?",
      answer: "Most demanded sizes: 30 count (30 shrimp per kg), 40 count, 50 count. Premium prices for: 20 count and larger. Export quality: Head-on, shell-on, uniform size, no black spots, no ammonia smell. Local market: All sizes accepted but 40-60 count most common. Check daily rates before harvesting."
    }
  ];

  const regulatoryCompliance = [
    {
      question: "What licenses are required for shrimp farming in India?",
      answer: "Registration with Coastal Aquaculture Authority (CAA). Environmental clearance for farms >2 hectares. Water usage permission from local authorities. Trade license from local municipality. FSSAI license for processing/selling. Export license if planning to export. GST registration for business operations."
    },
    {
      question: "What are CAA regulations for shrimp farming?",
      answer: "No farming within 50m of High Tide Line (HTL) for new farms. Farms must follow effluent treatment guidelines. Regular water quality monitoring required. Maintain proper records of inputs and production. Use of antibiotics is banned. Only approved chemicals and probiotics allowed. Regular inspections may be conducted."
    },
    {
      question: "Are antibiotics allowed in shrimp farming?",
      answer: "NO. Use of antibiotics in aquaculture is banned in India. Violation can lead to: Farm closure, Heavy penalties, Legal action, Export ban. Instead use: Probiotics, Immunostimulants, Organic acids, Herbal remedies, Good management practices for disease prevention."
    },
    {
      question: "What records should be maintained?",
      answer: "Seed purchase details with PCR certificates. Feed purchase and consumption records. Water quality test results. Daily mortality records. Chemical/probiotic usage log. Harvest records with size and quantity. Sale invoices and buyer details. Worker attendance and wages. These records may be needed for audits and certifications."
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark p-6 text-primary-foreground">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Aquaculture FAQs</h1>
            <p className="text-primary-foreground/80">Complete guide to shrimp farming</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue="pond" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="pond">
              <Sprout className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Pond Prep</span>
              <span className="sm:hidden">Pond</span>
            </TabsTrigger>
            <TabsTrigger value="water">
              <Droplets className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Water Quality</span>
              <span className="sm:hidden">Water</span>
            </TabsTrigger>
            <TabsTrigger value="feed">
              <Package className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Feed Mgmt</span>
              <span className="sm:hidden">Feed</span>
            </TabsTrigger>
            <TabsTrigger value="disease">
              <Shield className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Disease</span>
              <span className="sm:hidden">Disease</span>
            </TabsTrigger>
          </TabsList>

          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="seed">
              <Fish className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Seed</span>
              <span className="sm:hidden">Seed</span>
            </TabsTrigger>
            <TabsTrigger value="harvest">
              <TrendingUp className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Harvest</span>
              <span className="sm:hidden">Harvest</span>
            </TabsTrigger>
            <TabsTrigger value="regulatory">
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Regulatory</span>
              <span className="sm:hidden">Rules</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pond">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="h-5 w-5" />
                  Pond Preparation
                </CardTitle>
                <CardDescription>Essential steps for preparing your pond for shrimp culture</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {pondPreparation.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground whitespace-pre-line">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="water">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="h-5 w-5" />
                  Water Quality Management
                </CardTitle>
                <CardDescription>Maintaining optimal water conditions for healthy shrimp growth</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {waterQuality.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground whitespace-pre-line">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feed">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Feed Management
                </CardTitle>
                <CardDescription>Optimal feeding practices for maximum growth and FCR</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {feedManagement.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground whitespace-pre-line">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disease">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Disease Management
                </CardTitle>
                <CardDescription>Prevention and management of common shrimp diseases</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {diseaseManagement.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground whitespace-pre-line">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seed">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fish className="h-5 w-5" />
                  Hatchery & Seed Selection
                </CardTitle>
                <CardDescription>Choosing quality seeds and proper stocking practices</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {hatcherySeed.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground whitespace-pre-line">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="harvest">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Harvest & Post-Harvest
                </CardTitle>
                <CardDescription>Proper harvesting techniques and post-harvest handling</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {harvestPostHarvest.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground whitespace-pre-line">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="regulatory">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Regulatory Compliance
                </CardTitle>
                <CardDescription>Legal requirements and compliance for shrimp farming</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {regulatoryCompliance.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground whitespace-pre-line">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FAQ;
