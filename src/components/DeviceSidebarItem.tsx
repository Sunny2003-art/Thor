import { Device } from "@/types/sensor";
import { useLatestReading } from "@/hooks/useSensorReadings";
import { calculateAQI } from "@/lib/aqi";
import { cn } from "@/lib/utils";

interface DeviceSidebarItemProps {
  device: Device;
  isActive: boolean;
  onClick: () => void;
}

export function DeviceSidebarItem({ device, isActive, onClick }: DeviceSidebarItemProps) {
  const { reading } = useLatestReading(device.deviceId);
  const aqi = reading ? calculateAQI(reading.pm25) : { value: 0, color: "hsl(var(--muted-foreground))", label: "Unknown" };
  const isOnline = device.status === "online";
  const pm25Value = reading?.pm25 ?? 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-3 rounded-lg text-left transition-all duration-150 ease-out active:scale-[0.98]",
        isActive
          ? "bg-sidebar-accent border-l-2 border-primary"
          : "hover:bg-sidebar-accent/50 border-l-2 border-transparent hover:border-primary/30"
      )}
      style={{
        boxShadow: isActive ? "0 0 12px rgba(0, 0, 0, 0.2)" : undefined,
        background: isActive ? "linear-gradient(90deg, hsl(var(--primary) / 0.1), transparent)" : undefined
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="h-3 w-3 rounded-full flex-shrink-0 transition-all duration-180"
          style={{ backgroundColor: aqi.color }}
        />
        <div className="flex-1 min-w-0">
          <div className={cn(
            "font-medium text-sm truncate transition-colors duration-150",
            isActive ? "text-foreground" : "text-foreground/85"
          )}>
            {device.name}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span className="truncate">{device.location}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div
            className="h-2 w-2 rounded-full transition-all duration-180"
            style={{
              backgroundColor: isOnline ? "hsl(var(--premium-green))" : "hsl(var(--muted-foreground))",
              boxShadow: isOnline ? "0 0 6px hsl(var(--premium-green) / 0.5)" : undefined
            }}
          />
          <span className="text-xs font-medium transition-opacity duration-150">{pm25Value.toFixed(0)}</span>
        </div>
      </div>
    </button>
  );
}
