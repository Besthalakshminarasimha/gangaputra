import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Image, Video, FileText, Upload, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CarouselUpdate {
  id: string;
  title: string;
  description: string | null;
  media_type: string;
  media_url: string | null;
  content: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

const AdminCarouselUpdates = () => {
  const [updates, setUpdates] = useState<CarouselUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<CarouselUpdate | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    media_type: "image" as string,
    media_url: "",
    content: "",
    is_active: true,
    display_order: 0,
  });

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    const { data, error } = await supabase
      .from('admin_carousel_updates')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching carousel updates:', error);
    } else {
      setUpdates(data || []);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from('admin-uploads')
      .upload(fileName, file);

    if (uploadError) {
      toast({
        title: "Upload Failed",
        description: uploadError.message,
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('admin-uploads')
      .getPublicUrl(fileName);

    setFormData(prev => ({ ...prev, media_url: publicUrl }));
    setUploading(false);
    toast({
      title: "Upload Successful",
      description: "File uploaded successfully!",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingUpdate) {
      const { error } = await supabase
        .from('admin_carousel_updates')
        .update({
          title: formData.title,
          description: formData.description || null,
          media_type: formData.media_type,
          media_url: formData.media_url || null,
          content: formData.content || null,
          is_active: formData.is_active,
          display_order: formData.display_order,
        })
        .eq('id', editingUpdate.id);

      if (error) {
        toast({ title: "Error", description: "Failed to update.", variant: "destructive" });
      } else {
        toast({ title: "Updated", description: "Carousel update saved!" });
        resetForm();
        fetchUpdates();
      }
    } else {
      const { error } = await supabase
        .from('admin_carousel_updates')
        .insert({
          title: formData.title,
          description: formData.description || null,
          media_type: formData.media_type,
          media_url: formData.media_url || null,
          content: formData.content || null,
          is_active: formData.is_active,
          display_order: updates.length,
        });

      if (error) {
        toast({ title: "Error", description: "Failed to create.", variant: "destructive" });
      } else {
        toast({ title: "Created", description: "New carousel update added!" });
        resetForm();
        fetchUpdates();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('admin_carousel_updates')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Carousel update removed." });
      fetchUpdates();
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('admin_carousel_updates')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (!error) fetchUpdates();
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      media_type: "image",
      media_url: "",
      content: "",
      is_active: true,
      display_order: 0,
    });
    setEditingUpdate(null);
    setDialogOpen(false);
  };

  const openEdit = (update: CarouselUpdate) => {
    setEditingUpdate(update);
    setFormData({
      title: update.title,
      description: update.description || "",
      media_type: update.media_type,
      media_url: update.media_url || "",
      content: update.content || "",
      is_active: update.is_active,
      display_order: update.display_order,
    });
    setDialogOpen(true);
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'gif': return <Image className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Carousel Updates</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Update
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingUpdate ? "Edit Update" : "Add Carousel Update"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="media_type">Media Type</Label>
                <Select
                  value={formData.media_type}
                  onValueChange={(value: 'image' | 'video' | 'gif' | 'text') => 
                    setFormData(prev => ({ ...prev, media_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="gif">GIF</SelectItem>
                    <SelectItem value="text">Text Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.media_type !== 'text' && (
                <div className="space-y-2">
                  <Label>Upload Media</Label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept={formData.media_type === 'video' ? 'video/*' : 'image/*'}
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </div>
                  {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
                  {formData.media_url && (
                    <div className="mt-2">
                      {formData.media_type === 'video' ? (
                        <video src={formData.media_url} controls className="w-full max-h-32 rounded" />
                      ) : (
                        <img src={formData.media_url} alt="Preview" className="w-full max-h-32 object-cover rounded" />
                      )}
                    </div>
                  )}
                  <div>
                    <Label htmlFor="media_url">Or paste URL</Label>
                    <Input
                      id="media_url"
                      value={formData.media_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, media_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              )}

              {formData.media_type === 'text' && (
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={4}
                    placeholder="Enter your text content here..."
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label>Active</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingUpdate ? "Update" : "Create"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {updates.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No carousel updates yet. Add your first update!
            </CardContent>
          </Card>
        ) : (
          updates.map((update) => (
            <Card key={update.id} className="transition-all duration-200 hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GripVertical className="h-5 w-5" />
                    {getMediaIcon(update.media_type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{update.title}</h3>
                      <Badge variant={update.is_active ? "default" : "secondary"}>
                        {update.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">{update.media_type}</Badge>
                    </div>
                    {update.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{update.description}</p>
                    )}
                    {update.media_url && update.media_type !== 'text' && (
                      <div className="mt-2">
                        {update.media_type === 'video' ? (
                          <video src={update.media_url} className="h-16 rounded" />
                        ) : (
                          <img src={update.media_url} alt="" className="h-16 object-cover rounded" />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={update.is_active}
                      onCheckedChange={() => toggleActive(update.id, update.is_active)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => openEdit(update)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(update.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminCarouselUpdates;
