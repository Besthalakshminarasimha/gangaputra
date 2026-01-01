import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  discount_price: number | null;
  image_urls: string[];
  video_url: string | null;
  category: string | null;
  in_stock: boolean;
  specifications: any;
  created_at: string;
}

const CATEGORIES = ["Devices", "Feed", "Medicine", "Minerals", "Aerators", "Test Kits", "Disinfectants", "Electrical", "Equipment"];

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    discount_price: "",
    category: "",
    in_stock: true,
    image_urls: [] as string[],
    video_url: "",
    specifications: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products:", error);
    } else {
      setProducts(data || []);
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
      const fileName = `products/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

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
    const fileName = `products/videos/${Date.now()}.${fileExt}`;

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
    if (!formData.name || !formData.price) {
      toast({ title: "Error", description: "Name and price are required", variant: "destructive" });
      return;
    }

    let specs = null;
    if (formData.specifications) {
      try {
        specs = JSON.parse(formData.specifications);
      } catch {
        toast({ title: "Error", description: "Invalid specifications JSON", variant: "destructive" });
        return;
      }
    }

    const productData = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
      category: formData.category || null,
      in_stock: formData.in_stock,
      image_urls: formData.image_urls,
      video_url: formData.video_url || null,
      specifications: specs,
    };

    let error;
    if (editingProduct) {
      ({ error } = await supabase.from("products").update(productData).eq("id", editingProduct.id));
    } else {
      ({ error } = await supabase.from("products").insert(productData));
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Product ${editingProduct ? "updated" : "created"} successfully` });
      setDialogOpen(false);
      resetForm();
      fetchProducts();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Product deleted successfully" });
      fetchProducts();
    }
  };

  const resetForm = () => {
    setFormData({
      name: "", description: "", price: "", discount_price: "", category: "",
      in_stock: true, image_urls: [], video_url: "", specifications: "",
    });
    setEditingProduct(null);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      discount_price: product.discount_price?.toString() || "",
      category: product.category || "",
      in_stock: product.in_stock,
      image_urls: product.image_urls || [],
      video_url: product.video_url || "",
      specifications: product.specifications ? JSON.stringify(product.specifications, null, 2) : "",
    });
    setDialogOpen(true);
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, image_urls: prev.image_urls.filter((_, i) => i !== index) }));
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Products Management (Ganga Store)</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Product</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit" : "Add"} Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Price (₹)</Label>
                  <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                </div>
                <div>
                  <Label>Discount Price (₹)</Label>
                  <Input type="number" value={formData.discount_price} onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })} />
                </div>
                <div>
                  <Label>Category</Label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={formData.in_stock} onCheckedChange={(v) => setFormData({ ...formData, in_stock: v })} />
                <Label>In Stock</Label>
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
              <div>
                <Label>Specifications (JSON)</Label>
                <Textarea
                  value={formData.specifications}
                  onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                  placeholder='{"weight": "5kg", "material": "Steel"}'
                  rows={4}
                />
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={uploading}>
                {uploading ? "Uploading..." : editingProduct ? "Update" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3">
                {product.image_urls?.[0] ? (
                  <img src={product.image_urls[0]} alt={product.name} className="w-full h-32 object-cover rounded" />
                ) : (
                  <div className="w-full h-32 bg-muted rounded flex items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold">{product.name}</h3>
                    {product.category && <Badge variant="outline">{product.category}</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">₹{product.price.toLocaleString()}</span>
                    {product.discount_price && (
                      <span className="text-sm text-muted-foreground line-through">₹{product.discount_price.toLocaleString()}</span>
                    )}
                  </div>
                  <Badge variant={product.in_stock ? "default" : "secondary"} className="mt-1">
                    {product.in_stock ? "In Stock" : "Out of Stock"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(product)} className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(product.id)}>
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

export default AdminProducts;
