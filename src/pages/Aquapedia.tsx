import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  MapPin, 
  Phone, 
  Fish, 
  Pill, 
  Filter,
  ExternalLink
} from "lucide-react";

const Aquapedia = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const hatcheries = [
    { name: "Sudhith Shrimp Hatchery", location: "Chengalpattu", region: "Tamil Nadu", type: "Private Hatchery", species: ["L. vannamei"], contact: "Contact for inquiries" },
    { name: "Devi Seafoods Limited", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["L. vannamei"], contact: "Contact for inquiries" },
    { name: "Vaisakhi Bio-marine Pvt. Ltd., Unit – I", location: "Villupuram", region: "Tamil Nadu", type: "Private Hatchery", species: ["L. vannamei"], contact: "Contact for inquiries" },
    { name: "Alpha Hatchery", location: "Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["L. vannamei"], contact: "9394930100" },
    { name: "C.P. Aquaculture (INDIA) Private Limited", location: "Nellore / Chennai", region: "Andhra Pradesh / Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Nellore Hatcheries", location: "Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "9849049118" },
    { name: "Wintoss Associates", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Mahitha Shrimp Hatcheries", location: "Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "BMR Industries Private Limited", location: "Chengalpattu", region: "Tamil Nadu", type: "Private Hatchery", species: ["L. vannamei"], contact: "Contact for inquiries" },
    { name: "Babu Aquarists Hatchery", location: "Kakinada (E. Godavari)", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Lotus Sea Farms", location: "Kancheepuram", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Oceanic Bio - Harvests Limited", location: "Nagapattinam", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "SVR Hatcheries", location: "Kakinada (E. Godavari)", region: "Andhra Pradesh", type: "Private Hatchery", species: ["L. vannamei"], contact: "9440965995" },
    { name: "NGR Aquatech Private Limited", location: "Visakhapatnam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "K.P.R. Hatchery", location: "East Godavari", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Om Maritech Private Limited", location: "East Godavari", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Avanti Feeds - Unit I", location: "Anakapalli", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "B Tech Hatcheries", location: "Kakinada", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Raj Hatcheries Madras Pvt. Ltd.", location: "Chennai / Villupuram", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Krishna Hatcheries", location: "Bapatla (Guntur)", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sapthagiri Hatcheries", location: "Anakapalli / Kakinada", region: "Andhra Pradesh", type: "SPF Hatchery", species: ["SPF Post-Larvae"], contact: "Contact for inquiries" },
    { name: "Rajvarma Hatcheries", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Srinivasulu Hatchery", location: "Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Golden Marine Harvests", location: "Villupuram", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Bay Fry Pvt. Ltd.", location: "Andhra Pradesh", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sai Sudha Hatcheries", location: "Kakinada", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "BMR Shrimp Hatcheries", location: "Andhra Pradesh", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Vyjayanthee Hatcheries", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Ravi Hatcheries LLP", location: "Tamil Nadu", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Padmavathi Hatchery", location: "Andhra Pradesh", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sai Bhargavi Hatcheries Private Limited", location: "Andhra Pradesh", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Maruthi Aqua Technologies (P) Ltd.", location: "Kakinada", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Aqua Prime International (I) Ltd.", location: "SPSR Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Vaisakhi Bio-Marine Pvt. Ltd - Unit II", location: "Anakapalli", region: "Andhra Pradesh", type: "Private Hatchery", species: ["L. vannamei"], contact: "Contact for inquiries" },
    { name: "Sree Kamadhenu Aquatech", location: "Andhra Pradesh", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Adithya Bio Resources", location: "Kakinada", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "MSR Aqua Pvt. Ltd.", location: "Kakinada", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "NSR Aqua farms Pvt. Ltd.", location: "Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sun Shine Marine", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Raj Hatcheries (Bengal) Pvt. Ltd.", location: "Purba Medinipur", region: "West Bengal", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sree Hatchery", location: "SPSR Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Pavani Hatcheries", location: "Andhra Pradesh", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Amarnaath Hatchery", location: "Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sree Vyshnavi hatcheries", location: "Andhra Pradesh", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Meenakshi Hatcheries Pvt. Ltd.", location: "Visakhapatnam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sripa Aqua Marine Pvt. Ltd - Unit II", location: "SPSR Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Bindu Hatcheries", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sri Sai Hatchery & Prawn Culture Pvt. Ltd.", location: "Bapatla", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Fedora Sea Foods Pvt. Ltd.", location: "SPSR Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Blue Park Hatcheries (India) Pvt. Ltd.", location: "Kakinada", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sarada Marine Products", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Star Aqua Hatchery", location: "Andhra Pradesh", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Srivaraha Mahalakshmi Hatcheries Pvt. Ltd.", location: "Visakhapatnam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "SB Marines", location: "Kakinada", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sankalpa Prawn Farms & Hatcheries", location: "Anakapalli", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sunshine AQ Care Pvt. Ltd - Unit III", location: "Chengalpattu", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sree Veerabhadhraa Hatcheries", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Rocman Shrimp Hatchery", location: "Chengalpattu", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sreevalli Hatcheries", location: "SPSR Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Varun Hatcheries", location: "Bapatla", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sri Manjunatha Hatcheries", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Gaayathri Bio Marine", location: "Bapatla", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sheng Long Bio-Tech (India) Pvt. Ltd.", location: "Chengalpattu", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Shree Kanak Matsya Hatcheries", location: "Ganjam", region: "Odisha", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Srinivasa Hatcheries", location: "Kakinada", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sandhya Aqua Exports Pvt. Ltd.", location: "SPSR Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "BKMN Aqua", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "East Coast Hatcheries", location: "Villupuram", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Venkata Sai Hatcheries", location: "Kakinada", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sripa Aqua Marine Pvt. Ltd.", location: "SPSR Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sree Dattareya Hatcheries", location: "Bapatla", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Seven Staar Aquatech", location: "Chengalpattu", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Divyasneha Hatcheries", location: "SPSR Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Rajkamal Shrimp Hatchery Pvt. Ltd.", location: "Visakhapatnam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sun Glow Marine", location: "Chengalpattu", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Srinidhi Biotechnologies", location: "Anakapalli", region: "Andhra Pradesh", type: "Private Hatchery", species: ["L. vannamei"], contact: "9849444057" },
    { name: "Sri Venkateswara Shrimp Hatcheries Pvt. Ltd.", location: "Kakinada", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Vaisakhi Bio-Resources Pvt. Ltd.", location: "Vizianagaram", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Balaji Aqua & Agro Products Pvt. Ltd.", location: "Bapatla", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Suhaan Enterprises", location: "Bapatla", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sai Marine Exports Pvt. Ltd - Unit II", location: "Anakapalli", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Veenus Enterprises", location: "SPSR Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "SS Hatcheries", location: "Tirupati", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Royal Hatcheries", location: "Chengalpattu", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Calypso Aquatech Pvt. Ltd.", location: "Villupuram", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Vaisakhi Bio-Marine Pvt. Ltd - Unit III", location: "Srikakulam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["L. vannamei"], contact: "Contact for inquiries" },
    { name: "Sri Sampat Vinayak Aqua Products Pvt. Ltd.", location: "Visakhapatnam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Akshaya Hatcheries", location: "Bapatla", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Rama Shrimp Hatchery", location: "Kakinada", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Vishal Marine Hatchery", location: "Chengalpattu", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Beach Hatchery", location: "Chengalpattu", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Shilpa Hatcheries LLP", location: "Anakapalli", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sri Pavan Aquatech", location: "East Godavari", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Empire Marine Harvest", location: "Villupuram", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Gayathri Hatcheries", location: "Bapatla (Guntur)", region: "Andhra Pradesh", type: "Private Hatchery", species: ["L. vannamei"], contact: "9849815566" },
    { name: "Ananda Aqua Applications", location: "Bapatla (Guntur)", region: "Andhra Pradesh", type: "Hatchery & Aqua Applications", species: ["Shrimp"], contact: "9849556699" },
    { name: "Shirdi Sai Hatcheries", location: "Chengalpattu", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Aquatic Farms Ltd.", location: "Andhra Pradesh", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "The Water Base Limited", location: "Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Kailaas Hatchery", location: "Andhra Pradesh", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sri Sai Srinivasa Hatcheries", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Devi Seafoods Limited - Unit II", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["L. vannamei"], contact: "Contact for inquiries" },
    { name: "Coastal Aqua Pvt. Ltd.", location: "Anakapalli", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sree Mahalakshi Hatcheries", location: "Visakhapatnam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sun Bio Marine Hatchery", location: "SPSR Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Anjaneya Marine Hatcheries", location: "Tirupati", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Blue Star Marines", location: "Villupuram", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sri Balaji Aqua Tech", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Blue Bay Culture", location: "Villupuram", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sree Swathi Marine Hatchery", location: "East Godavari", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sun Hatcheries - Unit II", location: "SPSR Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sree Raja Rajeshwari Hatcheries", location: "Visakhapatnam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Vyjayanthee Hatcheries - Unit II", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sri Venkataramaraju Hatcheries", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sri Siva Jyothi Exports & Imports", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Kings International Ltd.", location: "Tamil Nadu", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "BMR Marine Products Pvt. Ltd- Vizag", location: "Visakhapatnam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sri Puri Jaganadh Hatchery", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Gowri Aqua", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Deejay Prawn Hatchery", location: "Chengalpattu", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Ramaniah Hatcheries", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "TMR Biomarine", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sona Shrimps Hatcheries", location: "Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Haritha Aqua Hatchery", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "AR Shrimp Hatchery", location: "Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Mas Aqua Techniks Pvt. Ltd.", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sree Gayathri Hatchery", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "BMR Exports - Tindivanam", location: "Villupuram", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Matha Marine Hatchery", location: "Kancheepuram", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sri Surya Aqua Marine", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Global Aqua Products", location: "Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sai Balaji Hatcheries", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sai Marine Exports Pvt. Ltd", location: "Anakapalli", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Mukkam Aqua Marine Pvt. Ltd.", location: "Vizianagaram", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sarvesh Aqua Tech", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Shri Raghavendra Hatcheries", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sai Pavan Aquatech", location: "East Godavari", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Jeyasakthi Marine", location: "Tamil Nadu", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sree Kanya Aqua Tech", location: "East Godavari", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Devi Marine", location: "Tamil Nadu", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "S.K. Hatcheries", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sri Sai Ram Hatcheries", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Anand Aqua Marine", location: "Tamil Nadu", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Annapurna Marine", location: "East Godavari", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "ASR Hatcheries", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Cee Pee Bio Marine", location: "Tamil Nadu", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Coastal Aqua Tech", location: "Tamil Nadu", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Ganga Marine Hatcheries", location: "Purba Medinipur", region: "West Bengal", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Kaveri Marine", location: "Tamil Nadu", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Konda Aqua Farms", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Lakshmi Sai Hatcheries", location: "Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Max Aqua", location: "East Godavari", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "RGCA - Broodstock Center", location: "Visakhapatnam", region: "Andhra Pradesh", type: "Government/Research Institute", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Navadurga Hatcheries", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Omega Hatcheries", location: "Villupuram", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Pragati Hatcheries", location: "Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "R.R. Hatcheries", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sai Krishna Marine", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sai Priya Marine", location: "Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sai Sree Aqua Marine", location: "Tamil Nadu", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sree Ayyappa Hatcheries", location: "Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sree Venkata Sai Marine", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Star Hatchery", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Suvarna Rekha Aqua", location: "East Godavari", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Thejaswi Aqua", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Universal Hatchery", location: "Tamil Nadu", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Venus Enterprises", location: "SPSR Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "VSL Hatcheries", location: "Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Zillion Marine", location: "Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "CPF (India) Pvt. Ltd - Mukkam", location: "Vizianagaram", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sree Lakshmi Hatcheries", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sri Sai Jyothi Hatcheries", location: "Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Sree Mahalakshmi Hatcheries - Nellore", location: "Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Krishna Godavari Aquatech Pvt. Ltd.", location: "East Godavari", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Priyanka Enterprises", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Vandayar Hatchery", location: "Tamil Nadu", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Apex Frozen Foods Ltd Hatchery", location: "SPSR Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "Vaisakhi Bio-Resources Pvt. Ltd. - Plant II", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Balaji Hatcheries", location: "Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Vasista Hatcheries", location: "East Godavari", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Sri Sai Balaji Aquatics", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Amaranath Hatcheries", location: "SPSR Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Sri Venkateswara Hatcheries", location: "Kakinada", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Coastal Aquatech", location: "Vizianagaram", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Sea Pride Aqua", location: "Villupuram", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Shree Nidhi Aqua", location: "Chengalpattu", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Green Tech Marine", location: "Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Ocean Harvest", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Kings Aqua Marine", location: "Villupuram", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Aqua Glory", location: "East Godavari", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Blue Cross Hatcheries", location: "Visakhapatnam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Sree Pavan Aquatech", location: "East Godavari", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Maruthi Aqua Technologies - Unit II", location: "Kakinada", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Aqua Bio Marine", location: "SPSR Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Siva Sai Marine", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Gopi Marine Exports", location: "Chengalpattu", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Devi Aqua Marine", location: "Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Sarveswara Hatcheries", location: "Kakinada", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Sri Raja Rajeswari Hatcheries", location: "Visakhapatnam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Delta Marine Hatcheries", location: "East Godavari", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Sri Varaha Hatcheries", location: "Anakapalli", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Sai Krishna Marine", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Sai Ram Hatcheries", location: "Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Aqua Labs India", location: "Villupuram", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Coastal Star Hatchery", location: "Kakinada", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Ocean King Hatcheries", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Star Marine Hatchery", location: "Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Sri Balaji Aqua", location: "Visakhapatnam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Vasistha Hatcheries", location: "East Godavari", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. GMR Aqua Marine", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Prince Aqua Private Limited", location: "Visakhapatnam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Sree Venkateswara Marine", location: "Chengalpattu", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Sai Priya Marine", location: "Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Aqua Gold Hatchery", location: "East Godavari", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Sea Shell Hatchery", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Lakshmi Sai Hatcheries", location: "Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Sri Kanaka Durga Aqua", location: "Kakinada", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Blue Wave Hatcheries", location: "Villupuram", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Sree Krishna Marine", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Ayyappa Marine Hatchery", location: "Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Sri Rama Hatcheries", location: "Anakapalli", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Mahalakshmi Aqua Marine", location: "Kakinada", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Goutham Marine", location: "Chengalpattu", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Star Aqua Farms", location: "Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Jai Bheem Hatchery", location: "East Godavari", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Golden Bay Hatchery", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Sri Vighneswara Hatchery", location: "Visakhapatnam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Global Aqua Products", location: "SPSR Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Sunrays Aqua", location: "Villupuram", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Sarada Marine Products", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Devi Aqua Products", location: "Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. NGR Aquatech - Unit II", location: "Visakhapatnam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Sai Venkateswara Aqua", location: "Kakinada", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. R.R. Hatcheries", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Marine Aqua Tech", location: "Nellore", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Green Coast Aqua", location: "Chengalpattu", region: "Tamil Nadu", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Sri Satya Marine", location: "East Godavari", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" },
    { name: "M/s. Amrutha Hatcheries", location: "Prakasam", region: "Andhra Pradesh", type: "Private Hatchery", species: ["Shrimp"], contact: "Contact for inquiries" }
  ];

  const medicines = [
    {
      name: "Aqua-Safe Plus",
      category: "Water Treatment",
      manufacturer: "AquaPharm Ltd",
      activeIngredient: "Potassium Permanganate",
      dosage: "1-2 ppm",
      price: "₹450/kg",
      caaApproved: true,
      uses: ["Water disinfection", "Pond preparation"]
    },
    {
      name: "Bio-Probiotic",
      category: "Probiotic",
      manufacturer: "Marine Biotech",
      activeIngredient: "Bacillus species",
      dosage: "250g/acre",
      price: "₹850/kg",
      caaApproved: true,
      uses: ["Water quality improvement", "Disease prevention"]
    },
    {
      name: "Oxy-Fresh",
      category: "Oxygenator",
      manufacturer: "Aqua Solutions",
      activeIngredient: "Sodium Percarbonate",
      dosage: "0.5-1 kg/acre",
      price: "₹320/kg",
      caaApproved: true,
      uses: ["Emergency oxygen supply", "Stress reduction"]
    }
  ];

  const filteredHatcheries = hatcheries.filter(hatchery => {
    const matchesSearch = hatchery.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hatchery.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hatchery.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hatchery.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hatchery.species.some(species => species.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRegion = selectedRegion === "all" || hatchery.region === selectedRegion;
    const matchesType = selectedType === "all" || hatchery.type === selectedType;
    
    return matchesSearch && matchesRegion && matchesType;
  });

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    medicine.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    medicine.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNearMe = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          toast({
            title: "Location detected",
            description: "Showing hatcheries near you (feature in development)",
          });
        },
        (error) => {
          toast({
            title: "Location access denied",
            description: "Please enable location access to use this feature",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
    }
  };

  const handleBuyMedicine = (medicine: any) => {
    toast({
      title: "Purchase initiated",
      description: `Redirecting to purchase ${medicine.name}...`,
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Aquapedia</h1>
        <p className="text-white/80">Your comprehensive aquaculture knowledge base</p>
      </div>

      <div className="p-4 space-y-6">
        {/* Search Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search hatcheries, medicines, or information..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="hatcheries" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="hatcheries">Hatcheries</TabsTrigger>
            <TabsTrigger value="medicines">CAA Medicines</TabsTrigger>
          </TabsList>

          {/* Hatcheries Tab */}
          <TabsContent value="hatcheries" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Major Hatcheries</h2>
              <Badge variant="outline">{filteredHatcheries.length} found</Badge>
            </div>

            {filteredHatcheries.map((hatchery, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Fish className="h-5 w-5" />
                    {hatchery.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="default" className="w-fit">
                      {hatchery.region}
                    </Badge>
                    <Badge variant="outline" className="w-fit">
                      {hatchery.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{hatchery.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4" />
                    <span className="font-medium">{hatchery.contact}</span>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Species Available:</p>
                    <div className="flex flex-wrap gap-1">
                      {hatchery.species.map((species, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {species}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button size="sm" asChild>
                      <a href={`tel:${hatchery.contact.replace(/\s/g, '')}`}>
                        <Phone className="h-4 w-4 mr-1" />
                        Contact
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Medicines Tab */}
          <TabsContent value="medicines" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">CAA Approved Medicines</h2>
              <Badge variant="outline">{filteredMedicines.length} found</Badge>
            </div>

            {filteredMedicines.map((medicine, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    {medicine.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="default">CAA Approved</Badge>
                    <Badge variant="outline">{medicine.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Manufacturer</p>
                      <p className="text-muted-foreground">{medicine.manufacturer}</p>
                    </div>
                    <div>
                      <p className="font-medium">Price</p>
                      <p className="text-muted-foreground">{medicine.price}</p>
                    </div>
                  </div>

                  <div>
                    <p className="font-medium text-sm">Active Ingredient</p>
                    <p className="text-sm text-muted-foreground">{medicine.activeIngredient}</p>
                  </div>

                  <div>
                    <p className="font-medium text-sm">Dosage</p>
                    <p className="text-sm text-muted-foreground">{medicine.dosage}</p>
                  </div>

                  <div>
                    <p className="font-medium text-sm mb-1">Uses:</p>
                    <div className="flex flex-wrap gap-1">
                      {medicine.uses.map((use, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {use}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full" size="sm" onClick={() => setSelectedMedicine(medicine)}>
                        View Details & Buy
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Pill className="h-5 w-5" />
                          {medicine.name}
                        </DialogTitle>
                        <DialogDescription>
                          Complete product information and purchase options
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Badge variant="default">CAA Approved</Badge>
                          <Badge variant="outline">{medicine.category}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="font-semibold text-sm">Manufacturer</p>
                            <p className="text-sm text-muted-foreground">{medicine.manufacturer}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Price</p>
                            <p className="text-sm text-primary font-bold">{medicine.price}</p>
                          </div>
                        </div>

                        <div>
                          <p className="font-semibold text-sm">Active Ingredient</p>
                          <p className="text-sm text-muted-foreground">{medicine.activeIngredient}</p>
                        </div>

                        <div>
                          <p className="font-semibold text-sm">Recommended Dosage</p>
                          <p className="text-sm text-muted-foreground">{medicine.dosage}</p>
                        </div>

                        <div>
                          <p className="font-semibold text-sm mb-2">Uses & Applications</p>
                          <div className="flex flex-wrap gap-1">
                            {medicine.uses.map((use: string, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {use}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4 flex gap-2">
                          <Button className="flex-1" onClick={() => handleBuyMedicine(medicine)}>
                            Buy Now
                          </Button>
                          <Button variant="outline" className="flex-1">
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Filter & Quick Access */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleNearMe}>
                <MapPin className="h-4 w-4 mr-2" />
                Near Me
              </Button>
            </div>

            {showFilters && (
              <div className="space-y-3 pt-2 border-t">
                <div>
                  <label className="text-sm font-medium mb-2 block">Filter by Region</label>
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Regions</SelectItem>
                      <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
                      <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                      <SelectItem value="Kerala">Kerala</SelectItem>
                      <SelectItem value="Odisha">Odisha</SelectItem>
                      <SelectItem value="Multi-state">Multi-state</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Filter by Type</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Private Hatchery">Private Hatchery</SelectItem>
                      <SelectItem value="Government/Research Institute">Government/Research</SelectItem>
                      <SelectItem value="State Hatchery">State Hatchery</SelectItem>
                      <SelectItem value="SPF Hatchery">SPF Hatchery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    setSelectedRegion("all");
                    setSelectedType("all");
                    toast({
                      title: "Filters cleared",
                      description: "Showing all hatcheries",
                    });
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Aquapedia;
