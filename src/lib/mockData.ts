// Mock data for UI preview - DELETE THIS FILE when ready for production
// Structure fully matches backend. Safe to delete anytime.

import { Device } from "@/hooks/useDevices";
import { SensorReading } from "@/hooks/useSensorReadings";
import { useState, useEffect } from "react";

interface NodeConfig {
  hasFullSensors: boolean;
  status: "online" | "offline";
  freezeTime?: Date;
}

const nodeConfigs: Record<string, NodeConfig> = {
  "AQM-001": { hasFullSensors: true, status: "online" },
  "AQM-002": { hasFullSensors: true, status: "online" },
  "AQM-003": { hasFullSensors: false, status: "offline", freezeTime: new Date("2025-12-03T12:23:00") },
  "AQM-004": { hasFullSensors: false, status: "online" },
};

// Device list
export const mockDevices: Device[] = [
  { id: "1", device_id: "AQM-001", name: "Node 1", location: "Room", status: "online", battery: 85, last_update: new Date().toISOString() },
  { id: "2", device_id: "AQM-002", name: "Node 2", location: "Room", status: "online", battery: 85, last_update: new Date().toISOString() },
  { id: "3", device_id: "AQM-003", name: "Node 3", location: "Room", status: "offline", battery: 85, last_update: new Date("2025-12-03T12:23:00").toISOString() },
  { id: "4", device_id: "AQM-004", name: "Node 4", location: "Room", status: "online", battery: 85, last_update: new Date().toISOString() },
];

// -------------------------------------------------------
// SENSOR PROFILES
// Hostel = past data
// AC Room = live data
// -------------------------------------------------------

const hostelProfile = {
  tempMin: 26.5, tempMax: 28.2,
  humMin: 65, humMax: 78,
  pm25Min: 12, pm25Max: 22,
  pm10Min: 18, pm10Max: 35,
  pm1Min: 8, pm1Max: 15,
  coMin: 0.35, coMax: 0.80,
  nh3Min: 0.05, nh3Max: 0.18,
  no2Min: 0.010, no2Max: 0.028,
  so2Min: 0.001, so2Max: 0.009,
};

const acProfile = {
  tempMin: 24.3, tempMax: 25.8,
  humMin: 45, humMax: 55,
  pm25Min: 5, pm25Max: 12,
  pm10Min: 8, pm10Max: 20,
  pm1Min: 3, pm1Max: 8,
  coMin: 0.25, coMax: 0.55,
  nh3Min: 0.03, nh3Max: 0.12,
  no2Min: 0.008, no2Max: 0.020,
  so2Min: 0.001, so2Max: 0.006,
};

// Random between range
const r = (min: number, max: number) => Number((min + Math.random() * (max - min)).toFixed(3));

// -------------------------------------------------------
// TIME WINDOWS
// -------------------------------------------------------

// 1) Past Hostel (2 Dec 11:34 PM → 3 Dec 12:23 PM)
// Every 1 minute
const pastStart = new Date("2025-12-02T23:34:00").getTime();
const pastEnd = new Date("2025-12-03T12:23:00").getTime();

// 2) Early Morning (4 Dec 6:56AM → next 5 readings)
// Every 10 minutes
const earlyStart = new Date("2025-12-04T06:56:00").getTime();
const earlyCount = 5;

// 3) Live AC Room (4 Dec 9:38AM onward)
// Every 10 minutes (infinite)
const liveStart = new Date("2025-12-04T09:38:00").getTime();

// -------------------------------------------------------
// HISTORICAL READING GENERATOR
// -------------------------------------------------------

export const generateMockReadings = (deviceId: string): SensorReading[] => {
  const readings: SensorReading[] = [];
  const cfg = nodeConfigs[deviceId];

  if (!cfg) return readings;

  let idx = 0;

  // ------- PAST HISTORICAL (HOSTEL, 1 min) --------
  for (let t = pastStart; t <= pastEnd; t += 60_000) {
    readings.push(makeReading(deviceId, t, hostelProfile, cfg.hasFullSensors));
    idx++;
  }

  // ------- EARLY MORNING (HOSTEL, 10 min × 5) ------
  let t2 = earlyStart;
  for (let i = 0; i < earlyCount; i++) {
    readings.push(makeReading(deviceId, t2, hostelProfile, cfg.hasFullSensors));
    t2 += 600_000;
    idx++;
  }

  // ------- LIVE AC ROOM (10 min interval continuous) ------
  let t3 = liveStart;
  const now = Date.now();
  while (t3 <= now) {
    readings.push(makeReading(deviceId, t3, acProfile, cfg.hasFullSensors));
    t3 += 600_000;
    idx++;
  }

  return readings;
};

// Make one reading
function makeReading(deviceId: string, time: number, p: any, full: boolean): SensorReading {
  return {
    id: `r-${deviceId}-${time}`,
    device_id: deviceId,
    timestamp: new Date(time).toISOString(),

    temperature: r(p.tempMin, p.tempMax),
    humidity: Math.round(r(p.humMin, p.humMax)),

    pm1: full ? r(p.pm1Min, p.pm1Max) : 0,
    pm25: full ? r(p.pm25Min, p.pm25Max) : 0,
    pm10: full ? r(p.pm10Min, p.pm10Max) : 0,

    co: r(p.coMin, p.coMax),
    nh3: r(p.nh3Min, p.nh3Max),
    no2: r(p.no2Min, p.no2Max),
    so2: full ? r(p.so2Min, p.so2Max) : null,
  };
}

// -------------------------------------------------------
// LIVE (updated every 10 min in your dashboard)
// -------------------------------------------------------

function generateLiveReading(deviceId: string): SensorReading | null {
  const cfg = nodeConfigs[deviceId];
  if (!cfg || cfg.status === "offline") return null;

  const full = cfg.hasFullSensors;

  return makeReading(deviceId, Date.now(), acProfile, full);
}

// -------------------------------------------------------
// LATEST READINGS SNAPSHOT
// -------------------------------------------------------

export const mockLatestReadings: Record<string, SensorReading> = {
  "AQM-001": generateLiveReading("AQM-001")!,
  "AQM-002": generateLiveReading("AQM-002")!,
  "AQM-003": {
    id: "latest-3",
    device_id: "AQM-003",
    timestamp: new Date("2025-12-03T12:23:00").toISOString(),
    pm1: 0,
    pm25: 0,
    pm10: 0,
    temperature: 27.2,
    humidity: 72,
    co: 0.5,
    nh3: 0.08,
    no2: 0.017,
    so2: null,
  },
  "AQM-004": generateLiveReading("AQM-004")!,
};

// -------------------------------------------------------
// LIVE HOOK
// -------------------------------------------------------

export function useLiveReadings(deviceId: string): SensorReading | null {
  const [reading, setReading] = useState<SensorReading | null>(null);

  useEffect(() => {
    const cfg = nodeConfigs[deviceId];

    if (!cfg || cfg.status === "offline") {
      setReading(mockLatestReadings[deviceId]);
      return;
    }

    // initial
    setReading(generateLiveReading(deviceId));

    // every 10 minutes
    const interval = setInterval(() => {
      const r = generateLiveReading(deviceId);
      if (r) setReading(r);
    }, 600_000);

    return () => clearInterval(interval);
  }, [deviceId]);

  return reading;
}


