import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Download, FileSpreadsheet, FileText, Loader2, CalendarIcon, Filter } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";

const AdminExport = () => {
  const { toast } = useToast();
  const [exportType, setExportType] = useState<string>("requests");
  const [exportFormat, setExportFormat] = useState<string>("csv");
  const [isExporting, setIsExporting] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [useDateFilter, setUseDateFilter] = useState(false);

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: Record<string, unknown>[]): string => {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      )
    ];
    return csvRows.join('\n');
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let data: Record<string, unknown>[] = [];
      let filename = '';

      if (exportType === 'requests') {
        let query = supabase
          .from('sell_crop_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (useDateFilter) {
          query = query
            .gte('created_at', startOfDay(dateRange.from).toISOString())
            .lte('created_at', endOfDay(dateRange.to).toISOString());
        }

        const { data: requests, error } = await query;

        if (error) throw error;
        data = (requests || []).map(r => ({
          ID: r.id,
          'Crop Type': r.crop_type,
          Count: r.count,
          'Quantity (Tons)': r.quantity_tons,
          'Pickup Date': r.pickup_date,
          State: r.state,
          District: r.district,
          Address: r.address,
          'Phone Number': r.phone_number || '',
          'Preferred Contact Time': r.preferred_contact_time || '',
          'Expected Price/kg': r.expected_price_per_kg || '',
          'Total Value Estimate': r.total_value_estimate || '',
          Status: r.status,
          'Admin Notes': r.admin_notes || '',
          'Created At': format(new Date(r.created_at), 'yyyy-MM-dd HH:mm:ss'),
          'Updated At': format(new Date(r.updated_at), 'yyyy-MM-dd HH:mm:ss'),
        }));
        filename = `sell_crop_requests_${format(new Date(), 'yyyyMMdd_HHmmss')}`;
      } else if (exportType === 'users') {
        let query = supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (useDateFilter) {
          query = query
            .gte('created_at', startOfDay(dateRange.from).toISOString())
            .lte('created_at', endOfDay(dateRange.to).toISOString());
        }

        const { data: profiles, error } = await query;

        if (error) throw error;
        data = (profiles || []).map(p => ({
          ID: p.id,
          'Full Name': p.full_name || '',
          Email: p.email || '',
          'Created At': format(new Date(p.created_at), 'yyyy-MM-dd HH:mm:ss'),
          'Updated At': format(new Date(p.updated_at), 'yyyy-MM-dd HH:mm:ss'),
        }));
        filename = `users_${format(new Date(), 'yyyyMMdd_HHmmss')}`;
      }

      if (data.length === 0) {
        toast({
          title: "No Data",
          description: "No data available to export for the selected criteria.",
          variant: "destructive",
        });
        return;
      }

      if (exportFormat === 'csv') {
        const csv = convertToCSV(data);
        downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
      } else if (exportFormat === 'json') {
        const json = JSON.stringify(data, null, 2);
        downloadFile(json, `${filename}.json`, 'application/json');
      }

      toast({
        title: "Export Successful",
        description: `Exported ${data.length} records as ${exportFormat.toUpperCase()}.`,
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "An error occurred during export.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleQuickRange = (days: number) => {
    setDateRange({
      from: subDays(new Date(), days),
      to: new Date(),
    });
    setUseDateFilter(true);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Export Data
          </CardTitle>
          <CardDescription>
            Download your data in CSV or JSON format for reporting and analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Data Type</Label>
            <Select value={exportType} onValueChange={setExportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="requests">Sell Crop Requests</SelectItem>
                <SelectItem value="users">Users</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Format</Label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Excel Compatible)</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useDateFilter"
                checked={useDateFilter}
                onChange={(e) => setUseDateFilter(e.target.checked)}
                className="rounded border-border"
              />
              <Label htmlFor="useDateFilter" className="cursor-pointer">Filter by date range</Label>
            </div>
            
            {useDateFilter && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <div className="flex flex-wrap items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 min-w-[120px]">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(dateRange.from, "MMM dd, yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => date && setDateRange(prev => ({ ...prev, from: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <span className="text-muted-foreground text-sm">to</span>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 min-w-[120px]">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(dateRange.to, "MMM dd, yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => date && setDateRange(prev => ({ ...prev, to: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleQuickRange(7)} className="text-xs">7 days</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleQuickRange(30)} className="text-xs">30 days</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleQuickRange(90)} className="text-xs">90 days</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleQuickRange(365)} className="text-xs">1 year</Button>
                </div>
              </div>
            )}
          </div>

          <Button onClick={handleExport} disabled={isExporting} className="w-full">
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export {exportType === 'requests' ? 'Requests' : 'Users'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">Sell Crop Requests Export</p>
            <p>Includes all request details: crop type, quantity, location, status, pricing, and timestamps.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Users Export</p>
            <p>Includes user profile information: name, email, and registration date.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Date Range Filter</p>
            <p>Enable the date filter to export only records within a specific time period. Useful for monthly or quarterly reports.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">CSV Format</p>
            <p>Best for opening in Excel, Google Sheets, or other spreadsheet applications.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">JSON Format</p>
            <p>Best for data import/export with other applications or backup purposes.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminExport;
