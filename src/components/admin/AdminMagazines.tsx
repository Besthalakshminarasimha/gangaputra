import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, BookOpen } from "lucide-react";

interface Magazine {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  content: string | null;
  pdf_url: string | null;
  published_date: string | null;
  created_at: string;
}

const AdminMagazines = () => {
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMagazine, setEditingMagazine] = useState<Magazine | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    cover_image_url: "",
    pdf_url: "",
    published_date: "",
  });

  useEffect(() => {
    fetchMagazines();
  }, []);

  const fetchMagazines = async () => {
    const { data, error } = await supabase
      .from("magazines")
      .select("*")
      .order("published_date", { ascending: false });

    if (error) {
      console.error("Error fetching magazines:", error);
    } else {
      setMagazines(data || []);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "pdf") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `magazines/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from("content").upload(fileName, file);

    if (uploadError) {
      toast({ title: "Error", description: "Failed to upload file", variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("content").getPublicUrl(fileName);

    setFormData(prev => ({
      ...prev,
      [type === "image" ? "cover_image_url" : "pdf_url"]: publicUrl,
    }));
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }

    const magazineData = {
      title: formData.title,
      description: formData.description || null,
      content: formData.content || null,
      cover_image_url: formData.cover_image_url || null,
      pdf_url: formData.pdf_url || null,
      published_date: formData.published_date || null,
    };

    let error;
    if (editingMagazine) {
      ({ error } = await supabase.from("magazines").update(magazineData).eq("id", editingMagazine.id));
    } else {
      ({ error } = await supabase.from("magazines").insert(magazineData));
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Magazine ${editingMagazine ? "updated" : "created"} successfully` });
      setDialogOpen(false);
      resetForm();
      fetchMagazines();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("magazines").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Magazine deleted successfully" });
      fetchMagazines();
    }
  };

  const resetForm = () => {
    setFormData({ title: "", description: "", content: "", cover_image_url: "", pdf_url: "", published_date: "" });
    setEditingMagazine(null);
  };

  const openEdit = (magazine: Magazine) => {
    setEditingMagazine(magazine);
    setFormData({
      title: magazine.title,
      description: magazine.description || "",
      content: magazine.content || "",
      cover_image_url: magazine.cover_image_url || "",
      pdf_url: magazine.pdf_url || "",
      published_date: magazine.published_date || "",
    });
    setDialogOpen(true);
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Magazines Management</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Magazine</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingMagazine ? "Edit" : "Add"} Magazine</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div>
                <Label>Content</Label>
                <Textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={6} />
              </div>
              <div>
                <Label>Published Date</Label>
                <Input type="date" value={formData.published_date} onChange={(e) => setFormData({ ...formData, published_date: e.target.value })} />
              </div>
              <div>
                <Label>Cover Image</Label>
                {formData.cover_image_url && <img src={formData.cover_image_url} alt="" className="w-32 h-40 object-cover rounded mb-2" />}
                <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "image")} disabled={uploading} />
              </div>
              <div>
                <Label>PDF File</Label>
                {formData.pdf_url && <p className="text-sm text-muted-foreground mb-2">PDF uploaded ✓</p>}
                <Input type="file" accept=".pdf" onChange={(e) => handleFileUpload(e, "pdf")} disabled={uploading} />
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={uploading}>
                {uploading ? "Uploading..." : editingMagazine ? "Update" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {magazines.map((magazine) => (
          <Card key={magazine.id}>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3">
                {magazine.cover_image_url && (
                  <img src={magazine.cover_image_url} alt={magazine.title} className="w-full h-48 object-cover rounded" />
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="h-4 w-4" />
                    <h3 className="font-bold">{magazine.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{magazine.description}</p>
                  {magazine.published_date && (
                    <p className="text-xs text-muted-foreground mt-1">{new Date(magazine.published_date).toLocaleDateString()}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(magazine)} className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(magazine.id)}>
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

export default AdminMagazines;
