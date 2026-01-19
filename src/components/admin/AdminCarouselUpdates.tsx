import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Image, Video, FileText, GripVertical, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

interface UploadState {
  status: 'idle' | 'uploading' | 'validating' | 'success' | 'error';
  message: string;
  progress?: number;
}

const AdminCarouselUpdates = () => {
  const [updates, setUpdates] = useState<CarouselUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<CarouselUpdate | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle', message: '' });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
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

  const validateImageUrl = async (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
      // Timeout after 10 seconds
      setTimeout(() => resolve(false), 10000);
    });
  };

  const validateVideoUrl = async (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.onloadedmetadata = () => resolve(true);
      video.onerror = () => resolve(false);
      video.src = url;
      // Timeout after 15 seconds for videos
      setTimeout(() => resolve(false), 15000);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadState({
        status: 'error',
        message: 'File too large. Maximum size is 50MB.',
      });
      return;
    }

    // Validate file type
    const isVideo = formData.media_type === 'video';
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    const validTypes = isVideo ? validVideoTypes : validImageTypes;

    if (!validTypes.includes(file.type)) {
      setUploadState({
        status: 'error',
        message: `Invalid file type. Accepted: ${validTypes.join(', ')}`,
      });
      return;
    }

    setUploadState({ status: 'uploading', message: 'Uploading file...' });

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('admin-uploads')
      .upload(fileName, file);

    if (uploadError) {
      setUploadState({
        status: 'error',
        message: `Upload failed: ${uploadError.message}`,
      });
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('admin-uploads')
      .getPublicUrl(fileName);

    // Validate the uploaded media loads correctly
    setUploadState({ status: 'validating', message: 'Validating media...' });

    const isValid = isVideo 
      ? await validateVideoUrl(publicUrl)
      : await validateImageUrl(publicUrl);

    if (!isValid) {
      setUploadState({
        status: 'error',
        message: 'Media uploaded but failed to load. The file may be corrupted or the format unsupported.',
      });
      // Still set the URL in case user wants to proceed
      setFormData(prev => ({ ...prev, media_url: publicUrl }));
      return;
    }

    setFormData(prev => ({ ...prev, media_url: publicUrl }));
    setUploadState({ status: 'success', message: 'File uploaded and validated successfully!' });

    toast({
      title: "Upload Successful",
      description: "File uploaded and validated!",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate media URL for non-text types
    if (formData.media_type !== 'text' && formData.media_url) {
      setUploadState({ status: 'validating', message: 'Validating media URL...' });
      
      const isValid = formData.media_type === 'video'
        ? await validateVideoUrl(formData.media_url)
        : await validateImageUrl(formData.media_url);

      if (!isValid) {
        setUploadState({
          status: 'error',
          message: 'Media URL is not accessible or invalid. Please check the URL or re-upload.',
        });
        return;
      }
    }

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
    setUploadState({ status: 'idle', message: '' });
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
    setUploadState({ status: 'idle', message: '' });
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

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newUpdates = [...updates];
    const [draggedItem] = newUpdates.splice(draggedIndex, 1);
    newUpdates.splice(dropIndex, 0, draggedItem);

    // Update local state immediately for smooth UX
    setUpdates(newUpdates);
    setDraggedIndex(null);
    setDragOverIndex(null);

    // Update display_order in database
    try {
      const updatePromises = newUpdates.map((update, index) =>
        supabase
          .from('admin_carousel_updates')
          .update({ display_order: index })
          .eq('id', update.id)
      );

      await Promise.all(updatePromises);
      
      toast({
        title: "Order Updated",
        description: "Carousel order has been saved.",
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to save new order.",
        variant: "destructive",
      });
      fetchUpdates(); // Revert to database state on error
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Carousel Updates</h2>
          <p className="text-sm text-muted-foreground">Drag and drop to reorder</p>
        </div>
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
                  onValueChange={(value: 'image' | 'video' | 'gif' | 'text') => {
                    setFormData(prev => ({ ...prev, media_type: value, media_url: '' }));
                    setUploadState({ status: 'idle', message: '' });
                  }}
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
                      disabled={uploadState.status === 'uploading' || uploadState.status === 'validating'}
                    />
                  </div>
                  
                  {/* Upload Status Indicator */}
                  {uploadState.status !== 'idle' && (
                    <Alert variant={uploadState.status === 'error' ? 'destructive' : 'default'} className="py-2">
                      <div className="flex items-center gap-2">
                        {uploadState.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin" />}
                        {uploadState.status === 'validating' && <Loader2 className="h-4 w-4 animate-spin" />}
                        {uploadState.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {uploadState.status === 'error' && <AlertCircle className="h-4 w-4" />}
                        <AlertDescription className="text-sm">{uploadState.message}</AlertDescription>
                      </div>
                    </Alert>
                  )}

                  {/* Media Preview */}
                  {formData.media_url && (
                    <div className="mt-2 relative">
                      {formData.media_type === 'video' ? (
                        <video 
                          src={formData.media_url} 
                          controls 
                          className="w-full max-h-40 rounded border"
                          onError={() => setUploadState({ status: 'error', message: 'Video failed to load' })}
                        />
                      ) : (
                        <img 
                          src={formData.media_url} 
                          alt="Preview" 
                          className="w-full max-h-40 object-cover rounded border"
                          onError={() => setUploadState({ status: 'error', message: 'Image failed to load' })}
                        />
                      )}
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="media_url">Or paste URL</Label>
                    <Input
                      id="media_url"
                      value={formData.media_url}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, media_url: e.target.value }));
                        setUploadState({ status: 'idle', message: '' });
                      }}
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
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={uploadState.status === 'uploading' || uploadState.status === 'validating'}
                >
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

      <div className="grid gap-2">
        {updates.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No carousel updates yet. Add your first update!
            </CardContent>
          </Card>
        ) : (
          updates.map((update, index) => (
            <Card 
              key={update.id} 
              className={`transition-all duration-200 cursor-grab active:cursor-grabbing ${
                draggedIndex === index ? 'opacity-50 scale-95' : ''
              } ${
                dragOverIndex === index ? 'ring-2 ring-primary ring-offset-2' : ''
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 text-muted-foreground cursor-grab">
                    <GripVertical className="h-5 w-5" />
                    <span className="text-xs font-medium w-5 text-center">{index + 1}</span>
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
