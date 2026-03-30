import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Briefcase, MapPin, Phone, Mail, GraduationCap, Clock, IndianRupee, Search, User, Languages, Calendar, Camera, MessageCircle, BadgeCheck, ThumbsUp, FileDown, Send, Building } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import JobPostingForm from "@/components/jobs/JobPostingForm";
import JobPostingsList from "@/components/jobs/JobPostingsList";
import InAppChat from "@/components/jobs/InAppChat";
import ChatList from "@/components/jobs/ChatList";
import EndorsementLeaderboard from "@/components/jobs/EndorsementLeaderboard";
import ResumeExport from "@/components/jobs/ResumeExport";
import ApplicationTracker from "@/components/jobs/ApplicationTracker";

const SKILL_OPTIONS = [
  "Pond Management", "Water Quality Testing", "Feed Management", "Disease Diagnosis",
  "Hatchery Operations", "Harvesting", "Equipment Maintenance", "Aeration Systems",
  "Biofloc Technology", "Shrimp Farming", "Fish Farming", "Crab Farming",
  "Lab Technician", "Driving", "Electrical Work", "Plumbing", "Accounting",
];

const STATES = [
  "Andhra Pradesh", "Tamil Nadu", "Karnataka", "Telangana", "Kerala",
  "West Bengal", "Odisha", "Gujarat", "Maharashtra", "Goa",
];

const Jobs = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSkill, setFilterSkill] = useState("all");
  const [filterState, setFilterState] = useState("all");
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [chatWith, setChatWith] = useState<{ id: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    full_name: "", phone: "", email: "", age: "",
    location: "", district: "", state: "",
    experience_years: "", skills: [] as string[],
    education: "", languages: [] as string[],
    expected_salary: "", availability: "full-time", bio: "",
    profile_image_url: "",
  });

  const [newSkill, setNewSkill] = useState("");
  const [newLang, setNewLang] = useState("");

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["job-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_profiles").select("*").eq("is_active", true).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: endorsements = [], refetch: refetchEndorsements } = useQuery({
    queryKey: ["skill-endorsements"],
    queryFn: async () => {
      const { data, error } = await supabase.from("skill_endorsements").select("*");
      if (error) throw error;
      return data as { id: string; job_profile_id: string; skill: string; endorser_id: string }[];
    },
  });

  const { data: myProfile } = useQuery({
    queryKey: ["my-job-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("job_profiles").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      if (data) {
        setForm({
          full_name: data.full_name || "", phone: data.phone || "", email: data.email || "",
          age: data.age?.toString() || "", location: data.location || "", district: data.district || "",
          state: data.state || "", experience_years: data.experience_years?.toString() || "0",
          skills: data.skills || [], education: data.education || "", languages: data.languages || [],
          expected_salary: data.expected_salary || "", availability: data.availability || "full-time",
          bio: data.bio || "", profile_image_url: data.profile_image_url || "",
        });
        setPreviewUrl(data.profile_image_url || null);
      }
      return data;
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be less than 5MB"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/profile.${ext}`;
    const { error: uploadError } = await supabase.storage.from("job-profiles").upload(filePath, file, { upsert: true });
    if (uploadError) { toast.error("Upload failed: " + uploadError.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("job-profiles").getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl + "?t=" + Date.now();
    setForm(f => ({ ...f, profile_image_url: publicUrl }));
    setPreviewUrl(publicUrl);
    toast.success("Photo uploaded!");
    setUploading(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Login required");
      const payload = {
        user_id: user.id, full_name: form.full_name.trim(), phone: form.phone.trim(),
        email: form.email.trim() || null, age: form.age ? parseInt(form.age) : null,
        location: form.location.trim(), district: form.district.trim(), state: form.state,
        experience_years: parseInt(form.experience_years) || 0, skills: form.skills,
        education: form.education.trim() || null, languages: form.languages,
        expected_salary: form.expected_salary.trim() || null, availability: form.availability,
        bio: form.bio.trim() || null, profile_image_url: form.profile_image_url || null,
      };
      if (!payload.full_name || !payload.phone || !payload.location || !payload.district || !payload.state) throw new Error("Please fill all required fields");
      if (myProfile) {
        const { error } = await supabase.from("job_profiles").update(payload).eq("id", myProfile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("job_profiles").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(myProfile ? "Profile updated!" : "Profile created!");
      queryClient.invalidateQueries({ queryKey: ["job-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["my-job-profile"] });
      setActiveTab("browse");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!myProfile) return;
      const { error } = await supabase.from("job_profiles").delete().eq("id", myProfile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile removed");
      queryClient.invalidateQueries({ queryKey: ["job-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["my-job-profile"] });
      setForm({ full_name: "", phone: "", email: "", age: "", location: "", district: "", state: "", experience_years: "", skills: [], education: "", languages: [], expected_salary: "", availability: "full-time", bio: "", profile_image_url: "" });
      setPreviewUrl(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addSkill = (skill: string) => {
    if (skill && !form.skills.includes(skill)) setForm(f => ({ ...f, skills: [...f.skills, skill] }));
    setNewSkill("");
  };

  const addLang = (lang: string) => {
    if (lang && !form.languages.includes(lang)) setForm(f => ({ ...f, languages: [...f.languages, lang] }));
    setNewLang("");
  };

  const filtered = profiles.filter((p: any) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || p.full_name?.toLowerCase().includes(q) || p.location?.toLowerCase().includes(q) || p.district?.toLowerCase().includes(q) || (p.skills || []).some((s: string) => s.toLowerCase().includes(q));
    const matchesSkill = filterSkill === "all" || (p.skills || []).includes(filterSkill);
    const matchesState = filterState === "all" || p.state === filterState;
    return matchesSearch && matchesSkill && matchesState;
  });

  const getEndorsementCount = (profileId: string, skill: string) =>
    endorsements.filter(e => e.job_profile_id === profileId && e.skill === skill).length;

  const hasEndorsed = (profileId: string, skill: string) =>
    user ? endorsements.some(e => e.job_profile_id === profileId && e.skill === skill && e.endorser_id === user.id) : false;

  const toggleEndorsement = async (profileId: string, skill: string) => {
    if (!user) { toast.error("Please login to endorse skills"); return; }
    const existing = endorsements.find(e => e.job_profile_id === profileId && e.skill === skill && e.endorser_id === user.id);
    if (existing) await supabase.from("skill_endorsements").delete().eq("id", existing.id);
    else await supabase.from("skill_endorsements").insert({ job_profile_id: profileId, skill, endorser_id: user.id });
    refetchEndorsements();
  };

  const getProfileEndorsementCounts = (profile: any) => {
    const counts: Record<string, number> = {};
    (profile.skills || []).forEach((s: string) => { counts[s] = getEndorsementCount(profile.id, s); });
    return counts;
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const openChat = (partnerId: string, partnerName: string) => {
    setChatWith({ id: partnerId, name: partnerName });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4">
        <div className="flex items-center gap-3">
          <Link to="/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2"><Briefcase className="h-5 w-5" /> Job Board</h1>
            <p className="text-sm opacity-90">Find jobs, hire workers, and connect</p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="browse">Workers</TabsTrigger>
            <TabsTrigger value="jobs"><Building className="h-3 w-3 mr-1" />Jobs</TabsTrigger>
            <TabsTrigger value="messages"><MessageCircle className="h-3 w-3 mr-1" />Chat</TabsTrigger>
            <TabsTrigger value="apply">{myProfile ? "Profile" : "Apply"}</TabsTrigger>
          </TabsList>

          {/* Browse Workers Tab */}
          <TabsContent value="browse" className="space-y-4 mt-4">
            <EndorsementLeaderboard onSelectProfile={setSelectedProfile} />
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name, location, skill..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterSkill} onValueChange={setFilterSkill}>
                <SelectTrigger className="w-1/2"><SelectValue placeholder="Filter by skill" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Skills</SelectItem>
                  {SKILL_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterState} onValueChange={setFilterState}>
                <SelectTrigger className="w-1/2"><SelectValue placeholder="Filter by state" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading profiles...</p>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No profiles found.</p>
            ) : (
              <div className="space-y-3">
                {filtered.map((p: any) => (
                  <Card key={p.id} className="cursor-pointer" onClick={() => setSelectedProfile(p)}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12 shrink-0">
                          <AvatarImage src={p.profile_image_url} alt={p.full_name} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">{getInitials(p.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-base flex items-center gap-1">{p.full_name}{p.is_verified && <BadgeCheck className="h-4 w-4 text-blue-500" />}</h3>
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" /> {p.district}, {p.state}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs shrink-0">{p.experience_years}yr exp</Badge>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(p.skills || []).slice(0, 4).map((s: string) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                            {(p.skills || []).length > 4 && <Badge variant="outline" className="text-xs">+{p.skills.length - 4}</Badge>}
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {p.availability}</span>
                            {p.expected_salary && <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" /> {p.expected_salary}</span>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Job Postings Tab */}
          <TabsContent value="jobs" className="space-y-4 mt-4">
            {user && <JobPostingForm userId={user.id} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["job-postings"] })} />}
            <JobPostingsList userId={user?.id} jobProfileId={myProfile?.id} />
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="mt-4">
            {!user ? (
              <Card><CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-3">Please login to view messages</p>
                <Link to="/auth"><Button>Login / Sign Up</Button></Link>
              </CardContent></Card>
            ) : chatWith ? (
              <InAppChat currentUserId={user.id} receiverId={chatWith.id} receiverName={chatWith.name} onBack={() => setChatWith(null)} />
            ) : (
              <ChatList userId={user.id} onSelectChat={(id, name) => setChatWith({ id, name })} />
            )}
          </TabsContent>

          {/* Apply / Profile Tab */}
          <TabsContent value="apply" className="space-y-4 mt-4">
            {!user ? (
              <Card><CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-3">Please login to create your job profile</p>
                <Link to="/auth"><Button>Login / Sign Up</Button></Link>
              </CardContent></Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{myProfile ? "Edit Your Profile" : "Create Job Profile"}</CardTitle>
                  <CardDescription>Fill in your details so employers can find you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={previewUrl || undefined} alt="Profile" />
                        <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                          {form.full_name ? getInitials(form.full_name) : <User className="h-8 w-8" />}
                        </AvatarFallback>
                      </Avatar>
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 shadow-md hover:bg-primary/90 transition-colors" disabled={uploading}>
                        <Camera className="h-4 w-4" />
                      </button>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <p className="text-xs text-muted-foreground">{uploading ? "Uploading..." : "Tap camera icon to add photo"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2"><Label>Full Name *</Label><Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Your full name" /></div>
                    <div><Label>Phone *</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="9876543210" /></div>
                    <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" /></div>
                    <div><Label>Age</Label><Input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} placeholder="25" /></div>
                    <div><Label>Experience (years) *</Label><Input type="number" value={form.experience_years} onChange={e => setForm(f => ({ ...f, experience_years: e.target.value }))} placeholder="3" /></div>
                    <div className="col-span-2"><Label>Location / Village *</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Village / Town" /></div>
                    <div><Label>District *</Label><Input value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} placeholder="District" /></div>
                    <div><Label>State *</Label>
                      <Select value={form.state} onValueChange={v => setForm(f => ({ ...f, state: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2"><Label>Education</Label><Input value={form.education} onChange={e => setForm(f => ({ ...f, education: e.target.value }))} placeholder="e.g. B.Sc Fisheries, 10th Pass" /></div>
                    <div><Label>Expected Salary</Label><Input value={form.expected_salary} onChange={e => setForm(f => ({ ...f, expected_salary: e.target.value }))} placeholder="e.g. ₹15,000/month" /></div>
                    <div><Label>Availability</Label>
                      <Select value={form.availability} onValueChange={v => setForm(f => ({ ...f, availability: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full Time</SelectItem>
                          <SelectItem value="part-time">Part Time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="seasonal">Seasonal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Skills *</Label>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {form.skills.map(s => <Badge key={s} variant="default" className="cursor-pointer" onClick={() => setForm(f => ({ ...f, skills: f.skills.filter(x => x !== s) }))}>{s} ✕</Badge>)}
                    </div>
                    <Select value={newSkill} onValueChange={v => addSkill(v)}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Add a skill" /></SelectTrigger>
                      <SelectContent>{SKILL_OPTIONS.filter(s => !form.skills.includes(s)).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Languages</Label>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {form.languages.map(l => <Badge key={l} variant="secondary" className="cursor-pointer" onClick={() => setForm(f => ({ ...f, languages: f.languages.filter(x => x !== l) }))}>{l} ✕</Badge>)}
                    </div>
                    <div className="flex gap-2">
                      <Input value={newLang} onChange={e => setNewLang(e.target.value)} placeholder="e.g. Telugu, English" onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addLang(newLang); }}} />
                      <Button type="button" variant="outline" size="sm" onClick={() => addLang(newLang)}>Add</Button>
                    </div>
                  </div>
                  <div><Label>About Yourself</Label><Textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Brief description about your experience..." rows={3} /></div>
                  <div className="flex gap-2">
                    <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || uploading} className="flex-1">
                      {saveMutation.isPending ? "Saving..." : myProfile ? "Update Profile" : "Submit Profile"}
                    </Button>
                    {myProfile && <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>Delete</Button>}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Profile Detail Dialog */}
      <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          {selectedProfile && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedProfile.profile_image_url} alt={selectedProfile.full_name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">{getInitials(selectedProfile.full_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="flex items-center gap-1">{selectedProfile.full_name}{selectedProfile.is_verified && <BadgeCheck className="h-5 w-5 text-blue-500" />}</DialogTitle>
                    <DialogDescription>{selectedProfile.availability} • {selectedProfile.experience_years} years experience</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {selectedProfile.location}, {selectedProfile.district}, {selectedProfile.state}</div>
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> <a href={`tel:${selectedProfile.phone}`} className="text-primary underline">{selectedProfile.phone}</a></div>
                {selectedProfile.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> <a href={`mailto:${selectedProfile.email}`} className="text-primary underline">{selectedProfile.email}</a></div>}
                {selectedProfile.age && <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> Age: {selectedProfile.age}</div>}
                {selectedProfile.education && <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-muted-foreground" /> {selectedProfile.education}</div>}
                {selectedProfile.expected_salary && <div className="flex items-center gap-2"><IndianRupee className="h-4 w-4 text-muted-foreground" /> {selectedProfile.expected_salary}</div>}
                {selectedProfile.languages?.length > 0 && <div className="flex items-center gap-2"><Languages className="h-4 w-4 text-muted-foreground" /> {selectedProfile.languages.join(", ")}</div>}
                <div>
                  <p className="font-medium mb-1">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {(selectedProfile.skills || []).map((s: string) => {
                      const count = getEndorsementCount(selectedProfile.id, s);
                      const endorsed = hasEndorsed(selectedProfile.id, s);
                      return (
                        <button key={s} onClick={() => toggleEndorsement(selectedProfile.id, s)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${endorsed ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-foreground hover:bg-muted"}`}>
                          <ThumbsUp className={`h-3 w-3 ${endorsed ? "fill-primary" : ""}`} /> {s}
                          {count > 0 && <span className="ml-0.5 text-muted-foreground">({count})</span>}
                        </button>
                      );
                    })}
                  </div>
                  {user && <p className="text-xs text-muted-foreground mt-1">Tap a skill to endorse</p>}
                </div>
                {selectedProfile.bio && <div><p className="font-medium mb-1">About</p><p className="text-muted-foreground">{selectedProfile.bio}</p></div>}
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Registered {format(new Date(selectedProfile.created_at), "dd MMM yyyy")}
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button className="flex-1" asChild><a href={`tel:${selectedProfile.phone}`}><Phone className="h-4 w-4 mr-1" /> Call</a></Button>
                  <Button variant="secondary" className="flex-1 bg-green-600 hover:bg-green-700 text-white" asChild>
                    <a href={`https://wa.me/${selectedProfile.phone.replace(/[^0-9]/g, '').replace(/^0/, '91')}?text=${encodeURIComponent(`Hi ${selectedProfile.full_name}, I saw your profile on GANGAPUTRA and would like to discuss a job opportunity.`)}`} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
                    </a>
                  </Button>
                  {user && selectedProfile.user_id !== user.id && (
                    <Button variant="outline" className="flex-1" onClick={() => { setSelectedProfile(null); setChatWith({ id: selectedProfile.user_id, name: selectedProfile.full_name }); setActiveTab("messages"); }}>
                      <Send className="h-4 w-4 mr-1" /> Message
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {selectedProfile.email && <Button variant="outline" size="sm" asChild><a href={`mailto:${selectedProfile.email}`}><Mail className="h-4 w-4 mr-1" /> Email</a></Button>}
                  <ResumeExport profile={selectedProfile} endorsementCounts={getProfileEndorsementCounts(selectedProfile)} />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Jobs;
