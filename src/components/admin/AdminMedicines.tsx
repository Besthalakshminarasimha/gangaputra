import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Edit, Trash2, CheckCircle, XCircle, Upload } from "lucide-react";

interface Medicine {
  id: string;
  name: string;
  category: string;
  manufacturer: string;
  active_ingredient: string | null;
  dosage: string | null;
  price: number | null;
  approved: boolean;
  uses: string | null;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

const CATEGORIES = [
  "Antibiotic",
  "Probiotic",
  "Mineral Supplement",
  "Water Treatment",
  "Feed Additive",
  "Immunostimulant",
  "Disinfectant",
  "Growth Promoter",
];

const AdminMedicines = () => {
  const { toast } = useToast();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    manufacturer: "",
    active_ingredient: "",
    dosage: "",
    price: "",
    approved: true,
    uses: "",
    description: "",
    image_url: "",
    is_active: true,
  });

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    const { data, error } = await supabase
      .from("medicines")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error fetching medicines", variant: "destructive" });
    } else {
      setMedicines(data || []);
    }
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large (max 10MB)", variant: "destructive" });
      return;
    }

    setUploading(true);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;

    const { data, error } = await supabase.storage
      .from("admin-uploads")
      .upload(fileName, file);

    if (error) {
      toast({ title: "Upload failed", variant: "destructive" });
    } else {
      const { data: urlData } = supabase.storage
        .from("admin-uploads")
        .getPublicUrl(data.path);
      setFormData({ ...formData, image_url: urlData.publicUrl });
      toast({ title: "Image uploaded successfully" });
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const medicineData = {
      name: formData.name,
      category: formData.category,
      manufacturer: formData.manufacturer,
      active_ingredient: formData.active_ingredient || null,
      dosage: formData.dosage || null,
      price: formData.price ? parseFloat(formData.price) : null,
      approved: formData.approved,
      uses: formData.uses || null,
      description: formData.description || null,
      image_url: formData.image_url || null,
      is_active: formData.is_active,
    };

    if (editingMedicine) {
      const { error } = await supabase
        .from("medicines")
        .update(medicineData)
        .eq("id", editingMedicine.id);

      if (error) {
        toast({ title: "Error updating medicine", variant: "destructive" });
      } else {
        toast({ title: "Medicine updated successfully" });
        fetchMedicines();
        resetForm();
      }
    } else {
      const { error } = await supabase.from("medicines").insert([medicineData]);

      if (error) {
        toast({ title: "Error creating medicine", variant: "destructive" });
      } else {
        toast({ title: "Medicine created successfully" });
        fetchMedicines();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this medicine?")) return;

    const { error } = await supabase.from("medicines").delete().eq("id", id);

    if (error) {
      toast({ title: "Error deleting medicine", variant: "destructive" });
    } else {
      toast({ title: "Medicine deleted successfully" });
      fetchMedicines();
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      manufacturer: "",
      active_ingredient: "",
      dosage: "",
      price: "",
      approved: true,
      uses: "",
      description: "",
      image_url: "",
      is_active: true,
    });
    setEditingMedicine(null);
    setDialogOpen(false);
  };

  const openEdit = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setFormData({
      name: medicine.name,
      category: medicine.category,
      manufacturer: medicine.manufacturer,
      active_ingredient: medicine.active_ingredient || "",
      dosage: medicine.dosage || "",
      price: medicine.price?.toString() || "",
      approved: medicine.approved,
      uses: medicine.uses || "",
      description: medicine.description || "",
      image_url: medicine.image_url || "",
      is_active: medicine.is_active,
    });
    setDialogOpen(true);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Medicines Management</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Medicine
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMedicine ? "Edit Medicine" : "Add New Medicine"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer *</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="active_ingredient">Active Ingredient</Label>
                  <Input
                    id="active_ingredient"
                    value={formData.active_ingredient}
                    onChange={(e) => setFormData({ ...formData, active_ingredient: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input
                    id="dosage"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    placeholder="e.g., 5g per 100kg feed"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="uses">Uses</Label>
                <Textarea
                  id="uses"
                  value={formData.uses}
                  onChange={(e) => setFormData({ ...formData, uses: e.target.value })}
                  placeholder="What is this medicine used for?"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Product Image</Label>
                <div className="flex items-center gap-4">
                  {formData.image_url && (
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="h-20 w-20 object-cover rounded"
                    />
                  )}
                  <label className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-secondary">
                      <Upload className="h-4 w-4" />
                      {uploading ? "Uploading..." : "Upload Image"}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="approved"
                    checked={formData.approved}
                    onCheckedChange={(checked) => setFormData({ ...formData, approved: checked })}
                  />
                  <Label htmlFor="approved">CAA Approved</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active (visible to users)</Label>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingMedicine ? "Update" : "Create"} Medicine
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {medicines.map((medicine) => (
          <Card key={medicine.id} className={!medicine.is_active ? "opacity-50" : ""}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  {medicine.image_url && (
                    <img
                      src={medicine.image_url}
                      alt={medicine.name}
                      className="h-16 w-16 object-cover rounded"
                    />
                  )}
                  <div>
                    <CardTitle className="text-lg">{medicine.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{medicine.manufacturer}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(medicine)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(medicine.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="bg-primary/10 text-primary px-2 py-1 rounded">{medicine.category}</span>
                {medicine.price && (
                  <span className="bg-secondary px-2 py-1 rounded">₹{medicine.price}</span>
                )}
                {medicine.approved ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    CAA Approved
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-orange-600">
                    <XCircle className="h-3 w-3" />
                    Not Approved
                  </span>
                )}
                {!medicine.is_active && (
                  <span className="bg-destructive/10 text-destructive px-2 py-1 rounded">Inactive</span>
                )}
              </div>
              {medicine.uses && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{medicine.uses}</p>
              )}
            </CardContent>
          </Card>
        ))}
        {medicines.length === 0 && (
          <p className="text-center text-muted-foreground py-8 col-span-2">No medicines added yet</p>
        )}
      </div>
    </div>
  );
};

export default AdminMedicines;
