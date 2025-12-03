import { AQIInfo, AQILevel } from "@/types/sensor";

export function calculateAQI(pm25: number): AQIInfo {
  let value = Math.round(pm25 * 2.5); // Simplified AQI calculation
  let level: AQILevel;
  let color: string;
  let label: string;

  if (value <= 50) {
    level = "good";
    color = "hsl(var(--aqi-good))";
    label = "Good";
  } else if (value <= 100) {
    level = "moderate";
    color = "hsl(var(--aqi-moderate))";
    label = "Moderate";
  } else if (value <= 150) {
    level = "sensitive";
    color = "hsl(var(--aqi-sensitive))";
    label = "Unhealthy for Sensitive";
  } else if (value <= 200) {
    level = "unhealthy";
    color = "hsl(var(--aqi-unhealthy))";
    label = "Unhealthy";
  } else if (value <= 300) {
    level = "very-unhealthy";
    color = "hsl(var(--aqi-very-unhealthy))";
    label = "Very Unhealthy";
  } else {
    level = "hazardous";
    color = "hsl(var(--aqi-hazardous))";
    label = "Hazardous";
  }

  return { value, level, color, label };
}

export function getAQIColor(level: AQILevel): string {
  const colors = {
    good: "hsl(var(--aqi-good))",
    moderate: "hsl(var(--aqi-moderate))",
    sensitive: "hsl(var(--aqi-sensitive))",
    unhealthy: "hsl(var(--aqi-unhealthy))",
    "very-unhealthy": "hsl(var(--aqi-very-unhealthy))",
    hazardous: "hsl(var(--aqi-hazardous))",
  };
  return colors[level];
}
