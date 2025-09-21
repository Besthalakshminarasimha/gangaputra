import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calculator, 
  Fish, 
  Wind, 
  Droplets, 
  Zap,
  HelpCircle
} from "lucide-react";

const Calculators = () => {
  const [pondLength, setPondLength] = useState("");
  const [pondWidth, setPondWidth] = useState("");
  const [pondDepth, setPondDepth] = useState("");
  const [volume, setVolume] = useState(0);

  const [feedAmount, setFeedAmount] = useState("");
  const [fishWeight, setFishWeight] = useState("");
  const [feedPercentage, setFeedPercentage] = useState("3");

  const calculateVolume = () => {
    const l = parseFloat(pondLength);
    const w = parseFloat(pondWidth);
    const d = parseFloat(pondDepth);
    if (l && w && d) {
      setVolume(l * w * d);
    }
  };

  const calculateFeed = () => {
    const weight = parseFloat(fishWeight);
    const percentage = parseFloat(feedPercentage);
    if (weight && percentage) {
      const dailyFeed = (weight * percentage) / 100;
      setFeedAmount(dailyFeed.toFixed(2));
    }
  };

  const faqs = [
    {
      question: "How often should I feed my fish?",
      answer: "Typically 2-3 times per day, depending on the species and water temperature. Avoid overfeeding as it can deteriorate water quality."
    },
    {
      question: "What is the ideal water temperature for shrimp farming?",
      answer: "For Vannamei shrimp: 26-30°C is optimal. For Black Tiger shrimp: 28-32°C is preferred."
    },
    {
      question: "How to calculate stocking density?",
      answer: "For shrimp: 60-80 PL per square meter. For fish: 2-3 fish per cubic meter for intensive farming."
    },
    {
      question: "When to harvest shrimp?",
      answer: "Vannamei: 90-120 days (15-20g size). Black Tiger: 120-150 days (25-30g size)."
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Calculators</h1>
        <p className="text-white/80">Essential tools for aqua farming calculations</p>
      </div>

      <div className="p-4 space-y-6">
        <Tabs defaultValue="pond-volume" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pond-volume">Pond Volume</TabsTrigger>
            <TabsTrigger value="feed">Feed Calc</TabsTrigger>
            <TabsTrigger value="more">More</TabsTrigger>
          </TabsList>

          {/* Pond Volume Calculator */}
          <TabsContent value="pond-volume">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="h-5 w-5" />
                  Pond Volume Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="length">Length (m)</Label>
                    <Input
                      id="length"
                      value={pondLength}
                      onChange={(e) => setPondLength(e.target.value)}
                      placeholder="100"
                      type="number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="width">Width (m)</Label>
                    <Input
                      id="width"
                      value={pondWidth}
                      onChange={(e) => setPondWidth(e.target.value)}
                      placeholder="50"
                      type="number"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="depth">Average Depth (m)</Label>
                  <Input
                    id="depth"
                    value={pondDepth}
                    onChange={(e) => setPondDepth(e.target.value)}
                    placeholder="1.5"
                    type="number"
                  />
                </div>
                <Button onClick={calculateVolume} className="w-full">
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate Volume
                </Button>
                {volume > 0 && (
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <p className="text-lg font-bold">Pond Volume: {volume.toLocaleString()} cubic meters</p>
                    <p className="text-sm text-muted-foreground">
                      Equivalent to {(volume * 1000).toLocaleString()} liters
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feed Calculator */}
          <TabsContent value="feed">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fish className="h-5 w-5" />
                  Feed Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fish-weight">Total Fish Weight (kg)</Label>
                  <Input
                    id="fish-weight"
                    value={fishWeight}
                    onChange={(e) => setFishWeight(e.target.value)}
                    placeholder="1000"
                    type="number"
                  />
                </div>
                <div>
                  <Label htmlFor="feed-percentage">Feed Percentage (%)</Label>
                  <Input
                    id="feed-percentage"
                    value={feedPercentage}
                    onChange={(e) => setFeedPercentage(e.target.value)}
                    placeholder="3"
                    type="number"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Juvenile: 5-8%, Adult: 2-4%
                  </p>
                </div>
                <Button onClick={calculateFeed} className="w-full">
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate Feed
                </Button>
                {feedAmount && (
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <p className="text-lg font-bold">Daily Feed Required: {feedAmount} kg</p>
                    <p className="text-sm text-muted-foreground">
                      Monthly requirement: {(parseFloat(feedAmount) * 30).toFixed(1)} kg
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* More Calculators */}
          <TabsContent value="more">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Wind className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <h3 className="font-medium">Aeration Calculator</h3>
                  <Button variant="outline" size="sm" className="mt-2">
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Fish className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <h3 className="font-medium">Feeder Calibration</h3>
                  <Button variant="outline" size="sm" className="mt-2">
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Droplets className="h-8 w-8 mx-auto mb-2 text-teal-500" />
                  <h3 className="font-medium">Shrimp Molarity</h3>
                  <Button variant="outline" size="sm" className="mt-2">
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <h3 className="font-medium">Power Factor</h3>
                  <Button variant="outline" size="sm" className="mt-2">
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* FAQs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border-l-4 border-primary pl-4">
                <h4 className="font-medium mb-1">{faq.question}</h4>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Calculators;