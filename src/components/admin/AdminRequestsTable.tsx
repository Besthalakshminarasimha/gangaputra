import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2, Eye, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface SellCropRequest {
  id: string;
  user_id: string;
  crop_type: string;
  count: number;
  quantity_tons: number;
  pickup_date: string;
  state: string;
  district: string;
  address: string;
  phone_number: string | null;
  preferred_contact_time: string | null;
  expected_price_per_kg: number | null;
  total_value_estimate: number | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface AdminRequestsTableProps {
  onUpdate: () => void;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  approved: "bg-green-500",
  rejected: "bg-red-500",
  completed: "bg-blue-500",
  cancelled: "bg-gray-500",
};

const AdminRequestsTable = ({ onUpdate }: AdminRequestsTableProps) => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<SellCropRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<SellCropRequest | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editData, setEditData] = useState({
    status: "",
    admin_notes: "",
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('sell_crop_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch requests.",
        variant: "destructive",
      });
    } else {
      setRequests(data || []);
    }
    setIsLoading(false);
  };

  const handleView = (request: SellCropRequest) => {
    setSelectedRequest(request);
    setShowViewDialog(true);
  };

  const handleEdit = (request: SellCropRequest) => {
    setSelectedRequest(request);
    setEditData({
      status: request.status,
      admin_notes: request.admin_notes || "",
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedRequest) return;

    const oldStatus = selectedRequest.status;
    const newStatus = editData.status;

    const { error } = await supabase
      .from('sell_crop_requests')
      .update({
        status: editData.status,
        admin_notes: editData.admin_notes,
      })
      .eq('id', selectedRequest.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update request.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Request updated successfully.",
      });
      setShowEditDialog(false);
      fetchRequests();
      onUpdate();

      // Send email notification if status changed
      if (oldStatus !== newStatus) {
        try {
          // Send email notification
          const { error: emailError } = await supabase.functions.invoke('send-status-notification', {
            body: {
              requestId: selectedRequest.id,
              userId: selectedRequest.user_id,
              cropType: selectedRequest.crop_type,
              quantityTons: selectedRequest.quantity_tons,
              oldStatus,
              newStatus,
              adminNotes: editData.admin_notes || undefined,
            },
          });

          if (emailError) {
            console.error("Failed to send notification email:", emailError);
          }

          // Send push notification
          const { error: pushError } = await supabase.functions.invoke('send-trade-push-notification', {
            body: {
              userId: selectedRequest.user_id,
              requestId: selectedRequest.id,
              cropType: selectedRequest.crop_type,
              oldStatus,
              newStatus,
              adminNotes: editData.admin_notes || undefined,
            },
          });

          if (pushError) {
            console.error("Failed to send push notification:", pushError);
          }

          toast({
            title: "Notifications Sent",
            description: "User has been notified of the status change.",
          });
        } catch (emailErr) {
          console.error("Error invoking notification functions:", emailErr);
        }
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this request?")) return;

    const { error } = await supabase
      .from('sell_crop_requests')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete request.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Request deleted successfully.",
      });
      fetchRequests();
      onUpdate();
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sell Crop Requests</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchRequests}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-4 text-muted-foreground">Loading...</p>
          ) : requests.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">No requests found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Crop</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(request.created_at), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>{request.crop_type}</TableCell>
                      <TableCell>{request.quantity_tons} tons</TableCell>
                      <TableCell>{request.district}, {request.state}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[request.status] || "bg-gray-500"}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleView(request)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(request)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(request.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><strong>Crop:</strong> {selectedRequest.crop_type}</div>
                <div><strong>Count:</strong> {selectedRequest.count}</div>
                <div><strong>Quantity:</strong> {selectedRequest.quantity_tons} tons</div>
                <div><strong>Pickup Date:</strong> {format(new Date(selectedRequest.pickup_date), "PPP")}</div>
                <div><strong>State:</strong> {selectedRequest.state}</div>
                <div><strong>District:</strong> {selectedRequest.district}</div>
              </div>
              <div><strong>Address:</strong> {selectedRequest.address}</div>
              {selectedRequest.phone_number && (
                <div><strong>Phone:</strong> {selectedRequest.phone_number}</div>
              )}
              {selectedRequest.preferred_contact_time && (
                <div><strong>Preferred Contact:</strong> {selectedRequest.preferred_contact_time}</div>
              )}
              {selectedRequest.expected_price_per_kg && (
                <div><strong>Expected Price:</strong> ₹{selectedRequest.expected_price_per_kg}/kg</div>
              )}
              {selectedRequest.total_value_estimate && (
                <div><strong>Total Estimate:</strong> ₹{selectedRequest.total_value_estimate}</div>
              )}
              <div><strong>Status:</strong> <Badge className={statusColors[selectedRequest.status]}>{selectedRequest.status}</Badge></div>
              {selectedRequest.admin_notes && (
                <div><strong>Admin Notes:</strong> {selectedRequest.admin_notes}</div>
              )}
              <div><strong>Created:</strong> {format(new Date(selectedRequest.created_at), "PPP p")}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editData.status} onValueChange={(val) => setEditData({ ...editData, status: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Admin Notes</Label>
              <Textarea
                placeholder="Add notes about this request..."
                value={editData.admin_notes}
                onChange={(e) => setEditData({ ...editData, admin_notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminRequestsTable;
