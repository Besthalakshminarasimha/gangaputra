import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Upload, Bug } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Disease {
  id: string;
  category: "shrimp" | "fish";
  name: string;
  description: string | null;
  symptoms: string | null;
  treatment: string | null;
  prevention: string | null;
  image_urls: string[];
  created_at: string;
}

const AdminDiseases = () => {
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDisease, setEditingDisease] = useState<Disease | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    category: "shrimp" as "shrimp" | "fish",
    name: "",
    description: "",
    symptoms: "",
    treatment: "",
    prevention: "",
    image_urls: [] as string[],
  });

  useEffect(() => {
    fetchDiseases();
  }, []);

  const fetchDiseases = async () => {
    const { data, error } = await supabase
      .from("diseases")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching diseases:", error);
    } else {
      setDiseases(data || []);
    }
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      const fileExt = file.name.split(".").pop();
      const fileName = `diseases/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("content")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("content")
        .getPublicUrl(fileName);

      newUrls.push(publicUrl);
    }

    setFormData(prev => ({
      ...prev,
      image_urls: [...prev.image_urls, ...newUrls],
    }));
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }

    const diseaseData = {
      category: formData.category,
      name: formData.name,
      description: formData.description || null,
      symptoms: formData.symptoms || null,
      treatment: formData.treatment || null,
      prevention: formData.prevention || null,
      image_urls: formData.image_urls,
    };

    let error;
    if (editingDisease) {
      ({ error } = await supabase.from("diseases").update(diseaseData).eq("id", editingDisease.id));
    } else {
      ({ error } = await supabase.from("diseases").insert(diseaseData));
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Disease ${editingDisease ? "updated" : "created"} successfully` });
      setDialogOpen(false);
      resetForm();
      fetchDiseases();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("diseases").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Disease deleted successfully" });
      fetchDiseases();
    }
  };

  const resetForm = () => {
    setFormData({
      category: "shrimp",
      name: "",
      description: "",
      symptoms: "",
      treatment: "",
      prevention: "",
      image_urls: [],
    });
    setEditingDisease(null);
  };

  const openEdit = (disease: Disease) => {
    setEditingDisease(disease);
    setFormData({
      category: disease.category,
      name: disease.name,
      description: disease.description || "",
      symptoms: disease.symptoms || "",
      treatment: disease.treatment || "",
      prevention: disease.prevention || "",
      image_urls: disease.image_urls || [],
    });
    setDialogOpen(true);
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index),
    }));
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Diseases Management</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Disease</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingDisease ? "Edit" : "Add"} Disease</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v as "shrimp" | "fish" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shrimp">Shrimp Disease</SelectItem>
                      <SelectItem value="fish">Fish Disease</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Name</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div>
                <Label>Symptoms</Label>
                <Textarea value={formData.symptoms} onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })} />
              </div>
              <div>
                <Label>Treatment</Label>
                <Textarea value={formData.treatment} onChange={(e) => setFormData({ ...formData, treatment: e.target.value })} />
              </div>
              <div>
                <Label>Prevention</Label>
                <Textarea value={formData.prevention} onChange={(e) => setFormData({ ...formData, prevention: e.target.value })} />
              </div>
              <div>
                <Label>Images</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.image_urls.map((url, i) => (
                    <div key={i} className="relative">
                      <img src={url} alt="" className="w-20 h-20 object-cover rounded" />
                      <Button size="sm" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 p-0" onClick={() => removeImage(i)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading} />
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={uploading}>
                {uploading ? "Uploading..." : editingDisease ? "Update" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {diseases.map((disease) => (
          <Card key={disease.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  {disease.image_urls?.[0] && (
                    <img src={disease.image_urls[0]} alt={disease.name} className="w-24 h-24 object-cover rounded" />
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Bug className="h-4 w-4" />
                      <h3 className="font-bold">{disease.name}</h3>
                      <Badge variant={disease.category === "shrimp" ? "default" : "secondary"}>
                        {disease.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{disease.description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(disease)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(disease.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDiseases;
