import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DeviceSidebarItem } from "@/components/DeviceSidebarItem";
import { useDevices } from "@/hooks/useDevices";
import { useSensorReadings, useLatestReading } from "@/hooks/useSensorReadings";
import { calculateAQI } from "@/lib/aqi";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Wind,
  Droplets,
  Thermometer,
  RefreshCw,
  AlertTriangle,
  CloudRain,
  Flame,
  Zap,
  Menu,
} from "lucide-react";

export default function DeviceDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { devices, refetch: refetchDevices } = useDevices();
  const { readings, refetch: refetchReadings } = useSensorReadings(id || "", 24);
  const { reading: currentReading, refetch: refetchLatest } = useLatestReading(id || "");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const device = devices.find((d) => d.device_id === id);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchDevices?.(),
      refetchReadings?.(),
      refetchLatest?.()
    ]);
    setTimeout(() => setIsRefreshing(false), 500);
  }, [refetchDevices, refetchReadings, refetchLatest]);

  if (!id || (!device && devices.length > 0)) {
    navigate("/");
    return null;
  }

  if (!device || !currentReading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 sm:px-6 py-8">
          {devices.length === 0 ? "No devices found. Add your first device to get started." : "Loading..."}
        </div>
      </Layout>
    );
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Time ago helper
  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return formatTime(timestamp);
  };

  const aqi = calculateAQI(currentReading.pm25 || 0);
  const showAlert = (currentReading.pm25 || 0) > 35 || aqi.value > 100;

  // Check if device has PM sensors (full sensors)
  const hasPMSensors = (currentReading.pm25 || 0) > 0 || (currentReading.pm1 || 0) > 0;

  // Transform readings for charts
  const chartData = readings.map((r) => ({
    timestamp: r.timestamp,
    pm1: Number(r.pm1 || 0),
    pm25: Number(r.pm25 || 0),
    pm10: Number(r.pm10 || 0),
    nh3: Number(r.nh3 ?? 0),
    no2: Number(r.no2 ?? 0),
    so2: Number(r.so2 ?? 0),
    co: Number(r.co ?? 0),
    temp: Number(r.temperature || 0),
    humidity: Number(r.humidity || 0),
    aqi: calculateAQI(Number(r.pm25 || 0)).value,
  }));

  // Calculate 24h summary
  const pm25Values = chartData.map(d => d.pm25).filter(v => !isNaN(v) && v > 0);
  const maxPM25 = pm25Values.length > 0 ? Math.max(...pm25Values) : 0;
  const avgPM25 = pm25Values.length > 0 ? pm25Values.reduce((a, b) => a + b, 0) / pm25Values.length : 0;
  const peakReading = chartData.find(d => d.pm25 === maxPM25);
  const peakTime = peakReading ? formatTime(peakReading.timestamp) : "N/A";

  // Round to 2 decimals for display
  const round2 = (v: number) => Number(v.toFixed(2));

  const SidebarContent = () => (
    <>
      <h3 className="text-sm font-semibold text-sidebar-foreground mb-3 px-3">All Devices</h3>
      <div className="space-y-2">
        {devices.map((d) => (
          <DeviceSidebarItem
            key={d.device_id}
            device={{
              deviceId: d.device_id,
              name: d.name,
              location: d.location,
              status: d.status as "online" | "offline",
              lastSeen: d.last_update,
            }}
            isActive={d.device_id === id}
            onClick={() => {
              navigate(`/device/${d.device_id}`);
              setSidebarOpen(false);
            }}
          />
        ))}
      </div>
    </>
  );

  return (
    <Layout>
      <div className="flex h-[calc(100vh-73px)]">
        {/* Desktop Sidebar - Fixed with own scroll */}
        <aside className="hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border flex-shrink-0 h-full">
          <div className="flex-1 overflow-y-auto p-4">
            <SidebarContent />
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Fixed Top Bar */}
          <div className="flex-shrink-0 bg-background border-b border-border px-4 sm:px-6 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Mobile Device Selector */}
              <div className="lg:hidden">
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="justify-start gap-2 premium-transition premium-btn-active">
                      <Menu className="h-4 w-4" />
                      <span className="truncate">{device.name}</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 bg-sidebar p-4">
                    <SidebarContent />
                  </SheetContent>
                </Sheet>
              </div>
              
              {/* Desktop Title */}
              <div className="hidden lg:block">
                <h2 className="text-xl font-semibold">{device.name}</h2>
                <p className="text-muted-foreground text-sm">{device.location}</p>
              </div>
              
              {/* Refresh Button Only */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="premium-transition premium-btn-active hover:bg-secondary"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Scrollable Main Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 premium-fade-in">
            {/* Alert Banner */}
            {showAlert && hasPMSensors && (
              <div 
                className="mb-4 sm:mb-6 border-l-4 rounded-lg p-3 sm:p-4 premium-transition"
                style={{
                  backgroundColor: `${aqi.color}10`,
                  borderColor: aqi.color,
                }}
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" style={{ color: aqi.color }} />
                  <div>
                    <div className="font-semibold text-sm sm:text-base" style={{ color: aqi.color }}>
                      {aqi.label} Air Quality Alert
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      PM2.5 levels are {aqi.value}. Consider limiting outdoor activities.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AQI Card - Premium Design */}
            {hasPMSensors && (
              <div 
                className="mb-4 sm:mb-6 rounded-xl overflow-hidden aqi-card-transition"
                style={{
                  backgroundColor: aqi.color,
                  boxShadow: `0 4px 20px ${aqi.color}40`,
                }}
              >
                <div className="px-4 sm:px-6 py-5 sm:py-8 text-center aqi-bar-hover">
                  {/* AIR QUALITY INDEX Label */}
                  <div className="text-xs sm:text-sm font-medium tracking-wider uppercase mb-2 sm:mb-3 opacity-90" style={{ color: 'rgba(255,255,255,0.85)' }}>
                    Air Quality Index
                  </div>
                  
                  {/* Large Centered AQI Number */}
                  <div className="text-5xl sm:text-7xl font-bold mb-2 sm:mb-3 aqi-value-transition" style={{ color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                    {aqi.value}
                  </div>
                  
                  {/* Category Label */}
                  <div className="text-lg sm:text-xl font-semibold mb-4 sm:mb-5 aqi-label-transition" style={{ color: 'white' }}>
                    {aqi.label}
                  </div>
                  
                  {/* Status Row */}
                  <div className="flex items-center justify-center gap-2 text-sm status-transition" style={{ color: 'rgba(255,255,255,0.9)' }}>
                    <span 
                      className="inline-flex items-center gap-1.5 status-badge-transition"
                    >
                      <span 
                        className="w-2 h-2 rounded-full status-dot-transition"
                        style={{ 
                          backgroundColor: device.status === "online" ? 'hsl(145, 80%, 60%)' : 'hsl(0, 70%, 60%)',
                          boxShadow: device.status === "online" ? '0 0 8px hsl(145, 80%, 60%)' : '0 0 8px hsl(0, 70%, 60%)'
                        }}
                      />
                      {device.status === "online" ? "Online" : "Offline"}
                    </span>
                    <span className="opacity-60">•</span>
                    <span>Updated {getTimeAgo(currentReading.timestamp)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Current Conditions */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <Card className="premium-card-hover premium-transition">
                <CardContent className="pt-3 sm:pt-6 px-3 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs sm:text-sm text-muted-foreground mb-1">Temperature</div>
                      <div className="text-lg sm:text-2xl font-semibold">{round2(currentReading.temperature ?? 0)}°C</div>
                    </div>
                    <Thermometer className="h-6 w-6 sm:h-8 sm:w-8 text-primary hidden sm:block" />
                  </div>
                </CardContent>
              </Card>
              <Card className="premium-card-hover premium-transition">
                <CardContent className="pt-3 sm:pt-6 px-3 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs sm:text-sm text-muted-foreground mb-1">Humidity</div>
                      <div className="text-lg sm:text-2xl font-semibold">{round2(currentReading.humidity ?? 0)}%</div>
                    </div>
                    <Droplets className="h-6 w-6 sm:h-8 sm:w-8 text-primary hidden sm:block" />
                  </div>
                </CardContent>
              </Card>
              <Card className="premium-card-hover premium-transition">
                <CardContent className="pt-3 sm:pt-6 px-3 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs sm:text-sm text-muted-foreground mb-1">Status</div>
                      <div className="text-lg sm:text-2xl font-semibold capitalize">{device.status}</div>
                    </div>
                    <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-primary hidden sm:block" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Live Sensor Grid */}
            <Card className="mb-4 sm:mb-6 premium-card-hover premium-transition">
              <CardHeader className="pb-2 sm:pb-6">
                <CardTitle className="text-base sm:text-lg font-semibold">Live Sensor Readings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                  {/* PM Sensors - Only show if device has them */}
                  {hasPMSensors && (
                    <>
                      <div className="bg-sensor-card rounded-lg p-3 sm:p-4 border sensor-card-hover">
                        <div className="flex items-center gap-2 mb-1 sm:mb-2">
                          <Wind className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                          <span className="text-xs sm:text-sm font-medium">PM1</span>
                        </div>
                        <div className="text-xl sm:text-2xl font-semibold value-update">{round2(currentReading.pm1 ?? 0)}</div>
                        <div className="text-xs text-muted-foreground">µg/m³</div>
                      </div>
                      <div className="bg-sensor-card rounded-lg p-3 sm:p-4 border sensor-card-hover">
                        <div className="flex items-center gap-2 mb-1 sm:mb-2">
                          <Wind className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                          <span className="text-xs sm:text-sm font-medium">PM2.5</span>
                        </div>
                        <div className="text-xl sm:text-2xl font-semibold value-update">{round2(currentReading.pm25 ?? 0)}</div>
                        <div className="text-xs text-muted-foreground">µg/m³</div>
                      </div>
                      <div className="bg-sensor-card rounded-lg p-3 sm:p-4 border sensor-card-hover">
                        <div className="flex items-center gap-2 mb-1 sm:mb-2">
                          <Wind className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                          <span className="text-xs sm:text-sm font-medium">PM10</span>
                        </div>
                        <div className="text-xl sm:text-2xl font-semibold value-update">{round2(currentReading.pm10 ?? 0)}</div>
                        <div className="text-xs text-muted-foreground">µg/m³</div>
                      </div>
                    </>
                  )}
                  
                  {/* Gas Sensors - Always show */}
                  <div className="bg-sensor-card rounded-lg p-3 sm:p-4 border sensor-card-hover">
                    <div className="flex flex-col gap-0.5 sm:gap-1 mb-1 sm:mb-2">
                      <div className="flex items-center gap-2">
                        <Flame className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                        <span className="text-xs sm:text-sm font-medium">CO</span>
                      </div>
                      <span className="text-xs text-muted-foreground hidden sm:block">Carbon Monoxide</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-semibold value-update">{round2(currentReading.co ?? 0)}</div>
                    <div className="text-xs text-muted-foreground">ppm</div>
                  </div>
                  <div className="bg-sensor-card rounded-lg p-3 sm:p-4 border sensor-card-hover">
                    <div className="flex flex-col gap-0.5 sm:gap-1 mb-1 sm:mb-2">
                      <div className="flex items-center gap-2">
                        <CloudRain className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                        <span className="text-xs sm:text-sm font-medium">NH₃</span>
                      </div>
                      <span className="text-xs text-muted-foreground hidden sm:block">Ammonia</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-semibold value-update">{round2(currentReading.nh3 ?? 0)}</div>
                    <div className="text-xs text-muted-foreground">ppm</div>
                  </div>
                  <div className="bg-sensor-card rounded-lg p-3 sm:p-4 border sensor-card-hover">
                    <div className="flex flex-col gap-0.5 sm:gap-1 mb-1 sm:mb-2">
                      <div className="flex items-center gap-2">
                        <Flame className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                        <span className="text-xs sm:text-sm font-medium">NO₂</span>
                      </div>
                      <span className="text-xs text-muted-foreground hidden sm:block">Nitrogen Dioxide</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-semibold value-update">{round2(currentReading.no2 ?? 0)}</div>
                    <div className="text-xs text-muted-foreground">ppm</div>
                  </div>
                  {/* SO2 - Only show for devices that have it */}
                  {currentReading.so2 !== null && currentReading.so2 !== undefined && (
                    <div className="bg-sensor-card rounded-lg p-3 sm:p-4 border sensor-card-hover">
                      <div className="flex flex-col gap-0.5 sm:gap-1 mb-1 sm:mb-2">
                        <div className="flex items-center gap-2">
                          <Flame className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                          <span className="text-xs sm:text-sm font-medium">SO₂</span>
                        </div>
                        <span className="text-xs text-muted-foreground hidden sm:block">Sulfur Dioxide</span>
                      </div>
                      <div className="text-xl sm:text-2xl font-semibold value-update">{round2(currentReading.so2 ?? 0)}</div>
                      <div className="text-xs text-muted-foreground">ppm</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 24h Summary - Only show for PM sensor devices */}
            {hasPMSensors && (
              <Card className="mb-4 sm:mb-6 premium-card-hover premium-transition">
                <CardHeader className="pb-2 sm:pb-6">
                  <CardTitle className="text-base sm:text-lg font-semibold">24-Hour Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <div className="bg-muted/30 rounded-lg p-2 sm:p-4 border">
                      <div className="text-xs sm:text-sm text-muted-foreground mb-1">Max PM2.5</div>
                      <div className="text-lg sm:text-2xl font-semibold text-primary">{round2(maxPM25)}</div>
                      <div className="text-xs text-muted-foreground hidden sm:block">µg/m³</div>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-2 sm:p-4 border">
                      <div className="text-xs sm:text-sm text-muted-foreground mb-1">Avg PM2.5</div>
                      <div className="text-lg sm:text-2xl font-semibold text-accent">{round2(avgPM25)}</div>
                      <div className="text-xs text-muted-foreground hidden sm:block">µg/m³</div>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-2 sm:p-4 border">
                      <div className="text-xs sm:text-sm text-muted-foreground mb-1">Peak Time</div>
                      <div className="text-lg sm:text-2xl font-semibold">{peakTime}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabbed Charts */}
            <Card className="premium-card-hover premium-transition">
              <CardHeader className="pb-2 sm:pb-6">
                <CardTitle className="text-base sm:text-lg font-semibold">Historical Data</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={hasPMSensors ? "pm" : "gas"} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
                    {hasPMSensors && (
                      <TabsTrigger value="pm" className="text-xs sm:text-sm py-2 premium-transition">PM</TabsTrigger>
                    )}
                    <TabsTrigger value="gas" className="text-xs sm:text-sm py-2 premium-transition">Gas</TabsTrigger>
                    <TabsTrigger value="climate" className="text-xs sm:text-sm py-2 premium-transition">Climate</TabsTrigger>
                    {hasPMSensors && (
                      <TabsTrigger value="combined" className="text-xs sm:text-sm py-2 premium-transition">AQI</TabsTrigger>
                    )}
                  </TabsList>

                  {hasPMSensors && (
                    <TabsContent value="pm" className="mt-4 sm:mt-6">
                      <ResponsiveContainer width="100%" height={250} className="sm:h-[350px]">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                          <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                          <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "0.5rem",
                              fontSize: "12px"
                            }}
                            animationDuration={150}
                            animationEasing="ease-out"
                          />
                          <Legend wrapperStyle={{ fontSize: "12px" }} />
                          <Line type="monotone" dataKey="pm25" stroke="hsl(var(--primary))" strokeWidth={2} name="PM2.5" dot={false} animationDuration={300} animationEasing="ease-out" />
                          <Line type="monotone" dataKey="pm10" stroke="hsl(var(--premium-gold))" strokeWidth={2} name="PM10" dot={false} animationDuration={300} animationEasing="ease-out" />
                        </LineChart>
                      </ResponsiveContainer>
                    </TabsContent>
                  )}

                  <TabsContent value="gas" className="mt-4 sm:mt-6">
                    <ResponsiveContainer width="100%" height={250} className="sm:h-[350px]">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                        <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                        <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "0.5rem",
                            fontSize: "12px"
                          }}
                          animationDuration={150}
                          animationEasing="ease-out"
                        />
                        <Legend wrapperStyle={{ fontSize: "12px" }} />
                        <Line type="monotone" dataKey="co" stroke="hsl(var(--aqi-sensitive))" strokeWidth={2} name="CO" dot={false} animationDuration={300} animationEasing="ease-out" />
                        <Line type="monotone" dataKey="nh3" stroke="hsl(var(--primary))" strokeWidth={2} name="NH₃" dot={false} animationDuration={300} animationEasing="ease-out" />
                        <Line type="monotone" dataKey="no2" stroke="hsl(var(--accent))" strokeWidth={2} name="NO₂" dot={false} animationDuration={300} animationEasing="ease-out" />
                        <Line type="monotone" dataKey="so2" stroke="hsl(var(--premium-gold))" strokeWidth={2} name="SO₂" dot={false} animationDuration={300} animationEasing="ease-out" />
                      </LineChart>
                    </ResponsiveContainer>
                  </TabsContent>

                  <TabsContent value="climate" className="mt-4 sm:mt-6">
                    <ResponsiveContainer width="100%" height={250} className="sm:h-[350px]">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                        <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                        <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "0.5rem",
                            fontSize: "12px"
                          }}
                          animationDuration={150}
                          animationEasing="ease-out"
                        />
                        <Legend wrapperStyle={{ fontSize: "12px" }} />
                        <Area type="monotone" dataKey="temp" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} name="Temp (°C)" animationDuration={300} animationEasing="ease-out" />
                        <Area type="monotone" dataKey="humidity" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.15)" strokeWidth={2} name="Humidity (%)" animationDuration={300} animationEasing="ease-out" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </TabsContent>

                  {hasPMSensors && (
                    <TabsContent value="combined" className="mt-4 sm:mt-6">
                      <ResponsiveContainer width="100%" height={250} className="sm:h-[350px]">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" />
                          <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                          <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "0.5rem",
                              fontSize: "12px"
                            }}
                            animationDuration={150}
                            animationEasing="ease-out"
                          />
                          <Legend wrapperStyle={{ fontSize: "12px" }} />
                          <Line type="monotone" dataKey="aqi" stroke="hsl(var(--primary))" strokeWidth={3} name="AQI" dot={false} animationDuration={300} animationEasing="ease-out" />
                        </LineChart>
                      </ResponsiveContainer>
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
