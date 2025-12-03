// Mock data for UI preview - DELETE THIS FILE when ready for production
// Structure fully matches backend. Safe to delete anytime.

import { Device } from "@/hooks/useDevices";
import { SensorReading } from "@/hooks/useSensorReadings";
import { useState, useEffect } from "react";

// -----------------------------------------------------
// NODE CONFIG
// -----------------------------------------------------

const nodeConfigs = {
  "AQM-001": { hasFullSensors: true, status: "online" },
  "AQM-002": { hasFullSensors: true, status: "online" },
  "AQM-003": { hasFullSensors: false, status: "offline", freezeTime: new Date("2025-12-03T12:23:00") },
  "AQM-004": { hasFullSensors: false, status: "offline", freezeTime: new Date("2025-12-04T09:38:00") }, // NOW OFFLINE
};

// -----------------------------------------------------
// DEVICE LIST
// -----------------------------------------------------

export const mockDevices: Device[] = [
  { id: "1", device_id: "AQM-001", name: "Node-1", location: "Room", status: "online", battery: 85, last_update: new Date().toISOString() },
  { id: "2", device_id: "AQM-002", name: "Node-2", location: "Room", status: "online", battery: 85, last_update: new Date().toISOString() },
  { id: "3", device_id: "AQM-003", name: "Node-3", location: "Room", status: "offline", battery: 85, last_update: new Date("2025-12-03T12:23:00").toISOString() },
  { id: "4", device_id: "AQM-004", name: "Node-4", location: "Room", status: "offline", battery: 85, last_update: new Date("2025-12-04T09:38:00").toISOString() }, // OFFLINE
];

// -----------------------------------------------------
// AC ROOM BASELINE + REALISTIC ±2 DRIFT
// -----------------------------------------------------

const acProfile = {
  temp: 25.0,
  humidity: 50,
  pm25: 9,
  pm10: 15,
  pm1: 6,
  co: 0.40,
  nh3: 0.08,
  no2: 0.014,
  so2: 0.003,
};

// Drift helper (REAL SENSOR BEHAVIOUR)
const drift = (base: number, amp: number) =>
  Number((base + (Math.random() * amp * 2 - amp)).toFixed(3)); // ±amp

// -----------------------------------------------------
// TIME WINDOWS (unchanged)
// -----------------------------------------------------

const pastStart = new Date("2025-12-02T23:34:00").getTime();
const pastEnd = new Date("2025-12-03T12:23:00").getTime();
const earlyStart = new Date("2025-12-04T06:56:00").getTime();
const earlyCount = 5;
const liveStart = new Date("2025-12-04T09:38:00").getTime();

// -----------------------------------------------------
// HISTORICAL READING GENERATOR
// -----------------------------------------------------

export const generateMockReadings = (deviceId: string): SensorReading[] => {
  const readings: SensorReading[] = [];
  const cfg = nodeConfigs[deviceId];

  if (!cfg) return readings;

  // 1) Past hostel (1 min)
  for (let t = pastStart; t <= pastEnd; t += 60_000) {
    readings.push(makeReading(deviceId, t, acProfile, cfg.hasFullSensors, 2));
  }

  // 2) Early morning (10 min × 5)
  let t2 = earlyStart;
  for (let i = 0; i < earlyCount; i++) {
    readings.push(makeReading(deviceId, t2, acProfile, cfg.hasFullSensors, 2));
    t2 += 600_000;
  }

  // 3) Live historical (10 min intervals)
  let t3 = liveStart;
  const now = Date.now();
  while (t3 <= now) {
    readings.push(makeReading(deviceId, t3, acProfile, cfg.hasFullSensors, 2));
    t3 += 600_000;
  }

  return readings;
};

// -----------------------------------------------------
// MAKE ONE READING (REALISTIC ±2 DRIFT)
// -----------------------------------------------------

function makeReading(
  deviceId: string,
  time: number,
  p: any,
  full: boolean,
  amp: number
): SensorReading {
  return {
    id: `r-${deviceId}-${time}`,
    device_id: deviceId,
    timestamp: new Date(time).toISOString(),

    temperature: drift(p.temp, 0.25),
    humidity: Math.round(drift(p.humidity, 2.0)),

    pm1: full ? drift(p.pm1, 1.2) : 0,
    pm25: full ? drift(p.pm25, 2.0) : 0,
    pm10: full ? drift(p.pm10, 2.5) : 0,

    co: drift(p.co, 0.05),
    nh3: drift(p.nh3, 0.01),
    no2: drift(p.no2, 0.003),
    so2: full ? drift(p.so2, 0.002) : null,
  };
}

// -----------------------------------------------------
// LIVE READING FOR ONLINE NODES (EVERY 2 SEC)
// -----------------------------------------------------

function generateLiveReading(deviceId: string): SensorReading | null {
  const cfg = nodeConfigs[deviceId];
  if (!cfg || cfg.status === "offline") return null;

  return makeReading(deviceId, Date.now(), acProfile, cfg.hasFullSensors, 2);
}

// -----------------------------------------------------
// LATEST SNAPSHOT
// -----------------------------------------------------

export const mockLatestReadings: Record<string, SensorReading> = {
  "AQM-001": generateLiveReading("AQM-001")!,
  "AQM-002": generateLiveReading("AQM-002")!,

  // NODE 3 = OFFLINE (frozen)
  "AQM-003": {
    id: "latest-3",
    device_id: "AQM-003",
    timestamp: new Date("2025-12-03T12:23:00").toISOString(),
    pm1: 0,
    pm25: 0,
    pm10: 0,
    temperature: 27.2,
    humidity: 72,
    co: 0.50,
    nh3: 0.08,
    no2: 0.017,
    so2: null,
  },

  // NODE 4 = NOW OFFLINE (freeze)
  "AQM-004": {
    id: "latest-4",
    device_id: "AQM-004",
    timestamp: new Date("2025-12-04T09:38:00").toISOString(),
    pm1: 0,
    pm25: 0,
    pm10: 0,
    temperature: 25.8,
    humidity: 51,
    co: 0.42,
    nh3: 0.07,
    no2: 0.014,
    so2: null,
  },
};

// -----------------------------------------------------
// LIVE HOOK — updates every 2 sec
// -----------------------------------------------------

export function useLiveReadings(deviceId: string): SensorReading | null {
  const [reading, setReading] = useState<SensorReading | null>(null);

  useEffect(() => {
    const cfg = nodeConfigs[deviceId];

    if (!cfg || cfg.status === "offline") {
      setReading(mockLatestReadings[deviceId]);
      return;
    }

    setReading(generateLiveReading(deviceId));

    const interval = setInterval(() => {
      const r = generateLiveReading(deviceId);
      if (r) setReading(r);
    }, 2000);

    return () => clearInterval(interval);
  }, [deviceId]);

  return reading;
}
