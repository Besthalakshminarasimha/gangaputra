import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Shield, LogOut, Package, Users, Database, BarChart3, Download, Bug, BookOpen, FileText, ShoppingBag, Bell, ShoppingCart, Image, PieChart, Fish, Pill, Stethoscope, CalendarCheck, Briefcase, ClipboardList } from "lucide-react";
import AdminRequestsTable from "@/components/admin/AdminRequestsTable";
import AdminUsersTable from "@/components/admin/AdminUsersTable";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import AdminExport from "@/components/admin/AdminExport";
import AdminDiseases from "@/components/admin/AdminDiseases";
import AdminMagazines from "@/components/admin/AdminMagazines";
import AdminCropManuals from "@/components/admin/AdminCropManuals";
import AdminProducts from "@/components/admin/AdminProducts";
import AdminDailyUpdates from "@/components/admin/AdminDailyUpdates";
import AdminOrders from "@/components/admin/AdminOrders";
import AdminCarouselUpdates from "@/components/admin/AdminCarouselUpdates";
import AdminCarouselAnalytics from "@/components/admin/AdminCarouselAnalytics";
import AdminHatcheries from "@/components/admin/AdminHatcheries";
import AdminMedicines from "@/components/admin/AdminMedicines";
import AdminDoctors from "@/components/admin/AdminDoctors";
import AdminAppointments from "@/components/admin/AdminAppointments";
import AdminJobProfiles from "@/components/admin/AdminJobProfiles";
import AdminJobPostings from "@/components/admin/AdminJobPostings";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate("/admin");
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        navigate("/admin");
        return;
      }

      setIsAdmin(true);
      fetchStats();
      setIsLoading(false);
    };

    checkAdminAccess();
  }, [navigate, toast]);

  const fetchStats = async () => {
    // Fetch request stats
    const { data: requests } = await supabase
      .from('sell_crop_requests')
      .select('id, status');
    
    // Fetch user count
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id');

    setStats({
      totalRequests: requests?.length || 0,
      pendingRequests: requests?.filter(r => r.status === 'pending').length || 0,
      totalUsers: profiles?.length || 0,
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Verifying admin access...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">GANGAPUTRA Admin</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRequests}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.pendingRequests}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="requests" className="space-y-4">
          <TabsList className="flex flex-wrap gap-1">
            <TabsTrigger value="requests"><Package className="h-4 w-4 mr-1" />Requests</TabsTrigger>
            <TabsTrigger value="orders"><ShoppingCart className="h-4 w-4 mr-1" />Orders</TabsTrigger>
            <TabsTrigger value="users"><Users className="h-4 w-4 mr-1" />Users</TabsTrigger>
            <TabsTrigger value="hatcheries"><Fish className="h-4 w-4 mr-1" />Hatcheries</TabsTrigger>
            <TabsTrigger value="medicines"><Pill className="h-4 w-4 mr-1" />Medicines</TabsTrigger>
            <TabsTrigger value="doctors"><Stethoscope className="h-4 w-4 mr-1" />Doctors</TabsTrigger>
            <TabsTrigger value="appointments"><CalendarCheck className="h-4 w-4 mr-1" />Appointments</TabsTrigger>
            <TabsTrigger value="job-profiles"><Briefcase className="h-4 w-4 mr-1" />Jobs</TabsTrigger>
            <TabsTrigger value="job-postings"><ClipboardList className="h-4 w-4 mr-1" />Job Posts</TabsTrigger>
            <TabsTrigger value="diseases"><Bug className="h-4 w-4 mr-1" />Diseases</TabsTrigger>
            <TabsTrigger value="magazines"><BookOpen className="h-4 w-4 mr-1" />Magazines</TabsTrigger>
            <TabsTrigger value="manuals"><FileText className="h-4 w-4 mr-1" />Manuals</TabsTrigger>
            <TabsTrigger value="products"><ShoppingBag className="h-4 w-4 mr-1" />Products</TabsTrigger>
            <TabsTrigger value="carousel"><Image className="h-4 w-4 mr-1" />Carousel</TabsTrigger>
            <TabsTrigger value="carousel-analytics"><PieChart className="h-4 w-4 mr-1" />Carousel Stats</TabsTrigger>
            <TabsTrigger value="updates"><Bell className="h-4 w-4 mr-1" />Updates</TabsTrigger>
            <TabsTrigger value="analytics"><BarChart3 className="h-4 w-4 mr-1" />Analytics</TabsTrigger>
            <TabsTrigger value="export"><Download className="h-4 w-4 mr-1" />Export</TabsTrigger>
          </TabsList>
          
          <TabsContent value="requests"><AdminRequestsTable onUpdate={fetchStats} /></TabsContent>
          <TabsContent value="orders"><AdminOrders /></TabsContent>
          <TabsContent value="users"><AdminUsersTable /></TabsContent>
          <TabsContent value="hatcheries"><AdminHatcheries /></TabsContent>
          <TabsContent value="medicines"><AdminMedicines /></TabsContent>
          <TabsContent value="doctors"><AdminDoctors /></TabsContent>
          <TabsContent value="appointments"><AdminAppointments /></TabsContent>
          <TabsContent value="job-profiles"><AdminJobProfiles /></TabsContent>
          <TabsContent value="diseases"><AdminDiseases /></TabsContent>
          <TabsContent value="magazines"><AdminMagazines /></TabsContent>
          <TabsContent value="manuals"><AdminCropManuals /></TabsContent>
          <TabsContent value="products"><AdminProducts /></TabsContent>
          <TabsContent value="carousel"><AdminCarouselUpdates /></TabsContent>
          <TabsContent value="carousel-analytics"><AdminCarouselAnalytics /></TabsContent>
          <TabsContent value="updates"><AdminDailyUpdates /></TabsContent>
          <TabsContent value="analytics"><AdminAnalytics /></TabsContent>
          <TabsContent value="export"><AdminExport /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
