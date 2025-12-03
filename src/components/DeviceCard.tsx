import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Device } from "@/types/sensor";
import { calculateAQI } from "@/lib/aqi";
import { MapPin, Thermometer, Droplets, Clock } from "lucide-react";
import { Link } from "react-router-dom";

interface DeviceCardProps {
  device: Device & {
    pm25?: number;
    pm10?: number;
    temp?: number;
    humidity?: number;
  };
}

export function DeviceCard({ device }: DeviceCardProps) {
  const isOnline = device.status === "online";
  
  // Use device data or defaults
  const pm25 = device.pm25 || 0;
  const temp = device.temp || 0;
  const humidity = device.humidity || 0;
  
  // Calculate time since last update
  const getTimeSinceUpdate = () => {
    const now = new Date();
    const lastUpdate = new Date(device.lastSeen);
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    return `${Math.floor(diffHours / 24)} days ago`;
  };

  const aqi = calculateAQI(pm25);

  // Round to 2 decimals
  const round2 = (v: number) => Number(v.toFixed(2));

  return (
    <Link to={`/device/${device.deviceId}`}>
      <Card 
        className={`cursor-pointer border premium-card-hover premium-transition active:scale-[0.98] ${
          isOnline ? "border-[hsl(var(--premium-green))]/20" : "border-[hsl(var(--premium-red))]/20"
        }`}
        style={{ 
          background: 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--muted) / 0.2))',
          boxShadow: isOnline 
            ? '0 0 20px hsl(145 63% 55% / 0.15)' 
            : '0 0 20px hsl(0 70% 60% / 0.15)'
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">{device.name}</CardTitle>
              {/* AQI mini bar */}
              <div className="w-full h-1 bg-muted rounded-full mt-2 mb-1 overflow-hidden">
                <div 
                  className="h-full premium-transition"
                  style={{ 
                    width: `${Math.min((aqi.value / 500) * 100, 100)}%`,
                    backgroundColor: aqi.color 
                  }}
                />
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                <MapPin className="h-3.5 w-3.5" />
                <span>{device.location}</span>
              </div>
            </div>
            <div 
              className={`h-3 w-3 rounded-full ${isOnline ? "animate-pulse" : ""}`}
              style={{
                backgroundColor: isOnline ? "hsl(var(--premium-green))" : "hsl(var(--premium-red))",
                boxShadow: isOnline 
                  ? "0 0 10px hsl(145 63% 55% / 0.5)" 
                  : "0 0 10px hsl(0 70% 60% / 0.5)"
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* AQI Display - Number matches category color */}
            <div className="flex items-center gap-3">
              <div
                className="rounded-lg px-4 py-2 font-semibold text-xl"
                style={{ 
                  backgroundColor: `${aqi.color}15`,
                  color: aqi.color,
                  boxShadow: `0 2px 8px ${aqi.color}20`
                }}
              >
                {aqi.value}
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">AQI</span>
                <span className="text-sm font-medium" style={{ color: aqi.color }}>
                  {aqi.label}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Thermometer className="h-4 w-4 text-primary" />
                <span className="font-medium">{round2(temp)}°C</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Droplets className="h-4 w-4 text-primary" />
                <span className="font-medium">{round2(humidity)}%</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t border-border">
              <Clock className="h-3.5 w-3.5" />
              <span>Last updated {getTimeSinceUpdate()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
