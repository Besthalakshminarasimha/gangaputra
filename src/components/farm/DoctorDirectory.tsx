import { useState, useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  Loader2, Phone, Mail, MapPin, Clock, UserRound,
  Search, Stethoscope, CalendarIcon, CheckCircle2, List
} from "lucide-react";

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  qualification: string;
  experience_years: number;
  phone: string | null;
  email: string | null;
  location: string;
  image_url: string | null;
  consultation_fee: number | null;
  available_hours: string | null;
  languages: string[] | null;
  bio: string | null;
}

interface Appointment {
  id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  reason: string | null;
  status: string;
  created_at: string;
}

const TIME_SLOTS = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM",
];

const DoctorDirectory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [bookingDoc, setBookingDoc] = useState<Doctor | null>(null);
  const [date, setDate] = useState<Date | undefined>();
  const [timeSlot, setTimeSlot] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [showMyAppointments, setShowMyAppointments] = useState(false);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [apptLoading, setApptLoading] = useState(false);

  useEffect(() => {
    const fetchDoctors = async () => {
      const { data } = await supabase
        .from("doctors")
        .select("*")
        .eq("is_active", true)
        .order("experience_years", { ascending: false });
      setDoctors(data || []);
      setLoading(false);
    };
    fetchDoctors();
  }, []);

  const fetchMyAppointments = async () => {
    if (!user) return;
    setApptLoading(true);
    const { data } = await (supabase as any)
      .from("doctor_appointments")
      .select("*")
      .eq("user_id", user.id)
      .order("appointment_date", { ascending: true });
    setMyAppointments((data || []) as Appointment[]);
    setApptLoading(false);
  };

  const openBooking = (doc: Doctor) => {
    setBookingDoc(doc);
    setDate(undefined);
    setTimeSlot("");
    setReason("");
  };

  const handleBook = async () => {
    if (!user) {
      toast({ title: "Login required", description: "Please log in to book appointments", variant: "destructive" });
      return;
    }
    if (!date || !timeSlot || !bookingDoc) {
      toast({ title: "Missing info", description: "Please select a date and time slot", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any).from("doctor_appointments").insert({
      user_id: user.id,
      doctor_id: bookingDoc.id,
      appointment_date: format(date, "yyyy-MM-dd"),
      appointment_time: timeSlot,
      reason: reason || null,
      status: "pending",
    });
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Appointment Booked! 🎉", description: `Your appointment with ${bookingDoc.name} on ${format(date, "PPP")} at ${timeSlot} has been requested.` });
      setBookingDoc(null);
    }
  };

  const cancelAppointment = async (id: string) => {
    await (supabase as any).from("doctor_appointments").update({ status: "cancelled" }).eq("id", id);
    fetchMyAppointments();
    toast({ title: "Appointment cancelled" });
  };

  const filtered = doctors.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialization.toLowerCase().includes(search.toLowerCase()) ||
    d.location.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (status: string) => {
    if (status === "confirmed") return "default";
    if (status === "cancelled") return "destructive";
    return "secondary";
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Aquaculture Doctors
            </CardTitle>
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setShowMyAppointments(true); fetchMyAppointments(); }}
              >
                <List className="h-4 w-4 mr-1" />
                My Appointments
              </Button>
            )}
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, specialization, or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No doctors found</p>
          ) : (
            <div className="space-y-4">
              {filtered.map(doc => (
                <div key={doc.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center shrink-0">
                      {doc.image_url
                        ? <img src={doc.image_url} className="h-14 w-14 rounded-full object-cover" alt={doc.name} />
                        : <UserRound className="h-7 w-7 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base">{doc.name}</h3>
                      <p className="text-sm text-primary font-medium">{doc.specialization}</p>
                      <p className="text-xs text-muted-foreground">{doc.qualification}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">{doc.experience_years} yrs exp</Badge>
                        {doc.consultation_fee && (
                          <Badge variant="secondary" className="text-xs">₹{doc.consultation_fee}</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {doc.bio && <p className="text-sm text-muted-foreground">{doc.bio}</p>}

                  <div className="grid grid-cols-1 gap-1 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />{doc.location}
                    </div>
                    {doc.available_hours && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 shrink-0" />{doc.available_hours}
                      </div>
                    )}
                    {doc.languages && doc.languages.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {doc.languages.map((l, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{l}</Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1 flex-wrap">
                    {doc.phone && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={`tel:${doc.phone}`}><Phone className="h-3.5 w-3.5 mr-1" />Call</a>
                      </Button>
                    )}
                    {doc.email && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={`mailto:${doc.email}`}><Mail className="h-3.5 w-3.5 mr-1" />Email</a>
                      </Button>
                    )}
                    {doc.phone && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={`https://wa.me/${doc.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                      </Button>
                    )}
                    <Button size="sm" className="flex-1" onClick={() => openBooking(doc)}>
                      <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                      Book Appointment
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking Dialog */}
      <Dialog open={!!bookingDoc} onOpenChange={open => !open && setBookingDoc(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Book Appointment
            </DialogTitle>
          </DialogHeader>
          {bookingDoc && (
            <div className="space-y-4">
              {/* Doctor info summary */}
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center shrink-0">
                  {bookingDoc.image_url
                    ? <img src={bookingDoc.image_url} className="h-10 w-10 rounded-full object-cover" alt={bookingDoc.name} />
                    : <UserRound className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div>
                  <p className="font-semibold text-sm">{bookingDoc.name}</p>
                  <p className="text-xs text-muted-foreground">{bookingDoc.specialization}</p>
                  {bookingDoc.consultation_fee && (
                    <p className="text-xs text-primary font-medium">Fee: ₹{bookingDoc.consultation_fee}</p>
                  )}
                </div>
              </div>

              {/* Date picker */}
              <div className="space-y-1.5">
                <Label>Select Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={d => d < new Date() || d.getDay() === 0}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time slot */}
              <div className="space-y-1.5">
                <Label>Select Time Slot *</Label>
                <Select value={timeSlot} onValueChange={setTimeSlot}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a time" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <Label>Reason / Symptoms (optional)</Label>
                <Textarea
                  placeholder="Briefly describe your concern or symptoms..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={3}
                />
              </div>

              <Button onClick={handleBook} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Confirm Appointment
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* My Appointments Dialog */}
      <Dialog open={showMyAppointments} onOpenChange={setShowMyAppointments}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>My Appointments</DialogTitle>
          </DialogHeader>
          {apptLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : myAppointments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No appointments yet</p>
          ) : (
            <div className="space-y-3">
              {myAppointments.map(appt => {
                const doc = doctors.find(d => d.id === appt.doctor_id);
                return (
                  <div key={appt.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">{doc?.name ?? "Doctor"}</p>
                        <p className="text-xs text-muted-foreground">{doc?.specialization}</p>
                      </div>
                      <Badge variant={statusColor(appt.status)} className="capitalize text-xs shrink-0">
                        {appt.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" />{format(new Date(appt.appointment_date), "PPP")}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{appt.appointment_time}</span>
                    </div>
                    {appt.reason && <p className="text-xs text-muted-foreground italic">"{appt.reason}"</p>}
                    {appt.status === "pending" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="w-full"
                        onClick={() => cancelAppointment(appt.id)}
                      >
                        Cancel Appointment
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DoctorDirectory;
