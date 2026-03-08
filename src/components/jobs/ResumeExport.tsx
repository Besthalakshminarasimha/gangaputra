import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { toast } from "sonner";

interface ProfileData {
  full_name: string;
  phone: string;
  email?: string | null;
  age?: number | null;
  location: string;
  district: string;
  state: string;
  experience_years: number;
  skills: string[];
  education?: string | null;
  languages?: string[] | null;
  expected_salary?: string | null;
  availability: string;
  bio?: string | null;
}

interface Props {
  profile: ProfileData;
  endorsementCounts?: Record<string, number>;
}

const ResumeExport = ({ profile, endorsementCounts = {} }: Props) => {
  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      let y = 20;
      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(profile.full_name, margin, y);
      y += 10;

      // Contact info line
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      const contactParts = [profile.phone, profile.email, `${profile.district}, ${profile.state}`].filter(Boolean);
      doc.text(contactParts.join("  |  "), margin, y);
      y += 8;

      // Divider
      doc.setDrawColor(200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;

      // Summary
      doc.setTextColor(0);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("SUMMARY", margin, y);
      y += 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const summary = profile.bio || `Experienced aquaculture professional with ${profile.experience_years} years of experience. ${profile.availability} availability.`;
      const summaryLines = doc.splitTextToSize(summary, pageWidth - 2 * margin);
      doc.text(summaryLines, margin, y);
      y += summaryLines.length * 5 + 6;

      // Details
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("DETAILS", margin, y);
      y += 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      const details = [
        ["Experience", `${profile.experience_years} years`],
        ["Location", `${profile.location}, ${profile.district}, ${profile.state}`],
        ["Availability", profile.availability],
        ...(profile.age ? [["Age", String(profile.age)]] : []),
        ...(profile.education ? [["Education", profile.education]] : []),
        ...(profile.expected_salary ? [["Expected Salary", profile.expected_salary]] : []),
        ...(profile.languages?.length ? [["Languages", profile.languages.join(", ")]] : []),
      ];

      details.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(`${label}:`, margin, y);
        doc.setFont("helvetica", "normal");
        doc.text(String(value), margin + 40, y);
        y += 5;
      });
      y += 6;

      // Skills
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("SKILLS", margin, y);
      y += 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      profile.skills.forEach(skill => {
        const count = endorsementCounts[skill];
        const label = count ? `• ${skill} (${count} endorsements)` : `• ${skill}`;
        doc.text(label, margin, y);
        y += 5;
      });

      // Footer
      y += 10;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("Generated from GANGAPUTRA Job Board", margin, y);

      doc.save(`${profile.full_name.replace(/\s+/g, "_")}_Resume.pdf`);
      toast.success("Resume downloaded!");
    } catch (err) {
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={exportPDF} className="gap-1">
      <FileDown className="h-4 w-4" /> Download Resume
    </Button>
  );
};

export default ResumeExport;
