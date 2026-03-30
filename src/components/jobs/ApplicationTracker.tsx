import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Users, MapPin, Clock, CheckCircle, XCircle, Hourglass } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Props {
  userId: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  reviewed: "bg-blue-100 text-blue-800",
  shortlisted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const ApplicationTracker = ({ userId }: Props) => {
  const queryClient = useQueryClient();

  const { data: myPostings = [], isLoading } = useQuery({
    queryKey: ["my-postings-with-apps", userId],
    queryFn: async () => {
      const { data: postings, error } = await supabase
        .from("job_postings")
        .select("*")
        .eq("employer_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!postings?.length) return [];

      const postingIds = postings.map(p => p.id);
      const { data: apps, error: appErr } = await supabase
        .from("job_applications")
        .select("*")
        .in("job_posting_id", postingIds)
        .order("created_at", { ascending: false });
      if (appErr) throw appErr;

      // Get applicant profiles
      const applicantIds = [...new Set((apps || []).map(a => a.applicant_id))];
      let profiles: any[] = [];
      if (applicantIds.length > 0) {
        const { data: p } = await supabase.from("profiles").select("*").in("id", applicantIds);
        profiles = p || [];
      }

      // Get job profiles for applicants
      let jobProfiles: any[] = [];
      const jobProfileIds = (apps || []).filter(a => a.job_profile_id).map(a => a.job_profile_id!);
      if (jobProfileIds.length > 0) {
        const { data: jp } = await supabase.from("job_profiles").select("*").in("id", jobProfileIds);
        jobProfiles = jp || [];
      }

      return postings.map(posting => ({
        ...posting,
        applications: (apps || [])
          .filter(a => a.job_posting_id === posting.id)
          .map(a => ({
            ...a,
            profile: profiles.find(p => p.id === a.applicant_id),
            jobProfile: jobProfiles.find(jp => jp.id === a.job_profile_id),
          })),
      }));
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ appId, status }: { appId: string; status: string }) => {
      const { error } = await supabase.from("job_applications").update({ status }).eq("id", appId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Application status updated");
      queryClient.invalidateQueries({ queryKey: ["my-postings-with-apps"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-center text-muted-foreground py-6">Loading your postings...</p>;
  if (myPostings.length === 0) return null;

  const totalApps = myPostings.reduce((sum: number, p: any) => sum + (p.applications?.length || 0), 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" /> Applications Received
          <Badge variant="secondary">{totalApps}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Accordion type="multiple">
          {myPostings.map((posting: any) => (
            <AccordionItem key={posting.id} value={posting.id}>
              <AccordionTrigger className="text-sm">
                <div className="flex items-center gap-2 text-left">
                  <span className="font-medium">{posting.title}</span>
                  <Badge variant="outline" className="text-xs">{posting.applications?.length || 0} apps</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {posting.applications?.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No applications yet</p>
                ) : (
                  <div className="space-y-3">
                    {posting.applications.map((app: any) => {
                      const jp = app.jobProfile;
                      const name = jp?.full_name || app.profile?.full_name || "Unknown";
                      const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                      return (
                        <div key={app.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={jp?.profile_image_url} />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{name}</p>
                              {jp && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{jp.district}, {jp.state}</p>}
                              <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Applied {format(new Date(app.created_at), "dd MMM yyyy")}</p>
                            </div>
                            <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[app.status] || "bg-muted"}`}>
                              {app.status}
                            </div>
                          </div>
                          {jp && (
                            <div className="flex flex-wrap gap-1">
                              {(jp.skills || []).slice(0, 4).map((s: string) => (
                                <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                              ))}
                              {jp.experience_years > 0 && <Badge variant="secondary" className="text-xs">{jp.experience_years}yr exp</Badge>}
                            </div>
                          )}
                          {jp?.phone && <p className="text-xs text-muted-foreground">📞 {jp.phone}</p>}
                          <Select value={app.status} onValueChange={v => updateStatus.mutate({ appId: app.id, status: v })}>
                            <SelectTrigger className="h-8 text-xs w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">⏳ Pending</SelectItem>
                              <SelectItem value="reviewed">👁 Reviewed</SelectItem>
                              <SelectItem value="shortlisted">✅ Shortlisted</SelectItem>
                              <SelectItem value="rejected">❌ Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default ApplicationTracker;
