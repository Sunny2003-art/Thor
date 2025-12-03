// Mock data for UI preview - DELETE THIS FILE when ready for production
// Also set USE_MOCK_DATA = false in hooks/useDevices.ts and hooks/useSensorReadings.ts

import { Device } from "@/hooks/useDevices";
import { SensorReading } from "@/hooks/useSensorReadings";

export const mockDevices: Device[] = [
  {
    id: "1",
    device_id: "AQM-001",
    name: "Living Room Monitor",
    location: "Mumbai, Maharashtra",
    status: "online",
    battery: 85,
    last_update: new Date(Date.now() - 2 * 60000).toISOString(), // 2 minutes ago
  },
  {
    id: "2",
    device_id: "AQM-002",
    name: "Office Air Quality",
    location: "Delhi NCR",
    status: "online",
    battery: 92,
    last_update: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
  },
  {
    id: "3",
    device_id: "AQM-003",
    name: "Bedroom Sensor",
    location: "Bangalore, Karnataka",
    status: "offline",
    battery: 45,
    last_update: new Date(Date.now() - 45 * 60000).toISOString(), // 45 minutes ago
  },
  {
    id: "4",
    device_id: "AQM-004",
    name: "Industrial Zone",
    location: "Pune, Maharashtra",
    status: "online",
    battery: 78,
    last_update: new Date(Date.now() - 1 * 60000).toISOString(), // 1 minute ago
  },
];

// Generate historical readings for charts (last 24 hours, every 30 minutes)
export const generateMockReadings = (deviceId: string): SensorReading[] => {
  const readings: SensorReading[] = [];
  const now = Date.now();
  const hoursToGenerate = 24;
  const intervalMinutes = 30;
  
  // Base values per device for variation
  const deviceProfiles: Record<string, { pm25: number; temp: number; humidity: number }> = {
    "AQM-001": { pm25: 35, temp: 24, humidity: 55 },
    "AQM-002": { pm25: 85, temp: 28, humidity: 45 },
    "AQM-003": { pm25: 15, temp: 22, humidity: 60 },
    "AQM-004": { pm25: 150, temp: 32, humidity: 40 },
  };

  const profile = deviceProfiles[deviceId] || { pm25: 50, temp: 25, humidity: 50 };

  // INITIALIZE STATE WITH BASELINE VALUES
  // We track these variables loop-over-loop to create the "72, 71, 70" effect
  let currentPm25 = profile.pm25;
  let currentTemp = profile.temp;
  let currentHumidity = profile.humidity;

  for (let i = 0; i < (hoursToGenerate * 60) / intervalMinutes; i++) {
    const timestamp = new Date(now - i * intervalMinutes * 60000);
    
    // CALCULATE DRIFT
    // Instead of random large numbers, we add a tiny +/- amount to the previous value
    const pmDrift = (Math.random() - 0.5) * 5;      // Changes by max +/- 2.5
    const tempDrift = (Math.random() - 0.5) * 0.4;  // Changes by max +/- 0.2 degrees
    const humidityDrift = (Math.random() - 0.5) * 2;// Changes by max +/- 1%

    // APPLY DRIFT + MEAN REVERSION
    // (The 0.05 factor gently pulls values back to baseline so they don't wander forever)
    currentPm25 = currentPm25 + pmDrift + (profile.pm25 - currentPm25) * 0.05;
    currentTemp = currentTemp + tempDrift + (profile.temp - currentTemp) * 0.05;
    currentHumidity = currentHumidity + humidityDrift + (profile.humidity - currentHumidity) * 0.05;

    readings.push({
      id: `reading-${deviceId}-${i}`,
      device_id: deviceId,
      timestamp: timestamp.toISOString(),
      // PM1 and PM10 scale relative to PM2.5 so the lines move together
      pm1: Math.max(0, Math.floor(currentPm25 * 0.6)),
      pm25: Math.max(0, Math.floor(currentPm25)),
      pm10: Math.max(0, Math.floor(currentPm25 * 1.3)),
      temperature: Number(currentTemp.toFixed(1)),
      humidity: Math.max(0, Math.min(100, Math.round(currentHumidity))),
      // Chemical sensors usually have less frequent spikes, but we'll keep them stable-ish
      nh3: Math.random() > 0.5 ? Math.max(0, (Math.random() * 5) + 10) : null,
      no2: Math.random() > 0.5 ? Math.max(0, (Math.random() * 5) + 20) : null,
      so2: Math.random() > 0.5 ? Math.max(0, (Math.random() * 3) + 5) : null,
      voc: Math.random() > 0.5 ? Math.max(0, (Math.random() * 20) + 100) : null,
    });
  }

  return readings.reverse(); // Oldest first
};

// Latest readings for each device
export const mockLatestReadings: Record<string, SensorReading> = {
  "AQM-001": {
    id: "latest-1",
    device_id: "AQM-001",
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    pm1: 18,
    pm25: 35,
    pm10: 45,
    temperature: 24.2,
    humidity: 55,
    nh3: 12,
    no2: 25,
    so2: 8,
    voc: 120,
  },
  "AQM-002": {
    id: "latest-2",
    device_id: "AQM-002",
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    pm1: 52,
    pm25: 85,
    pm10: 108,
    temperature: 28.1,
    humidity: 45,
    nh3: 35,
    no2: 48,
    so2: 22,
    voc: 280,
  },
  "AQM-003": {
    id: "latest-3",
    device_id: "AQM-003",
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    pm1: 9,
    pm25: 15,
    pm10: 21,
    temperature: 22.1,
    humidity: 60,
    nh3: 5,
    no2: 12,
    so2: 3,
    voc: 65,
  },
  "AQM-004": {
    id: "latest-4",
    device_id: "AQM-004",
    timestamp: new Date(Date.now() - 1 * 60000).toISOString(),
    pm1: 94,
    pm25: 151,
    pm10: 196,
    temperature: 32.1,
    humidity: 40,
    nh3: 68,
    no2: 92,
    so2: 45,
    voc: 450,
  },
};
