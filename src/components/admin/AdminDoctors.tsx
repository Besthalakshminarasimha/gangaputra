import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Edit, Loader2, UserRound } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  qualification: string;
  experience_years: number;
  phone: string | null;
  email: string | null;
  location: string;
  image_url: string | null;
  consultation_fee: number | null;
  available_hours: string | null;
  languages: string[] | null;
  bio: string | null;
  is_active: boolean | null;
}

const emptyForm = {
  name: "", specialization: "", qualification: "", experience_years: 0,
  phone: "", email: "", location: "", image_url: "", consultation_fee: 0,
  available_hours: "", languages: "", bio: "",
};

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { toast } = useToast();

  const fetchDoctors = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("doctors").select("*").order("created_at", { ascending: false });
    if (!error) setDoctors(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchDoctors(); }, []);

  const openEdit = (doc: Doctor) => {
    setEditId(doc.id);
    setForm({
      name: doc.name, specialization: doc.specialization, qualification: doc.qualification,
      experience_years: doc.experience_years, phone: doc.phone || "", email: doc.email || "",
      location: doc.location, image_url: doc.image_url || "", consultation_fee: doc.consultation_fee || 0,
      available_hours: doc.available_hours || "", languages: (doc.languages || []).join(", "), bio: doc.bio || "",
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.specialization || !form.qualification || !form.location) {
      toast({ title: "Missing Fields", description: "Name, specialization, qualification, and location are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name, specialization: form.specialization, qualification: form.qualification,
      experience_years: form.experience_years, phone: form.phone || null, email: form.email || null,
      location: form.location, image_url: form.image_url || null,
      consultation_fee: form.consultation_fee || null, available_hours: form.available_hours || null,
      languages: form.languages ? form.languages.split(",").map(l => l.trim()).filter(Boolean) : [],
      bio: form.bio || null,
    };

    const { error } = editId
      ? await supabase.from("doctors").update(payload).eq("id", editId)
      : await supabase.from("doctors").insert(payload);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editId ? "Updated" : "Added", description: `Doctor ${editId ? "updated" : "added"} successfully` });
      setDialogOpen(false);
      fetchDoctors();
    }
    setSaving(false);
  };

  const toggleActive = async (id: string, current: boolean | null) => {
    await supabase.from("doctors").update({ is_active: !current }).eq("id", id);
    fetchDoctors();
  };

  const deleteDoctor = async (id: string) => {
    if (!confirm("Delete this doctor?")) return;
    await supabase.from("doctors").delete().eq("id", id);
    fetchDoctors();
    toast({ title: "Deleted" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Manage Doctors</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" />Add Doctor</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? "Edit" : "Add"} Doctor</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Specialization *</Label><Input placeholder="e.g. Aquaculture Veterinarian" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} /></div>
              <div><Label>Qualification *</Label><Input placeholder="e.g. BVSc, MVSc (Aquatic Medicine)" value={form.qualification} onChange={e => setForm({ ...form, qualification: e.target.value })} /></div>
              <div><Label>Experience (years)</Label><Input type="number" value={form.experience_years} onChange={e => setForm({ ...form, experience_years: parseInt(e.target.value) || 0 })} /></div>
              <div><Label>Location *</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Consultation Fee (₹)</Label><Input type="number" value={form.consultation_fee} onChange={e => setForm({ ...form, consultation_fee: parseFloat(e.target.value) || 0 })} /></div>
              <div><Label>Available Hours</Label><Input placeholder="e.g. Mon-Sat 9AM-5PM" value={form.available_hours} onChange={e => setForm({ ...form, available_hours: e.target.value })} /></div>
              <div><Label>Languages (comma separated)</Label><Input placeholder="e.g. Telugu, English, Hindi" value={form.languages} onChange={e => setForm({ ...form, languages: e.target.value })} /></div>
              <div><Label>Image URL</Label><Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} /></div>
              <div><Label>Bio</Label><Textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={3} /></div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {editId ? "Update" : "Add"} Doctor
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : doctors.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No doctors added yet</p>
      ) : (
        <div className="space-y-3">
          {doctors.map(doc => (
            <Card key={doc.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      {doc.image_url ? <img src={doc.image_url} className="h-12 w-12 rounded-full object-cover" /> : <UserRound className="h-6 w-6 text-muted-foreground" />}
                    </div>
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">{doc.specialization}</p>
                      <p className="text-xs text-muted-foreground">{doc.qualification} • {doc.experience_years}yrs • {doc.location}</p>
                      {doc.phone && <p className="text-xs text-muted-foreground">📞 {doc.phone}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={doc.is_active ?? true} onCheckedChange={() => toggleActive(doc.id, doc.is_active)} />
                    <Button variant="ghost" size="icon" onClick={() => openEdit(doc)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteDoctor(doc.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDoctors;
