import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Plus, Calendar, Trash2, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

interface ActivityLog {
  id: string;
  date: string;
  type: string;
  description: string;
  value?: string;
}

const TraceabilityLog = () => {
  const [batchId, setBatchId] = useState("BATCH-2024-001");
  const [stockingDate, setStockingDate] = useState("2024-10-15");
  const [species, setSpecies] = useState("Vannamei Shrimp");
  const [initialCount, setInitialCount] = useState("300000");
  const [farmName, setFarmName] = useState("Ganga Aqua Farm");
  const [pondNumber, setPondNumber] = useState("Pond A1");
  const [activities, setActivities] = useState<ActivityLog[]>([
    { id: "1", date: "2024-10-15", type: "Stocking", description: "Initial PL stocking", value: "300,000 PL" },
    { id: "2", date: "2024-10-20", type: "Water Quality", description: "pH: 7.8, DO: 5.5, Salinity: 18 ppt", value: "" },
    { id: "3", date: "2024-10-25", type: "Feeding", description: "Started feeding program", value: "5 kg/day" },
    { id: "4", date: "2024-11-01", type: "Sampling", description: "ABW check", value: "2.5g" },
    { id: "5", date: "2024-11-15", type: "Water Quality", description: "pH: 8.0, DO: 5.8, Salinity: 20 ppt", value: "" },
    { id: "6", date: "2024-12-01", type: "Sampling", description: "ABW check", value: "8.2g" },
    { id: "7", date: "2024-12-15", type: "Treatment", description: "Probiotic application", value: "1L/acre" },
  ]);
  const [newActivity, setNewActivity] = useState({ date: "", type: "Feeding", description: "", value: "" });
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const activityTypes = [
    "Stocking", "Feeding", "Water Quality", "Sampling", "Treatment", 
    "Harvest", "Maintenance", "Mortality", "Other"
  ];

  const addActivity = () => {
    if (!newActivity.date || !newActivity.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in date and description",
        variant: "destructive"
      });
      return;
    }

    setActivities([...activities, {
      id: Date.now().toString(),
      ...newActivity
    }].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    
    setNewActivity({ date: "", type: "Feeding", description: "", value: "" });
    toast({ title: "Activity Added", description: "Log entry recorded successfully" });
  };

  const removeActivity = (id: string) => {
    setActivities(activities.filter(a => a.id !== id));
  };

  const generatePDF = async () => {
    setGenerating(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(0, 128, 128);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("Traceability Report", 14, 20);
      doc.setFontSize(12);
      doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`, 14, 30);

      // Reset text color
      doc.setTextColor(0, 0, 0);

      // Batch Information
      doc.setFontSize(14);
      doc.text("Batch Information", 14, 55);
      doc.setFontSize(10);
      
      const batchInfo = [
        ["Batch ID", batchId],
        ["Farm Name", farmName],
        ["Pond Number", pondNumber],
        ["Species", species],
        ["Stocking Date", format(new Date(stockingDate), 'dd MMM yyyy')],
        ["Initial Stock", `${parseInt(initialCount).toLocaleString()} PL`],
      ];

      autoTable(doc, {
        startY: 60,
        head: [],
        body: batchInfo,
        theme: 'plain',
        styles: { fontSize: 10 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 40 },
          1: { cellWidth: 100 }
        }
      });

      // Activity Log
      doc.setFontSize(14);
      doc.text("Activity Log", 14, (doc as any).lastAutoTable.finalY + 15);

      const activityData = activities.map(a => [
        format(new Date(a.date), 'dd MMM yyyy'),
        a.type,
        a.description,
        a.value || '-'
      ]);

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Date', 'Type', 'Description', 'Value']],
        body: activityData,
        theme: 'striped',
        headStyles: { fillColor: [0, 128, 128] },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 30 },
          2: { cellWidth: 80 },
          3: { cellWidth: 35 }
        }
      });

      // Footer
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text("This document is generated by Ganga Aqua Farm Management System", 14, finalY);
      doc.text("For export compliance and quality assurance purposes", 14, finalY + 5);

      // Save PDF
      doc.save(`Traceability_${batchId}_${format(new Date(), 'yyyyMMdd')}.pdf`);

      toast({
        title: "PDF Generated",
        description: "Traceability report downloaded successfully",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Traceability Log
          </div>
          <Button onClick={generatePDF} disabled={generating}>
            {generating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export PDF
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Batch Info */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Batch ID</Label>
            <Input value={batchId} onChange={(e) => setBatchId(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Farm Name</Label>
            <Input value={farmName} onChange={(e) => setFarmName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Pond Number</Label>
            <Input value={pondNumber} onChange={(e) => setPondNumber(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Species</Label>
            <Input value={species} onChange={(e) => setSpecies(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Stocking Date</Label>
            <Input type="date" value={stockingDate} onChange={(e) => setStockingDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Initial Count (PL)</Label>
            <Input type="number" value={initialCount} onChange={(e) => setInitialCount(e.target.value)} />
          </div>
        </div>

        {/* Add Activity */}
        <div className="border rounded-lg p-3 space-y-3">
          <p className="font-medium text-sm">Add Activity Log</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Input
              type="date"
              value={newActivity.date}
              onChange={(e) => setNewActivity({...newActivity, date: e.target.value})}
            />
            <Select value={newActivity.type} onValueChange={(v) => setNewActivity({...newActivity, type: v})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Description"
              value={newActivity.description}
              onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
            />
            <div className="flex gap-2">
              <Input
                placeholder="Value (optional)"
                value={newActivity.value}
                onChange={(e) => setNewActivity({...newActivity, value: e.target.value})}
              />
              <Button size="sm" onClick={addActivity}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Activity List */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {activities.map(activity => (
            <div key={activity.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-center min-w-[60px]">
                  <p className="text-xs text-muted-foreground">{format(new Date(activity.date), 'dd MMM')}</p>
                  <p className="text-xs font-medium">{format(new Date(activity.date), 'yyyy')}</p>
                </div>
                <Badge variant="secondary">{activity.type}</Badge>
                <div>
                  <p className="text-sm">{activity.description}</p>
                  {activity.value && (
                    <p className="text-xs text-muted-foreground">{activity.value}</p>
                  )}
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => removeActivity(activity.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TraceabilityLog;
