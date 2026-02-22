import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format as formatDate } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Search, CalendarIcon, Clock, UserRound, CheckCircle, XCircle, RefreshCw } from "lucide-react";


interface AppointmentRow {
  id: string;
  user_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  reason: string | null;
  status: string;
  created_at: string;
  doctor_name?: string;
  doctor_specialization?: string;
  user_email?: string;
  user_name?: string;
}

const STATUS_OPTIONS = ["all", "pending", "confirmed", "cancelled"];

const statusVariant = (s: string): "default" | "secondary" | "destructive" | "outline" => {
  if (s === "confirmed") return "default";
  if (s === "cancelled") return "destructive";
  return "secondary";
};

const AdminAppointments = () => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchAppointments = async () => {
    setLoading(true);
    // Fetch appointments
    const { data: appts, error } = await (supabase as any)
      .from("doctor_appointments")
      .select("*")
      .order("appointment_date", { ascending: false });

    if (error) {
      toast({ title: "Error loading appointments", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Fetch doctors
    const { data: doctors } = await supabase.from("doctors").select("id, name, specialization");
    // Fetch profiles
    const { data: profiles } = await supabase.from("profiles").select("id, email, full_name");

    const doctorMap = new Map((doctors || []).map((d: any) => [d.id, d]));
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    const enriched: AppointmentRow[] = (appts || []).map((a: any) => ({
      ...a,
      doctor_name: doctorMap.get(a.doctor_id)?.name ?? "Unknown Doctor",
      doctor_specialization: doctorMap.get(a.doctor_id)?.specialization ?? "",
      user_email: profileMap.get(a.user_id)?.email ?? "Unknown",
      user_name: profileMap.get(a.user_id)?.full_name ?? "",
    }));

    setAppointments(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchAppointments(); }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    const { error } = await (supabase as any)
      .from("doctor_appointments")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Appointment ${status}`, description: `Status updated to ${status}` });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));

      // Send email notification to farmer
      const appt = appointments.find(a => a.id === id);
      if (appt?.user_email && (status === "confirmed" || status === "cancelled")) {
        try {
          await supabase.functions.invoke("send-appointment-email", {
            body: {
              to_email: appt.user_email,
              farmer_name: appt.user_name || "Farmer",
              doctor_name: appt.doctor_name || "Doctor",
              appointment_date: formatDate(new Date(appt.appointment_date), "dd MMM yyyy"),
              appointment_time: appt.appointment_time,
              status,
            },
          });
        } catch (emailErr) {
          console.error("Email notification failed:", emailErr);
        }
      }
    }
    setUpdating(null);
  };

  const filtered = appointments.filter(a => {
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      a.doctor_name?.toLowerCase().includes(q) ||
      a.user_email?.toLowerCase().includes(q) ||
      a.user_name?.toLowerCase().includes(q) ||
      a.reason?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const counts = {
    all: appointments.length,
    pending: appointments.filter(a => a.status === "pending").length,
    confirmed: appointments.filter(a => a.status === "confirmed").length,
    cancelled: appointments.filter(a => a.status === "cancelled").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Doctor Appointments</h2>
        <Button variant="outline" size="sm" onClick={fetchAppointments}>
          <RefreshCw className="h-4 w-4 mr-1" />Refresh
        </Button>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:border-primary"}`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s as keyof typeof counts]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by doctor, patient email or name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No appointments found</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(appt => (
            <Card key={appt.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{appt.doctor_name}</span>
                      <span className="text-xs text-muted-foreground">— {appt.doctor_specialization}</span>
                      <Badge variant={statusVariant(appt.status)} className="capitalize text-xs">
                        {appt.status}
                      </Badge>
                    </div>

                    {/* Patient */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <UserRound className="h-3.5 w-3.5 shrink-0" />
                      <span>{appt.user_name || appt.user_email}</span>
                      {appt.user_name && <span className="opacity-60">({appt.user_email})</span>}
                    </div>

                    {/* Date & Time */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {formatDate(new Date(appt.appointment_date), "dd MMM yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {appt.appointment_time}
                      </span>
                    </div>

                    {appt.reason && (
                      <p className="text-xs text-muted-foreground italic">Reason: "{appt.reason}"</p>
                    )}

                    <p className="text-xs text-muted-foreground opacity-60">
                      Booked {formatDate(new Date(appt.created_at), "dd MMM yyyy 'at' hh:mm a")}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 sm:flex-col sm:items-end">
                    {appt.status !== "confirmed" && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(appt.id, "confirmed")}
                        disabled={updating === appt.id}
                        className="flex-1 sm:flex-none"
                      >
                        {updating === appt.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                          : <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                        Confirm
                      </Button>
                    )}
                    {appt.status !== "cancelled" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateStatus(appt.id, "cancelled")}
                        disabled={updating === appt.id}
                        className="flex-1 sm:flex-none"
                      >
                        {updating === appt.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                          : <XCircle className="h-3.5 w-3.5 mr-1" />}
                        Cancel
                      </Button>
                    )}
                    {appt.status === "cancelled" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(appt.id, "pending")}
                        disabled={updating === appt.id}
                      >
                        Reopen
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAppointments;
