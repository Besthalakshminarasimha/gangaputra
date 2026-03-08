import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const SKILL_OPTIONS = [
  "Pond Management", "Water Quality Testing", "Feed Management", "Disease Diagnosis",
  "Hatchery Operations", "Harvesting", "Equipment Maintenance", "Aeration Systems",
  "Biofloc Technology", "Shrimp Farming", "Fish Farming", "Crab Farming",
  "Lab Technician", "Driving", "Electrical Work", "Plumbing", "Accounting",
];

const STATES = [
  "Andhra Pradesh", "Tamil Nadu", "Karnataka", "Telangana", "Kerala",
  "West Bengal", "Odisha", "Gujarat", "Maharashtra", "Goa",
];

interface Props {
  userId: string;
  onSuccess: () => void;
}

const JobPostingForm = ({ userId, onSuccess }: Props) => {
  const [form, setForm] = useState({
    title: "", description: "", location: "", district: "", state: "",
    skills_required: [] as string[], salary_range: "", job_type: "full-time",
  });
  const [saving, setSaving] = useState(false);

  const addSkill = (skill: string) => {
    if (skill && !form.skills_required.includes(skill)) {
      setForm(f => ({ ...f, skills_required: [...f.skills_required, skill] }));
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.location || !form.district || !form.state) {
      toast.error("Please fill all required fields");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("job_postings").insert({
      employer_id: userId,
      title: form.title,
      description: form.description || null,
      location: form.location,
      district: form.district,
      state: form.state,
      skills_required: form.skills_required,
      salary_range: form.salary_range || null,
      job_type: form.job_type,
    } as any);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Job posted successfully!");
    setForm({ title: "", description: "", location: "", district: "", state: "", skills_required: [], salary_range: "", job_type: "full-time" });
    onSuccess();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2"><Plus className="h-5 w-5" /> Post a Job</CardTitle>
        <CardDescription>Describe the position you're hiring for</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Job Title *</Label>
          <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Pond Supervisor, Feed Manager" />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe responsibilities, requirements..." rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Location *</Label>
            <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Village / Town" />
          </div>
          <div>
            <Label>District *</Label>
            <Input value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} placeholder="District" />
          </div>
          <div>
            <Label>State *</Label>
            <Select value={form.state} onValueChange={v => setForm(f => ({ ...f, state: v }))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Job Type</Label>
            <Select value={form.job_type} onValueChange={v => setForm(f => ({ ...f, job_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="full-time">Full Time</SelectItem>
                <SelectItem value="part-time">Part Time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="seasonal">Seasonal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Salary Range</Label>
            <Input value={form.salary_range} onChange={e => setForm(f => ({ ...f, salary_range: e.target.value }))} placeholder="e.g. ₹12,000 - ₹18,000/month" />
          </div>
        </div>
        <div>
          <Label>Required Skills</Label>
          <div className="flex flex-wrap gap-1 mb-2">
            {form.skills_required.map(s => (
              <Badge key={s} variant="default" className="cursor-pointer" onClick={() => setForm(f => ({ ...f, skills_required: f.skills_required.filter(x => x !== s) }))}>{s} ✕</Badge>
            ))}
          </div>
          <Select onValueChange={addSkill}>
            <SelectTrigger><SelectValue placeholder="Add required skill" /></SelectTrigger>
            <SelectContent>{SKILL_OPTIONS.filter(s => !form.skills_required.includes(s)).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button onClick={handleSubmit} disabled={saving} className="w-full">
          {saving ? "Posting..." : "Post Job"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default JobPostingForm;
