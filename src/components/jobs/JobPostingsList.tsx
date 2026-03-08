import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, IndianRupee, Briefcase, Send } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Props {
  userId?: string;
  jobProfileId?: string;
}

const JobPostingsList = ({ userId, jobProfileId }: Props) => {
  const { data: postings = [], isLoading } = useQuery({
    queryKey: ["job-postings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_postings")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: myApplications = [], refetch: refetchApps } = useQuery({
    queryKey: ["my-applications", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_applications")
        .select("job_posting_id")
        .eq("applicant_id", userId!);
      if (error) throw error;
      return data.map((a: any) => a.job_posting_id);
    },
  });

  const applyToJob = async (postingId: string) => {
    if (!userId) { toast.error("Please login to apply"); return; }
    const { error } = await supabase.from("job_applications").insert({
      job_posting_id: postingId,
      applicant_id: userId,
      job_profile_id: jobProfileId || null,
    } as any);
    if (error) {
      if (error.code === "23505") toast.info("Already applied!");
      else toast.error(error.message);
      return;
    }
    toast.success("Application submitted!");
    refetchApps();
  };

  if (isLoading) return <p className="text-center text-muted-foreground py-8">Loading job postings...</p>;
  if (postings.length === 0) return <p className="text-center text-muted-foreground py-8">No job postings yet. Be the first employer to post!</p>;

  return (
    <div className="space-y-3">
      {postings.map((p: any) => {
        const applied = myApplications.includes(p.id);
        return (
          <Card key={p.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-base">{p.title}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" /> {p.district}, {p.state}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs shrink-0">{p.job_type}</Badge>
              </div>
              {p.description && <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
              <div className="flex flex-wrap gap-1">
                {(p.skills_required || []).slice(0, 4).map((s: string) => (
                  <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                ))}
                {(p.skills_required || []).length > 4 && <Badge variant="outline" className="text-xs">+{p.skills_required.length - 4}</Badge>}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  {p.salary_range && <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />{p.salary_range}</span>}
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(p.created_at), "dd MMM yyyy")}</span>
                </div>
                <Button size="sm" variant={applied ? "secondary" : "default"} disabled={applied || !userId} onClick={() => applyToJob(p.id)}>
                  <Send className="h-3 w-3 mr-1" /> {applied ? "Applied" : "Apply"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default JobPostingsList;
