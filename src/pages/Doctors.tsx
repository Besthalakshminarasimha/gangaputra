import DoctorDirectory from "@/components/farm/DoctorDirectory";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const Doctors = () => (
  <div className="min-h-screen bg-background pb-28">
    <div className="bg-destructive p-6 text-destructive-foreground">
      <h1 className="text-2xl font-bold">Aqua Doctors</h1>
      <p className="text-sm opacity-90">Emergency help for sick ponds — call or book an expert.</p>
      <Button asChild variant="secondary" size="sm" className="mt-3">
        <a href="tel:7569373499"><Phone className="mr-2 h-4 w-4" />Call support now</a>
      </Button>
    </div>
    <div className="p-4">
      <DoctorDirectory />
    </div>
  </div>
);

export default Doctors;
