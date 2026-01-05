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
import { Plus, Trash2, Edit, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DailyUpdate {
  id: string;
  title: string;
  message: string;
  is_active: boolean;
  target_audience: string | null;
  created_at: string;
}

const AdminDailyUpdates = () => {
  const [updates, setUpdates] = useState<DailyUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<DailyUpdate | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    is_active: true,
    target_audience: "all",
  });

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    const { data, error } = await supabase
      .from("daily_updates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching updates:", error);
    } else {
      setUpdates(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.message) {
      toast({ title: "Error", description: "Title and message are required", variant: "destructive" });
      return;
    }

    const updateData = {
      title: formData.title,
      message: formData.message,
      is_active: formData.is_active,
      target_audience: formData.target_audience,
    };

    let error;
    let insertedData;
    if (editingUpdate) {
      ({ error } = await supabase.from("daily_updates").update(updateData).eq("id", editingUpdate.id));
    } else {
      const result = await supabase.from("daily_updates").insert(updateData).select().single();
      error = result.error;
      insertedData = result.data;
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Update ${editingUpdate ? "modified" : "created"} successfully` });
      
      // Send email notifications for new active updates
      if (!editingUpdate && formData.is_active && insertedData) {
        try {
          const { error: emailError } = await supabase.functions.invoke('send-daily-update-email', {
            body: {
              updateId: insertedData.id,
              title: formData.title,
              message: formData.message,
              targetAudience: formData.target_audience,
            }
          });
          
          if (emailError) {
            console.error('Email notification error:', emailError);
            toast({ title: "Note", description: "Update created, but email notifications may not have been sent" });
          } else {
            toast({ title: "Emails Sent", description: "Email notifications sent to subscribed users" });
          }
        } catch (err) {
          console.error('Error sending email notifications:', err);
        }
      }
      
      setDialogOpen(false);
      resetForm();
      fetchUpdates();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("daily_updates").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Update deleted successfully" });
      fetchUpdates();
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from("daily_updates").update({ is_active: !currentStatus }).eq("id", id);
    if (!error) {
      fetchUpdates();
    }
  };

  const resetForm = () => {
    setFormData({ title: "", message: "", is_active: true, target_audience: "all" });
    setEditingUpdate(null);
  };

  const openEdit = (update: DailyUpdate) => {
    setEditingUpdate(update);
    setFormData({
      title: update.title,
      message: update.message,
      is_active: update.is_active,
      target_audience: update.target_audience || "all",
    });
    setDialogOpen(true);
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Daily Updates & Reminders</h2>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Update</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingUpdate ? "Edit" : "Add"} Daily Update</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., New Feature Alert!" />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} placeholder="Write a friendly message for users..." rows={4} />
              </div>
              <div>
                <Label>Target Audience</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3"
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                >
                  <option value="all">All Users</option>
                  <option value="farmers">Farmers Only</option>
                  <option value="new">New Users</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={formData.is_active} onCheckedChange={(v) => setFormData({ ...formData, is_active: v })} />
                <Label>Active (visible to users)</Label>
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingUpdate ? "Update" : "Create"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {updates.map((update) => (
          <Card key={update.id} className={!update.is_active ? "opacity-60" : ""}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <Bell className={`h-5 w-5 mt-1 ${update.is_active ? "text-primary" : "text-muted-foreground"}`} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold">{update.title}</h3>
                      <Badge variant={update.is_active ? "default" : "secondary"}>
                        {update.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{update.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created: {new Date(update.created_at).toLocaleDateString()} • Target: {update.target_audience || "All"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggleActive(update.id, update.is_active)}>
                    {update.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(update)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(update.id)}>
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

export default AdminDailyUpdates;
