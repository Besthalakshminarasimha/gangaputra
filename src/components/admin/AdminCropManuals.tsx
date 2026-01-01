import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CropManual {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  content: string | null;
  image_urls: string[];
  video_url: string | null;
  created_at: string;
}

const CROP_TYPES = [
  { slug: "vannamei-culture", name: "Vannamei Culture" },
  { slug: "rohu-culture", name: "Rohu Culture" },
  { slug: "tilapia-culture", name: "Tilapia Culture" },
  { slug: "pangasius-culture", name: "Pangasius Culture" },
  { slug: "korameenu", name: "Korameenu" },
  { slug: "catla-culture", name: "Catla Culture" },
  { slug: "ornamental-aquarium", name: "Ornamental Aquarium" },
  { slug: "tiger-prawn", name: "Tiger Prawn" },
  { slug: "polyculture", name: "Polyculture" },
];

const AdminCropManuals = () => {
  const [manuals, setManuals] = useState<CropManual[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingManual, setEditingManual] = useState<CropManual | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    content: "",
    image_urls: [] as string[],
    video_url: "",
  });

  useEffect(() => {
    fetchManuals();
  }, []);

  const fetchManuals = async () => {
    const { data, error } = await supabase
      .from("crop_manuals")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching manuals:", error);
    } else {
      setManuals(data || []);
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
      const fileName = `crop-manuals/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("content").upload(fileName, file);

      if (uploadError) continue;

      const { data: { publicUrl } } = supabase.storage.from("content").getPublicUrl(fileName);
      newUrls.push(publicUrl);
    }

    setFormData(prev => ({ ...prev, image_urls: [...prev.image_urls, ...newUrls] }));
    setUploading(false);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `crop-manuals/videos/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from("content").upload(fileName, file);

    if (uploadError) {
      toast({ title: "Error", description: "Failed to upload video", variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("content").getPublicUrl(fileName);
    setFormData(prev => ({ ...prev, video_url: publicUrl }));
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.slug) {
      toast({ title: "Error", description: "Name and slug are required", variant: "destructive" });
      return;
    }

    const manualData = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description || null,
      content: formData.content || null,
      image_urls: formData.image_urls,
      video_url: formData.video_url || null,
    };

    let error;
    if (editingManual) {
      ({ error } = await supabase.from("crop_manuals").update(manualData).eq("id", editingManual.id));
    } else {
      ({ error } = await supabase.from("crop_manuals").insert(manualData));
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Manual ${editingManual ? "updated" : "created"} successfully` });
      setDialogOpen(false);
      resetForm();
      fetchManuals();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("crop_manuals").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Manual deleted successfully" });
      fetchManuals();
    }
  };

  const resetForm = () => {
    setFormData({ name: "", slug: "", description: "", content: "", image_urls: [], video_url: "" });
    setEditingManual(null);
  };

  const openEdit = (manual: CropManual) => {
    setEditingManual(manual);
    setFormData({
      name: manual.name,
      slug: manual.slug,
      description: manual.description || "",
      content: manual.content || "",
      image_urls: manual.image_urls || [],
      video_url: manual.video_url || "",
    });
    setDialogOpen(true);
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, image_urls: prev.image_urls.filter((_, i) => i !== index) }));
  };

  const selectCropType = (crop: { slug: string; name: string }) => {
    setFormData(prev => ({ ...prev, name: crop.name, slug: crop.slug }));
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Crop Manuals Management</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Manual</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingManual ? "Edit" : "Add"} Crop Manual</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Quick Select Crop Type</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {CROP_TYPES.map((crop) => (
                    <Badge
                      key={crop.slug}
                      variant={formData.slug === crop.slug ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => selectCropType(crop)}
                    >
                      {crop.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div>
                <Label>Content</Label>
                <Textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows={8} />
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
              <div>
                <Label>Video</Label>
                {formData.video_url && <p className="text-sm text-muted-foreground mb-2">Video uploaded ✓</p>}
                <Input type="file" accept="video/*" onChange={handleVideoUpload} disabled={uploading} />
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={uploading}>
                {uploading ? "Uploading..." : editingManual ? "Update" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {manuals.map((manual) => (
          <Card key={manual.id}>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3">
                {manual.image_urls?.[0] && (
                  <img src={manual.image_urls[0]} alt={manual.name} className="w-full h-32 object-cover rounded" />
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4" />
                    <h3 className="font-bold">{manual.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{manual.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(manual)} className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(manual.id)}>
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

export default AdminCropManuals;
