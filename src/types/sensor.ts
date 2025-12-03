export interface SensorReading {
  timestamp: string;
  timestampIST: string;
  deviceId: string;
  pm1: number;
  pm25: number;
  pm10: number;
  nh3: number;
  no2: number;
  so2: number;
  voc: number;
  temp: number;
  humidity: number;
  battery: number;
  status: "online" | "offline";
  aqi: number;
  category: string;
}

export interface Device {
  deviceId: string;
  name: string;
  location: string;
  lastSeen: string;
  status: "online" | "offline";
  notes?: string;
}

export type AQILevel = "good" | "moderate" | "sensitive" | "unhealthy" | "very-unhealthy" | "hazardous";

export interface AQIInfo {
  value: number;
  level: AQILevel;
  color: string;
  label: string;
}
