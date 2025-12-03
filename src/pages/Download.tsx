import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download as DownloadIcon, Calendar, CheckSquare, CalendarRange } from "lucide-react";
import { toast } from "sonner";
import { useDevices } from "@/hooks/useDevices";
import { useSensorReadings, useSensorReadingsByDateRange } from "@/hooks/useSensorReadings";
import { calculateAQI } from "@/lib/aqi";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Download() {
  const { devices } = useDevices();
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "timestamp",
    "pm25",
    "pm10",
    "temperature",
    "humidity",
  ]);
  const [dateRangeMode, setDateRangeMode] = useState<"24h" | "custom">("24h");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // Fetch 24 hours of sensor readings for the selected device
  const { readings: readings24h } = useSensorReadings(selectedDevice, 24);
  const { readings: readingsCustom } = useSensorReadingsByDateRange(
    selectedDevice,
    startDate || null,
    endDate || null
  );

  const readings = dateRangeMode === "24h" ? readings24h : readingsCustom;

  const allColumns = [
    { id: "timestamp", label: "Timestamp (UTC)" },
    { id: "timestampIST", label: "Timestamp (IST)" },
    { id: "pm1", label: "PM1.0 (µg/m³)" },
    { id: "pm25", label: "PM2.5 (µg/m³)" },
    { id: "pm10", label: "PM10 (µg/m³)" },
    { id: "nh3", label: "NH₃ (ppb)" },
    { id: "no2", label: "NO₂ (ppb)" },
    { id: "so2", label: "SO₂ (ppb)" },
    { id: "co", label: "CO (ppm)" },
    { id: "temperature", label: "Temperature (°C)" },
    { id: "humidity", label: "Humidity (%)" },
    { id: "aqi", label: "AQI" },
    { id: "category", label: "Category" },
  ];

  const toggleColumn = (columnId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  };

  // Transform readings for CSV export
  const exportData = useMemo(() => {
    return readings.map((reading) => {
      const aqi = calculateAQI(reading.pm25);
      const timestamp = new Date(reading.timestamp || "");
      const timestampIST = timestamp.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      
      return {
        timestamp: reading.timestamp,
        timestampIST,
        pm1: reading.pm1,
        pm25: reading.pm25,
        pm10: reading.pm10,
        nh3: reading.nh3 ?? "",
        no2: reading.no2 ?? "",
        so2: reading.so2 ?? "",
        co: reading.co ?? "",
        temperature: reading.temperature ?? "",
        humidity: reading.humidity ?? "",
        aqi: aqi.value,
        category: aqi.label,
      };
    });
  }, [readings]);

  const handleDownload = () => {
    if (!selectedDevice) {
      toast.error("Please select a device");
      return;
    }

    if (dateRangeMode === "custom") {
      if (!startDate || !endDate) {
        toast.error("Please select both start and end dates");
        return;
      }
      if (startDate > endDate) {
        toast.error("Start date must be before end date");
        return;
      }
    }

    if (selectedColumns.length === 0) {
      toast.error("Please select at least one column");
      return;
    }

    if (exportData.length === 0) {
      toast.error("No data available for this device");
      return;
    }
    
    // Create CSV content
    const headers = selectedColumns.join(",");
    const rows = exportData.map((row) =>
      selectedColumns.map((col) => {
        const value = row[col as keyof typeof row];
        return value !== null && value !== undefined ? value : "";
      }).join(",")
    );
    const csv = [headers, ...rows].join("\n");

    // Download CSV
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const deviceName = devices.find(d => d.device_id === selectedDevice)?.name || selectedDevice;
    a.download = `${deviceName.replace(/\s+/g, '_')}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success(`CSV file downloaded: ${exportData.length} rows`);
  };

  const previewData = exportData.slice(0, 5);

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Download Sensor Data</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Export historical data in CSV format for analysis
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="hover:shadow-glow transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Device Selection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="device-select">Select Device</Label>
                <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                  <SelectTrigger id="device-select" className="mt-2">
                    <SelectValue placeholder="Choose a device..." />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map((device) => (
                      <SelectItem key={device.device_id} value={device.device_id}>
                        {device.name} - {device.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="hover:shadow-glow transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarRange className="h-5 w-5" />
                  Date Range
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={dateRangeMode} onValueChange={(v) => setDateRangeMode(v as "24h" | "custom")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="24h">Last 24 Hours</TabsTrigger>
                    <TabsTrigger value="custom">Custom Range</TabsTrigger>
                  </TabsList>
                </Tabs>

                {dateRangeMode === "custom" && (
                  <div className="space-y-3">
                    <div>
                      <Label>Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal mt-1",
                              !startDate && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label>End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal mt-1",
                              !endDate && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-glow transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  Select Columns
                </CardTitle>
                <CardDescription>Choose which data to include</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {allColumns.map((column) => (
                    <div key={column.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={column.id}
                        checked={selectedColumns.includes(column.id)}
                        onCheckedChange={() => toggleColumn(column.id)}
                      />
                      <Label
                        htmlFor={column.id}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {column.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleDownload}
              className="w-full shadow-glow hover:shadow-lg transition-all"
              size="lg"
              disabled={!selectedDevice || selectedColumns.length === 0}
            >
              <DownloadIcon className="h-5 w-5 mr-2" />
              Download CSV
            </Button>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-2">
            <Card className="hover:shadow-glow transition-all">
              <CardHeader>
                <CardTitle>Data Preview</CardTitle>
                <CardDescription>
                  {selectedDevice
                    ? `Showing first 5 rows from ${devices.find((d) => d.device_id === selectedDevice)?.name} (${exportData.length} total rows)`
                    : "Select a device to preview data"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {previewData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          {selectedColumns.map((col) => (
                            <th key={col} className="px-4 py-2 text-left font-medium">
                              {allColumns.find((c) => c.id === col)?.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, idx) => (
                          <tr key={idx} className="border-b hover:bg-muted/30">
                            {selectedColumns.map((col) => (
                              <td key={col} className="px-4 py-2">
                                {(() => {
                                  const value = row[col as keyof typeof row];
                                  if (value === null || value === undefined || value === "") return "—";
                                  if (typeof value === "number") return value.toFixed(2);
                                  if (col === "timestamp") return new Date(value).toLocaleString();
                                  return String(value);
                                })()}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <DownloadIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No device selected</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6 hover:shadow-glow transition-all">
              <CardHeader>
                <CardTitle>Export Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Format:</span>
                  <span className="font-medium">CSV (Comma Separated Values)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timestamp:</span>
                  <span className="font-medium">UTC (Coordinated Universal Time)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date Range:</span>
                  <span className="font-medium">
                    {dateRangeMode === "24h"
                      ? "Last 24 hours"
                      : startDate && endDate
                      ? `${format(startDate, "PP")} - ${format(endDate, "PP")}`
                      : "Custom range not set"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Selected Columns:</span>
                  <span className="font-medium">{selectedColumns.length} columns</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
