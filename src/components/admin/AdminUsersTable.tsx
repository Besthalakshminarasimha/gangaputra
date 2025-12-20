import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Eye, Shield, Search, UserPlus } from "lucide-react";
import { format } from "date-fns";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

const AdminUsersTable = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('user_id, role')
    ]);

    if (profilesRes.error) {
      toast({
        title: "Error",
        description: "Failed to fetch users.",
        variant: "destructive",
      });
    } else {
      setProfiles(profilesRes.data || []);
    }

    if (!rolesRes.error) {
      setUserRoles(rolesRes.data || []);
    }

    setIsLoading(false);
  };

  const getUserRole = (userId: string): string | null => {
    const role = userRoles.find(r => r.user_id === userId);
    return role?.role || null;
  };

  const handleManageRole = (profile: Profile) => {
    setSelectedUser(profile);
    setSelectedRole(getUserRole(profile.id) || "");
    setShowRoleDialog(true);
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;

    const currentRole = getUserRole(selectedUser.id);

    try {
      if (!selectedRole && currentRole) {
        // Remove role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', selectedUser.id);
        
        if (error) throw error;
      } else if (selectedRole && !currentRole) {
        // Add new role - cast to proper type
        const roleValue = selectedRole as "admin" | "moderator" | "user";
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: selectedUser.id, role: roleValue });
        
        if (error) throw error;
      } else if (selectedRole && currentRole && selectedRole !== currentRole) {
        // Update role - cast to proper type
        const roleValue = selectedRole as "admin" | "moderator" | "user";
        const { error } = await supabase
          .from('user_roles')
          .update({ role: roleValue })
          .eq('user_id', selectedUser.id);
        
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "User role updated successfully.",
      });
      setShowRoleDialog(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update role.",
        variant: "destructive",
      });
    }
  };

  const filteredProfiles = profiles.filter(profile => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (profile.full_name?.toLowerCase().includes(searchLower) || false) ||
      (profile.email?.toLowerCase().includes(searchLower) || false)
    );
  });

  const getRoleBadge = (userId: string) => {
    const role = getUserRole(userId);
    if (!role) return null;
    
    const colors: Record<string, string> = {
      admin: "bg-red-500",
      moderator: "bg-blue-500",
      user: "bg-gray-500",
    };
    
    return (
      <Badge className={colors[role] || "bg-gray-500"}>
        {role}
      </Badge>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>Registered Users</CardTitle>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full sm:w-64"
              />
            </div>
            <Button variant="outline" size="icon" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-4 text-muted-foreground">Loading...</p>
          ) : filteredProfiles.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">
              {searchTerm ? "No users match your search." : "No users found."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">{profile.full_name || "N/A"}</TableCell>
                      <TableCell>{profile.email || "N/A"}</TableCell>
                      <TableCell>{getRoleBadge(profile.id) || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>{format(new Date(profile.created_at), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => handleManageRole(profile)}>
                          <Shield className="h-4 w-4 mr-1" />
                          Manage Role
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Management Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage User Role</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">User</p>
                <p className="font-medium">{selectedUser.full_name || selectedUser.email || "Unknown"}</p>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="No role assigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Role</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveRole}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminUsersTable;
