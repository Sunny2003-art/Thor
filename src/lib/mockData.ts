// Mock data for UI preview - DELETE THIS FILE when ready for production
// This mock data maintains the EXACT same structure as the real backend
// Deleting this file will NOT break the website as long as the backend provides data

import { Device } from "@/hooks/useDevices";
import { SensorReading } from "@/hooks/useSensorReadings";
import { useState, useEffect } from "react";

// Node configurations as specified
// Node-1: ONLINE, full sensors (PM1, PM2.5, PM10, Temp, Humidity, CO, NH3, NO2, SO2)
// Node-2: ONLINE initially then OFFLINE, full sensors (freezes after offline)
// Node-3: OFFLINE, limited sensors (Temp, Humidity, CO, NH3, NO2) - frozen
// Node-4: ONLINE, limited sensors (Temp, Humidity, CO, NH3, NO2) - live updates

interface NodeConfig {
  hasFullSensors: boolean;
  status: "online" | "offline";
  freezeTime?: Date;
}

const nodeConfigs: Record<string, NodeConfig> = {
  "AQM-001": { hasFullSensors: true, status: "online" },
  "AQM-002": { hasFullSensors: true, status: "offline", freezeTime: new Date("2025-12-02T18:30:00") },
  "AQM-003": { hasFullSensors: false, status: "offline", freezeTime: new Date("2025-12-02T15:00:00") },
  "AQM-004": { hasFullSensors: false, status: "online" },
};

export const mockDevices: Device[] = [
  {
    id: "1",
    device_id: "AQM-001",
    name: "Node-1 Living Room",
    location: "Mumbai, Maharashtra",
    status: "online",
    battery: 85,
    last_update: new Date().toISOString(),
  },
  {
    id: "2",
    device_id: "AQM-002",
    name: "Node-2 Office",
    location: "Delhi NCR",
    status: "offline",
    battery: 92,
    last_update: new Date("2025-12-02T18:30:00").toISOString(),
  },
  {
    id: "3",
    device_id: "AQM-003",
    name: "Node-3 Bedroom",
    location: "Bangalore, Karnataka",
    status: "offline",
    battery: 45,
    last_update: new Date("2025-12-02T15:00:00").toISOString(),
  },
  {
    id: "4",
    device_id: "AQM-004",
    name: "Node-4 Industrial",
    location: "Pune, Maharashtra",
    status: "online",
    battery: 78,
    last_update: new Date().toISOString(),
  },
];

// Base profiles for realistic sensor values
// Temperature baseline: 26°C, Humidity baseline: 96%
interface SensorProfile {
  temp: number;
  humidity: number;
  pm25: number;
  co: number;
  nh3: number;
  no2: number;
  so2: number;
}

const sensorProfiles: Record<string, SensorProfile> = {
  "AQM-001": { temp: 26, humidity: 96, pm25: 35, co: 0.9, nh3: 0.15, no2: 0.025, so2: 0.012 },
  "AQM-002": { temp: 26.5, humidity: 94, pm25: 85, co: 1.1, nh3: 0.22, no2: 0.035, so2: 0.018 },
  "AQM-003": { temp: 25.8, humidity: 97, pm25: 0, co: 0.8, nh3: 0.12, no2: 0.02, so2: 0 },
  "AQM-004": { temp: 27, humidity: 93, pm25: 0, co: 1.0, nh3: 0.18, no2: 0.03, so2: 0 },
};

// Generate smooth variation (not random jumps)
function smoothVariation(base: number, maxVariation: number, seed: number): number {
  const variation = Math.sin(seed) * maxVariation;
  return base + variation;
}

// Date range: 2-12-2025, 12:47 PM → 11:32 PM
const START_TIME = new Date("2025-12-02T12:47:00").getTime();
const END_TIME = new Date("2025-12-02T23:32:00").getTime();

// Generate historical readings for charts
export const generateMockReadings = (deviceId: string): SensorReading[] => {
  const readings: SensorReading[] = [];
  const config = nodeConfigs[deviceId];
  const profile = sensorProfiles[deviceId] || sensorProfiles["AQM-001"];
  
  if (!config) return readings;

  const intervalMs = 2 * 60 * 1000; // 2 minutes interval for historical data
  const endTime = config.freezeTime ? config.freezeTime.getTime() : END_TIME;
  
  let index = 0;
  for (let time = START_TIME; time <= endTime; time += intervalMs) {
    const timestamp = new Date(time);
    const seed = index * 0.1;
    
    // Temperature: slight inverse relationship with humidity
    const tempVariation = smoothVariation(0, 0.5, seed);
    const temperature = profile.temp + tempVariation;
    
    // Humidity: inverse to temperature variation
    const humidityVariation = smoothVariation(0, 2, seed + 1) - tempVariation * 0.5;
    const humidity = Math.max(85, Math.min(99, profile.humidity + humidityVariation));
    
    // CO: smooth fluctuation (0.8-1.2 ppm baseline)
    const co = smoothVariation(profile.co, 0.15, seed + 2);
    
    // Gas sensors
    const nh3 = smoothVariation(profile.nh3, 0.05, seed + 3);
    const no2 = smoothVariation(profile.no2, 0.008, seed + 4);
    const so2 = config.hasFullSensors ? smoothVariation(profile.so2, 0.004, seed + 5) : null;
    
    // PM sensors (only for full sensor nodes)
    let pm1 = null;
    let pm25 = null;
    let pm10 = null;
    
    if (config.hasFullSensors) {
      const pmVariation = smoothVariation(0, 8, seed + 6);
      pm25 = Math.max(5, profile.pm25 + pmVariation);
      pm1 = pm25 * 0.65 + smoothVariation(0, 2, seed + 7); // PM1 < PM2.5
      pm10 = pm25 * 1.35 + smoothVariation(0, 5, seed + 8); // PM10 > PM2.5
    }

    readings.push({
      id: `reading-${deviceId}-${index}`,
      device_id: deviceId,
      timestamp: timestamp.toISOString(),
      pm1: pm1 !== null ? Number(pm1.toFixed(1)) : 0,
      pm25: pm25 !== null ? Number(pm25.toFixed(1)) : 0,
      pm10: pm10 !== null ? Number(pm10.toFixed(1)) : 0,
      temperature: Number(temperature.toFixed(1)),
      humidity: Number(humidity.toFixed(0)),
      co: Number(co.toFixed(2)),
      nh3: Number(nh3.toFixed(3)),
      no2: Number(no2.toFixed(4)),
      so2: so2 !== null ? Number(so2.toFixed(4)) : null,
    });
    
    index++;
  }

  return readings;
};

// Generate a single live reading with slight variations
function generateLiveReading(deviceId: string, baseSeed: number): SensorReading | null {
  const config = nodeConfigs[deviceId];
  const profile = sensorProfiles[deviceId];
  
  if (!config || !profile || config.status === "offline") return null;

  const seed = baseSeed * 0.05;
  
  const tempVariation = smoothVariation(0, 0.3, seed);
  const temperature = profile.temp + tempVariation;
  
  const humidityVariation = smoothVariation(0, 1.5, seed + 1) - tempVariation * 0.3;
  const humidity = Math.max(85, Math.min(99, profile.humidity + humidityVariation));
  
  const co = smoothVariation(profile.co, 0.1, seed + 2);
  const nh3 = smoothVariation(profile.nh3, 0.03, seed + 3);
  const no2 = smoothVariation(profile.no2, 0.005, seed + 4);
  const so2 = config.hasFullSensors ? smoothVariation(profile.so2, 0.003, seed + 5) : null;
  
  let pm1 = null;
  let pm25 = null;
  let pm10 = null;
  
  if (config.hasFullSensors) {
    const pmVariation = smoothVariation(0, 5, seed + 6);
    pm25 = Math.max(5, profile.pm25 + pmVariation);
    pm1 = pm25 * 0.65 + smoothVariation(0, 1.5, seed + 7);
    pm10 = pm25 * 1.35 + smoothVariation(0, 3, seed + 8);
  }

  return {
    id: `live-${deviceId}-${Date.now()}`,
    device_id: deviceId,
    timestamp: new Date().toISOString(),
    pm1: pm1 !== null ? Number(pm1.toFixed(1)) : 0,
    pm25: pm25 !== null ? Number(pm25.toFixed(1)) : 0,
    pm10: pm10 !== null ? Number(pm10.toFixed(1)) : 0,
    temperature: Number(temperature.toFixed(1)),
    humidity: Number(humidity.toFixed(0)),
    co: Number(co.toFixed(2)),
    nh3: Number(nh3.toFixed(3)),
    no2: Number(no2.toFixed(4)),
    so2: so2 !== null ? Number(so2.toFixed(4)) : null,
  };
}

// Latest readings for each device (static fallback)
export const mockLatestReadings: Record<string, SensorReading> = {
  "AQM-001": {
    id: "latest-1",
    device_id: "AQM-001",
    timestamp: new Date().toISOString(),
    pm1: 22.5,
    pm25: 35,
    pm10: 47,
    temperature: 26.0,
    humidity: 96,
    co: 0.92,
    nh3: 0.15,
    no2: 0.025,
    so2: 0.012,
  },
  "AQM-002": {
    id: "latest-2",
    device_id: "AQM-002",
    timestamp: new Date("2025-12-02T18:30:00").toISOString(),
    pm1: 55,
    pm25: 85,
    pm10: 115,
    temperature: 26.5,
    humidity: 94,
    co: 1.1,
    nh3: 0.22,
    no2: 0.035,
    so2: 0.018,
  },
  "AQM-003": {
    id: "latest-3",
    device_id: "AQM-003",
    timestamp: new Date("2025-12-02T15:00:00").toISOString(),
    pm1: 0,
    pm25: 0,
    pm10: 0,
    temperature: 25.8,
    humidity: 97,
    co: 0.8,
    nh3: 0.12,
    no2: 0.02,
    so2: null,
  },
  "AQM-004": {
    id: "latest-4",
    device_id: "AQM-004",
    timestamp: new Date().toISOString(),
    pm1: 0,
    pm25: 0,
    pm10: 0,
    temperature: 27.0,
    humidity: 93,
    co: 1.0,
    nh3: 0.18,
    no2: 0.03,
    so2: null,
  },
};

// Live readings hook - updates every 2 seconds for online devices
export function useLiveReadings(deviceId: string): SensorReading | null {
  const [reading, setReading] = useState<SensorReading | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const config = nodeConfigs[deviceId];
    
    // Only provide live updates for online devices
    if (!config || config.status === "offline") {
      setReading(mockLatestReadings[deviceId] || null);
      return;
    }

    // Initial reading
    setReading(generateLiveReading(deviceId, tick));

    // Update every 2 seconds
    const interval = setInterval(() => {
      setTick(t => {
        const newTick = t + 1;
        const newReading = generateLiveReading(deviceId, newTick);
        if (newReading) setReading(newReading);
        return newTick;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [deviceId]);

  return reading;
}

