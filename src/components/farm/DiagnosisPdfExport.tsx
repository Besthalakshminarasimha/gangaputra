import { Button } from "@/components/ui/button";
import { FileDown, Share2 } from "lucide-react";
import jsPDF from "jspdf";

interface Diagnosis {
  disease: string;
  confidence: number;
  treatment: string;
  prevention: string;
  severity: 'low' | 'medium' | 'high';
}

interface Props {
  diagnoses: Diagnosis[];
  symptoms: string;
  medicines?: { name: string; category: string; dosage: string | null }[];
}

const DiagnosisPdfExport = ({ diagnoses, symptoms, medicines }: Props) => {
  const exportPdf = () => {
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(18);
    doc.text("Disease Diagnosis Report", 20, y);
    y += 10;
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, y);
    y += 10;
    doc.text("GANGAPUTRA Aquaculture Platform", 20, y);
    y += 15;

    if (symptoms) {
      doc.setFontSize(12);
      doc.text("Reported Symptoms:", 20, y);
      y += 7;
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(symptoms, 170);
      doc.text(lines, 20, y);
      y += lines.length * 5 + 10;
    }

    diagnoses.forEach((d, i) => {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(13);
      doc.text(`#${i + 1} ${d.disease} (${d.confidence}% confidence)`, 20, y);
      y += 7;
      doc.setFontSize(10);
      doc.text(`Severity: ${d.severity.toUpperCase()}`, 20, y);
      y += 7;
      doc.text("Treatment:", 20, y); y += 5;
      const tLines = doc.splitTextToSize(d.treatment, 170);
      doc.text(tLines, 25, y); y += tLines.length * 5 + 3;
      doc.text("Prevention:", 20, y); y += 5;
      const pLines = doc.splitTextToSize(d.prevention, 170);
      doc.text(pLines, 25, y); y += pLines.length * 5 + 10;
    });

    if (medicines && medicines.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(13);
      doc.text("Suggested Medicines:", 20, y); y += 8;
      doc.setFontSize(10);
      medicines.forEach(m => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`• ${m.name} (${m.category})${m.dosage ? ` - ${m.dosage}` : ''}`, 25, y);
        y += 6;
      });
      y += 5;
    }

    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("Disclaimer: AI-based predictions. Consult a qualified aquaculture veterinarian.", 20, y);

    doc.save(`diagnosis-report-${Date.now()}.pdf`);
  };

  const shareResults = async () => {
    const text = diagnoses.map((d, i) =>
      `#${i + 1} ${d.disease} (${d.confidence}%) - ${d.severity} severity\nTreatment: ${d.treatment}`
    ).join("\n\n");

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Disease Diagnosis Report",
          text: `Disease Diagnosis Results:\n\n${symptoms ? `Symptoms: ${symptoms}\n\n` : ""}${text}\n\n- via GANGAPUTRA`,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={exportPdf}>
        <FileDown className="h-4 w-4 mr-1" />PDF
      </Button>
      <Button variant="outline" size="sm" onClick={shareResults}>
        <Share2 className="h-4 w-4 mr-1" />Share
      </Button>
    </div>
  );
};

export default DiagnosisPdfExport;
