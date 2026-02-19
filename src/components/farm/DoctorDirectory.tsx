import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Phone, Mail, MapPin, Clock, UserRound, Search, Stethoscope } from "lucide-react";

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

const DoctorDirectory = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("doctors").select("*").eq("is_active", true).order("experience_years", { ascending: false });
      setDoctors(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = doctors.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialization.toLowerCase().includes(search.toLowerCase()) ||
    d.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5" />
          Aquaculture Doctors
        </CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, specialization, or location..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
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
                    {doc.image_url ? <img src={doc.image_url} className="h-14 w-14 rounded-full object-cover" alt={doc.name} /> : <UserRound className="h-7 w-7 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base">{doc.name}</h3>
                    <p className="text-sm text-primary font-medium">{doc.specialization}</p>
                    <p className="text-xs text-muted-foreground">{doc.qualification}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">{doc.experience_years} yrs exp</Badge>
                      {doc.consultation_fee && <Badge variant="secondary" className="text-xs">₹{doc.consultation_fee}</Badge>}
                    </div>
                  </div>
                </div>

                {doc.bio && <p className="text-sm text-muted-foreground">{doc.bio}</p>}

                <div className="grid grid-cols-1 gap-1 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" />{doc.location}</div>
                  {doc.available_hours && <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-3.5 w-3.5 shrink-0" />{doc.available_hours}</div>}
                  {doc.languages && doc.languages.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {doc.languages.map((l, i) => <Badge key={i} variant="outline" className="text-xs">{l}</Badge>)}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  {doc.phone && (
                    <Button size="sm" className="flex-1" asChild>
                      <a href={`tel:${doc.phone}`}><Phone className="h-3.5 w-3.5 mr-1" />Call</a>
                    </Button>
                  )}
                  {doc.email && (
                    <Button size="sm" variant="outline" className="flex-1" asChild>
                      <a href={`mailto:${doc.email}`}><Mail className="h-3.5 w-3.5 mr-1" />Email</a>
                    </Button>
                  )}
                  {doc.phone && (
                    <Button size="sm" variant="secondary" className="flex-1" asChild>
                      <a href={`https://wa.me/${doc.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DoctorDirectory;
