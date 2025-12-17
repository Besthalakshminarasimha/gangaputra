import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Phone, CalendarIcon, ChevronRight, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const CROPS = [
  "Vannamei Shrimp (L. vannamei)",
  "Black Tiger Shrimp (P. monodon)",
  "Indian White Prawn",
  "Rohu Fish",
  "Catla Fish",
  "Pangasius",
  "Tilapia",
  "IMC (Indian Major Carps)",
];

const COUNT_OPTIONS = Array.from({ length: 10 }, (_, i) => (i + 1) * 10); // 10, 20, 30... 100

const QUANTITY_OPTIONS = [1, 2, 3, 5, 10, 15, 20, 25, 30, 50];

const STATES_DISTRICTS: Record<string, string[]> = {
  "Andhra Pradesh": ["East Godavari", "West Godavari", "Krishna", "Guntur", "Prakasam", "Nellore", "Visakhapatnam", "Srikakulam"],
  "Tamil Nadu": ["Nagapattinam", "Thanjavur", "Ramanathapuram", "Tuticorin", "Kanyakumari", "Chennai"],
  "Gujarat": ["Junagadh", "Porbandar", "Bharuch", "Valsad", "Navsari", "Surat"],
  "West Bengal": ["South 24 Parganas", "North 24 Parganas", "East Midnapore", "Hooghly", "Howrah"],
  "Odisha": ["Balasore", "Bhadrak", "Kendrapara", "Jagatsinghpur", "Puri", "Ganjam"],
  "Kerala": ["Alappuzha", "Ernakulam", "Thrissur", "Kollam", "Kannur"],
};

const TradeSection = () => {
  const { toast } = useToast();
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [step, setStep] = useState(1);
  
  // Form data
  const [selectedCrop, setSelectedCrop] = useState("");
  const [count, setCount] = useState("");
  const [customCount, setCustomCount] = useState("");
  const [quantity, setQuantity] = useState("");
  const [customQuantity, setCustomQuantity] = useState("");
  const [pickupDate, setPickupDate] = useState<Date | undefined>();
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");

  const resetForm = () => {
    setStep(1);
    setSelectedCrop("");
    setCount("");
    setCustomCount("");
    setQuantity("");
    setCustomQuantity("");
    setPickupDate(undefined);
    setState("");
    setDistrict("");
    setAddress("");
  };

  const handleCallUs = () => {
    window.location.href = "tel:7569373499";
  };

  const handleCancel = () => {
    setShowSellDialog(false);
    resetForm();
  };

  const handleNext = () => {
    if (step === 1 && !selectedCrop) {
      toast({ title: "Please select a crop", variant: "destructive" });
      return;
    }
    if (step === 2 && !count && !customCount) {
      toast({ title: "Please select or enter count", variant: "destructive" });
      return;
    }
    if (step === 3 && !quantity && !customQuantity) {
      toast({ title: "Please select or enter quantity", variant: "destructive" });
      return;
    }
    if (step === 4 && !pickupDate) {
      toast({ title: "Please select pickup date", variant: "destructive" });
      return;
    }
    if (step === 5 && (!state || !district || !address)) {
      toast({ title: "Please fill all location details", variant: "destructive" });
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSendRequest = () => {
    const finalCount = count === "manual" ? customCount : count;
    const finalQuantity = quantity === "manual" ? customQuantity : quantity;
    
    toast({
      title: "Request Sent Successfully!",
      description: `We will pick up ${finalQuantity} tons of ${selectedCrop} (Count: ${finalCount}) from ${district}, ${state} on ${pickupDate ? format(pickupDate, "PPP") : ""}.`,
    });
    
    setShowSellDialog(false);
    resetForm();
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Choose the crop you want to sell</Label>
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto">
              {CROPS.map((crop) => (
                <Button
                  key={crop}
                  type="button"
                  variant={selectedCrop === crop ? "default" : "outline"}
                  className="justify-start h-auto py-3 text-left"
                  onClick={() => setSelectedCrop(crop)}
                >
                  {crop}
                </Button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <Label className="text-lg font-semibold">How much count do you want to sell?</Label>
            <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
              {COUNT_OPTIONS.map((c) => (
                <Button
                  key={c}
                  type="button"
                  variant={count === c.toString() ? "default" : "outline"}
                  onClick={() => { setCount(c.toString()); setCustomCount(""); }}
                >
                  {c}
                </Button>
              ))}
              <Button
                type="button"
                variant={count === "manual" ? "default" : "outline"}
                onClick={() => setCount("manual")}
              >
                Manual
              </Button>
            </div>
            {count === "manual" && (
              <div className="space-y-2">
                <Label>Enter count manually</Label>
                <Input
                  type="number"
                  placeholder="Enter count"
                  value={customCount}
                  onChange={(e) => setCustomCount(e.target.value)}
                />
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <Label className="text-lg font-semibold">How much quantity available to sell? (in tons)</Label>
            <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
              {QUANTITY_OPTIONS.map((q) => (
                <Button
                  key={q}
                  type="button"
                  variant={quantity === q.toString() ? "default" : "outline"}
                  onClick={() => { setQuantity(q.toString()); setCustomQuantity(""); }}
                >
                  {q} ton{q > 1 ? "s" : ""}
                </Button>
              ))}
              <Button
                type="button"
                variant={quantity === "manual" ? "default" : "outline"}
                onClick={() => setQuantity("manual")}
              >
                Manual
              </Button>
            </div>
            {quantity === "manual" && (
              <div className="space-y-2">
                <Label>Enter quantity in tons manually</Label>
                <Input
                  type="number"
                  placeholder="Enter tons"
                  value={customQuantity}
                  onChange={(e) => setCustomQuantity(e.target.value)}
                />
              </div>
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <Label className="text-lg font-semibold">When do you want us to pick up your harvest?</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !pickupDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {pickupDate ? format(pickupDate, "PPP") : "Select pickup date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={pickupDate}
                  onSelect={setPickupDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {pickupDate && (
              <p className="text-sm text-muted-foreground">
                Selected: {format(pickupDate, "PPPP")}
              </p>
            )}
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Where do you want us to pick up your harvest?</Label>
            
            <div className="space-y-2">
              <Label>State</Label>
              <Select value={state} onValueChange={(val) => { setState(val); setDistrict(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(STATES_DISTRICTS).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {state && (
              <div className="space-y-2">
                <Label>District</Label>
                <Select value={district} onValueChange={setDistrict}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATES_DISTRICTS[state]?.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {district && (
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  placeholder="Enter your complete address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Trade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              className="h-20 flex-col gap-2" 
              onClick={() => setShowSellDialog(true)}
            >
              <ShoppingCart className="h-6 w-6" />
              Sell Crop
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2" 
              onClick={handleCallUs}
            >
              <Phone className="h-6 w-6" />
              Call Us
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showSellDialog} onOpenChange={(open) => { if (!open) handleCancel(); else setShowSellDialog(true); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sell Your Crop - Step {step} of 5</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {renderStepContent()}
          </div>
          
          <DialogFooter className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            {step < 5 ? (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSendRequest}>
                Send Request
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TradeSection;
