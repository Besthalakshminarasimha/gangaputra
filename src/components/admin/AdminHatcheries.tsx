import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Edit, Trash2, MapPin, Phone, Mail, Globe } from "lucide-react";

interface Hatchery {
  id: string;
  name: string;
  location: string;
  region: string;
  type: string;
  species: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  is_active: boolean;
  created_at: string;
}

const REGIONS = [
  "Andhra Pradesh",
  "Tamil Nadu",
  "West Bengal",
  "Odisha",
  "Gujarat",
  "Kerala",
  "Karnataka",
  "Maharashtra",
];

const HATCHERY_TYPES = ["Private", "Government", "Research Institute", "Cooperative"];

const AdminHatcheries = () => {
  const { toast } = useToast();
  const [hatcheries, setHatcheries] = useState<Hatchery[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHatchery, setEditingHatchery] = useState<Hatchery | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    region: "",
    type: "",
    species: "",
    phone: "",
    email: "",
    website: "",
    is_active: true,
  });

  useEffect(() => {
    fetchHatcheries();
  }, []);

  const fetchHatcheries = async () => {
    const { data, error } = await supabase
      .from("hatcheries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error fetching hatcheries", variant: "destructive" });
    } else {
      setHatcheries(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const hatcheryData = {
      name: formData.name,
      location: formData.location,
      region: formData.region,
      type: formData.type,
      species: formData.species,
      phone: formData.phone || null,
      email: formData.email || null,
      website: formData.website || null,
      is_active: formData.is_active,
    };

    if (editingHatchery) {
      const { error } = await supabase
        .from("hatcheries")
        .update(hatcheryData)
        .eq("id", editingHatchery.id);

      if (error) {
        toast({ title: "Error updating hatchery", variant: "destructive" });
      } else {
        toast({ title: "Hatchery updated successfully" });
        fetchHatcheries();
        resetForm();
      }
    } else {
      const { error } = await supabase.from("hatcheries").insert([hatcheryData]);

      if (error) {
        toast({ title: "Error creating hatchery", variant: "destructive" });
      } else {
        toast({ title: "Hatchery created successfully" });
        fetchHatcheries();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this hatchery?")) return;

    const { error } = await supabase.from("hatcheries").delete().eq("id", id);

    if (error) {
      toast({ title: "Error deleting hatchery", variant: "destructive" });
    } else {
      toast({ title: "Hatchery deleted successfully" });
      fetchHatcheries();
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      location: "",
      region: "",
      type: "",
      species: "",
      phone: "",
      email: "",
      website: "",
      is_active: true,
    });
    setEditingHatchery(null);
    setDialogOpen(false);
  };

  const openEdit = (hatchery: Hatchery) => {
    setEditingHatchery(hatchery);
    setFormData({
      name: hatchery.name,
      location: hatchery.location,
      region: hatchery.region,
      type: hatchery.type,
      species: hatchery.species,
      phone: hatchery.phone || "",
      email: hatchery.email || "",
      website: hatchery.website || "",
      is_active: hatchery.is_active,
    });
    setDialogOpen(true);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Hatcheries Management</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Hatchery
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingHatchery ? "Edit Hatchery" : "Add New Hatchery"}
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
                  <Label htmlFor="location">Location/District *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="region">State/Region *</Label>
                  <Select
                    value={formData.region}
                    onValueChange={(value) => setFormData({ ...formData, region: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {HATCHERY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="species">Species *</Label>
                <Input
                  id="species"
                  value={formData.species}
                  onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                  placeholder="e.g., L. vannamei, P. monodon"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 XXXXXXXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active (visible to users)</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingHatchery ? "Update" : "Create"} Hatchery
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {hatcheries.map((hatchery) => (
          <Card key={hatchery.id} className={!hatchery.is_active ? "opacity-50" : ""}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{hatchery.name}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" />
                    {hatchery.location}, {hatchery.region}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(hatchery)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(hatchery.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="bg-primary/10 text-primary px-2 py-1 rounded">{hatchery.type}</span>
                <span className="bg-secondary px-2 py-1 rounded">{hatchery.species}</span>
                {hatchery.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {hatchery.phone}
                  </span>
                )}
                {hatchery.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {hatchery.email}
                  </span>
                )}
                {hatchery.website && (
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    {hatchery.website}
                  </span>
                )}
                {!hatchery.is_active && (
                  <span className="bg-destructive/10 text-destructive px-2 py-1 rounded">Inactive</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {hatcheries.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No hatcheries added yet</p>
        )}
      </div>
    </div>
  );
};

export default AdminHatcheries;
