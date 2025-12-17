import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

const AdminUsersTable = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users.",
        variant: "destructive",
      });
    } else {
      setProfiles(data || []);
    }
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Registered Users</CardTitle>
        <Button variant="outline" size="sm" onClick={fetchProfiles}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center py-4 text-muted-foreground">Loading...</p>
        ) : profiles.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>{profile.full_name || "N/A"}</TableCell>
                    <TableCell>{profile.email || "N/A"}</TableCell>
                    <TableCell>{format(new Date(profile.created_at), "dd/MM/yyyy")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminUsersTable;
