import { calculateAQI } from "@/lib/aqi";

interface AQIBadgeProps {
  pm25: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function AQIBadge({ pm25, size = "md", showLabel = true }: AQIBadgeProps) {
  const aqi = calculateAQI(pm25);

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-2xl px-5 py-3 font-bold",
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`rounded-lg ${sizeClasses[size]} font-semibold text-white shadow-md transition-all`}
        style={{ 
          backgroundColor: aqi.color,
          boxShadow: `0 4px 12px ${aqi.color}40, 0 0 20px ${aqi.color}20`
        }}
      >
        {aqi.value}
      </div>
      {showLabel && (
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">AQI</span>
          <span className="text-sm font-medium" style={{ color: aqi.color }}>
            {aqi.label}
          </span>
        </div>
      )}
    </div>
  );
}
