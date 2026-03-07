import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Eye, Search, MapPin, Phone, Mail, Briefcase, BadgeCheck } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface JobProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  age: number | null;
  location: string;
  district: string;
  state: string;
  experience_years: number;
  skills: string[];
  education: string | null;
  languages: string[] | null;
  expected_salary: string | null;
  availability: string;
  bio: string | null;
  is_active: boolean | null;
  is_verified: boolean | null;
  created_at: string;
}

const AdminJobProfiles = () => {
  const [profiles, setProfiles] = useState<JobProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<JobProfile | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("job_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  };

  const toggleActive = async (id: string, currentState: boolean | null) => {
    const { error } = await supabase
      .from("job_profiles")
      .update({ is_active: !currentState })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: currentState ? "Profile deactivated" : "Profile activated" });
      fetchProfiles();
    }
  };

  const toggleVerified = async (id: string, currentState: boolean | null) => {
    const { error } = await supabase
      .from("job_profiles")
      .update({ is_verified: !currentState } as any)
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: currentState ? "Verification removed" : "Profile verified" });
      fetchProfiles();
    }
  };

  const deleteProfile = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job profile?")) return;
    const { error } = await supabase.from("job_profiles").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile deleted" });
      fetchProfiles();
    }
  };

  const filtered = profiles.filter((p) =>
    [p.full_name, p.location, p.district, p.state, ...p.skills]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (loading) return <p className="text-muted-foreground">Loading job profiles...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Job Profiles ({profiles.length})
        </CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, location, skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.full_name}</TableCell>
                  <TableCell>{p.district}, {p.state}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {p.skills.slice(0, 3).map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                      {p.skills.length > 3 && <Badge variant="outline">+{p.skills.length - 3}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{p.experience_years} yrs</TableCell>
                  <TableCell>
                    <Switch checked={!!p.is_active} onCheckedChange={() => toggleActive(p.id, p.is_active)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setSelectedProfile(p)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteProfile(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No job profiles found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedProfile?.full_name}</DialogTitle>
            </DialogHeader>
            {selectedProfile && (
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2"><Phone className="h-4 w-4" />{selectedProfile.phone}</div>
                {selectedProfile.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4" />{selectedProfile.email}</div>}
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4" />{selectedProfile.location}, {selectedProfile.district}, {selectedProfile.state}</div>
                {selectedProfile.age && <p><strong>Age:</strong> {selectedProfile.age}</p>}
                <p><strong>Experience:</strong> {selectedProfile.experience_years} years</p>
                <p><strong>Education:</strong> {selectedProfile.education || "N/A"}</p>
                <p><strong>Availability:</strong> {selectedProfile.availability}</p>
                <p><strong>Expected Salary:</strong> {selectedProfile.expected_salary || "N/A"}</p>
                <div>
                  <strong>Skills:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedProfile.skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                  </div>
                </div>
                {selectedProfile.languages && selectedProfile.languages.length > 0 && (
                  <div>
                    <strong>Languages:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedProfile.languages.map((l) => <Badge key={l} variant="outline">{l}</Badge>)}
                    </div>
                  </div>
                )}
                {selectedProfile.bio && <p><strong>Bio:</strong> {selectedProfile.bio}</p>}
                <p className="text-muted-foreground text-xs">Registered: {new Date(selectedProfile.created_at).toLocaleDateString()}</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AdminJobProfiles;
