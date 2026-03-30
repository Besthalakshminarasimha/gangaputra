import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const AdminJobPostings = () => {
  const { data: postings = [], refetch } = useQuery({
    queryKey: ["admin-job-postings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_postings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("job_postings").update({ is_active: !current }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(!current ? "Posting activated" : "Posting deactivated");
    refetch();
  };

  const deletePosting = async (id: string) => {
    const { error } = await supabase.from("job_postings").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Posting deleted");
    refetch();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Job Postings ({postings.length})</h3>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {postings.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell><span className="flex items-center gap-1 text-sm"><MapPin className="h-3 w-3" />{p.district}, {p.state}</span></TableCell>
                <TableCell><Badge variant="secondary">{p.job_type}</Badge></TableCell>
                <TableCell>{p.salary_range || "—"}</TableCell>
                <TableCell className="text-sm">{format(new Date(p.created_at), "dd MMM yyyy")}</TableCell>
                <TableCell><Switch checked={p.is_active} onCheckedChange={() => toggleActive(p.id, p.is_active)} /></TableCell>
                <TableCell><Button size="icon" variant="destructive" onClick={() => deletePosting(p.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
            {postings.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No job postings yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminJobPostings;
