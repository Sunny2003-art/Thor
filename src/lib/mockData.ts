// Mock data for UI preview - DELETE THIS FILE anytime (safe)
// Structure matches backend 100% → cannot break website

import { Device } from "@/hooks/useDevices";
import { SensorReading } from "@/hooks/useSensorReadings";
import { useState, useEffect } from "react";

// -----------------------------------------------------
// NODE CONFIG
// -----------------------------------------------------

const nodeConfigs = {
  "AQM-001": { hasFullSensors: true, status: "online" },  // Node-1 online
  "AQM-002": { hasFullSensors: true, status: "online" },  // Node-2 online
  "AQM-003": { hasFullSensors: false, status: "offline", freezeTime: new Date("2025-12-03T12:23:00") },
  "AQM-004": { hasFullSensors: false, status: "offline", freezeTime: new Date("2025-12-03T12:23:00") },
};

// -----------------------------------------------------
// DEVICE LIST (unchanged)
// -----------------------------------------------------

export const mockDevices: Device[] = [
  { id: "1", device_id: "AQM-001", name: "Node-1", location: "Kerala, Calicut", status: "online", battery: 85, last_update: new Date().toISOString() },
  { id: "2", device_id: "AQM-002", name: "Node-2", location: "Kerala, Calicut", status: "online", battery: 86, last_update: new Date().toISOString() },
  { id: "3", device_id: "AQM-003", name: "Node-3", location: "Kerala, Calicut", status: "offline", battery: 82, last_update: new Date("2025-12-03T12:23:00").toISOString() },
  { id: "4", device_id: "AQM-004", name: "Node-4", location: "Kerala, Calicut", status: "offline", battery: 79, last_update: new Date("2025-12-03T12:23:00").toISOString() },
];

// -----------------------------------------------------
// BASELINES per node — each node slightly unique
// -----------------------------------------------------

const baseProfile = {
  "AQM-001": { pm25: 14, temp: 25.1, humidity: 51, co: 0.42, nh3: 0.08, no2: 0.014, so2: 0.004 },
  "AQM-002": { pm25: 16, temp: 25.4, humidity: 53, co: 0.45, nh3: 0.09, no2: 0.015, so2: 0.0045 },

  "AQM-003": { pm25: 0, temp: 26.8, humidity: 74, co: 0.52, nh3: 0.12, no2: 0.020, so2: 0 },
  "AQM-004": { pm25: 0, temp: 26.4, humidity: 76, co: 0.48, nh3: 0.11, no2: 0.019, so2: 0 },
};

// -----------------------------------------------------
// RANDOM UTILS
// -----------------------------------------------------

function clampStep(prev: number, next: number, cap: number) {
  if (Math.abs(next - prev) > cap) {
    return prev + Math.sign(next - prev) * cap;
  }
  return next;
}

function ema(prev: number, target: number, alpha: number) {
  return prev * (1 - alpha) + target * alpha;
}

// -----------------------------------------------------
// HISTORICAL READINGS (hostel → AC room)
// -----------------------------------------------------

const hostelProfile = {
  temp: [26.8, 28.1],
  hum: [65, 78],
  pm25: [12, 22],
  pm10: [18, 35],
  pm1: [8, 15],
  co: [0.35, 0.80],
  nh3: [0.05, 0.18],
  no2: [0.010, 0.028],
  so2: [0.001, 0.009],
};

const acProfile = {
  temp: [24.8, 25.8],
  hum: [46, 54],
  pm25: [6, 12],
  pm10: [10, 24],
  pm1: [4, 9],
  co: [0.24, 0.55],
  nh3: [0.03, 0.12],
  no2: [0.008, 0.020],
  so2: [0.001, 0.006],
};

const rand = (min: number, max: number) =>
  Number((min + Math.random() * (max - min)).toFixed(3));

export const generateMockReadings = (deviceId: string): SensorReading[] => {
  const readings: SensorReading[] = [];
  const cfg = nodeConfigs[deviceId];

  if (!cfg) return readings;

  const start = new Date("2025-12-02T23:34:00").getTime();
  const end = cfg.freezeTime
    ? cfg.freezeTime.getTime()
    : new Date("2025-12-03T12:23:00").getTime();

  for (let t = start; t <= end; t += 60_000) {
    readings.push(makeReading(deviceId, t, hostelProfile, cfg.hasFullSensors));
  }

  return readings;
};

function makeReading(deviceId: string, t: number, p: any, full: boolean): SensorReading {
  return {
    id: `r-${deviceId}-${t}`,
    device_id: deviceId,
    timestamp: new Date(t).toISOString(),

    temperature: rand(p.temp[0], p.temp[1]),
    humidity: Math.round(rand(p.hum[0], p.hum[1])),

    pm1: full ? rand(p.pm1[0], p.pm1[1]) : 0,
    pm25: full ? rand(p.pm25[0], p.pm25[1]) : 0,
    pm10: full ? rand(p.pm10[0], p.pm10[1]) : 0,

    co: rand(p.co[0], p.co[1]),
    nh3: rand(p.nh3[0], p.nh3[1]),
    no2: rand(p.no2[0], p.no2[1]),
    so2: full ? rand(p.so2[0], p.so2[1]) : null,
  };
}

// -----------------------------------------------------
// REAL-TIME LIVE ENGINE (EVERY 5 SEC, ultra-smooth)
// -----------------------------------------------------

const ALPHA = 0.18;     // smoothing
const INTERVAL_MS = 5000;

const caps = {
  pm1: 0.4,
  pm25: 0.6,
  pm10: 0.8,
  temperature: 0.12,
  humidity: 0.6,
  co: 0.03,
  nh3: 0.01,
  no2: 0.001,
  so2: 0.0008,
};

function generateLiveReading(deviceId: string, prev: SensorReading | null): SensorReading | null {
  const cfg = nodeConfigs[deviceId];
  if (!cfg || cfg.status === "offline") return null;

  const base = baseProfile[deviceId];

  const target = {
    temperature: rand(base.temp - 0.2, base.temp + 0.2),
    humidity: rand(base.humidity - 2, base.humidity + 2),
    pm25: rand(base.pm25 - 1.2, base.pm25 + 1.2),
    pm1: 0,
    pm10: 0,
    co: rand(base.co - 0.05, base.co + 0.05),
    nh3: rand(base.nh3 - 0.01, base.nh3 + 0.01),
    no2: rand(base.no2 - 0.002, base.no2 + 0.002),
    so2: null,
  };

  if (cfg.hasFullSensors) {
    target.pm1 = target.pm25 * 0.63;
    target.pm10 = target.pm25 * 1.38;
    target.so2 = rand(base.so2 - 0.001, base.so2 + 0.001);
  }

  const prevVal = prev || target;

  const smoothVal = (field: keyof SensorReading) =>
    clampStep(prevVal[field] as number, ema(prevVal[field] as number, target[field] as number, ALPHA), caps[field]);

  return {
    id: `live-${deviceId}-${Date.now()}`,
    device_id: deviceId,
    timestamp: new Date().toISOString(),

    pm1: Number(smoothVal("pm1").toFixed(2)),
    pm25: Number(smoothVal("pm25").toFixed(2)),
    pm10: Number(smoothVal("pm10").toFixed(2)),

    temperature: Number(smoothVal("temperature").toFixed(2)),
    humidity: Number(smoothVal("humidity").toFixed(0)),

    co: Number(smoothVal("co").toFixed(3)),
    nh3: Number(smoothVal("nh3").toFixed(3)),
    no2: Number(smoothVal("no2").toFixed(4)),
    so2: cfg.hasFullSensors ? Number(smoothVal("so2").toFixed(4)) : null,
  };
}

// -----------------------------------------------------
// INITIAL LATEST READINGS
// -----------------------------------------------------

export const mockLatestReadings: Record<string, SensorReading> = {
  "AQM-001": generateLiveReading("AQM-001", null)!,
  "AQM-002": generateLiveReading("AQM-002", null)!,
  "AQM-003": {
    id: "latest-3",
    device_id: "AQM-003",
    timestamp: new Date("2025-12-03T12:23:00").toISOString(),
    pm1: 0,
    pm25: 0,
    pm10: 0,
    temperature: 26.8,
    humidity: 74,
    co: 0.52,
    nh3: 0.12,
    no2: 0.020,
    so2: null,
  },
  "AQM-004": {
    id: "latest-4",
    device_id: "AQM-004",
    timestamp: new Date("2025-12-03T12:23:00").toISOString(),
    pm1: 0,
    pm25: 0,
    pm10: 0,
    temperature: 26.4,
    humidity: 76,
    co: 0.48,
    nh3: 0.11,
    no2: 0.019,
    so2: null,
  },
};

// -----------------------------------------------------
// LIVE HOOK (EVERY 5 SEC)
// -----------------------------------------------------

export function useLiveReadings(deviceId: string): SensorReading | null {
  const [reading, setReading] = useState<SensorReading | null>(mockLatestReadings[deviceId]);
  const cfg = nodeConfigs[deviceId];

  useEffect(() => {
    if (!cfg || cfg.status === "offline") return;

    const interval = setInterval(() => {
      setReading(prev => generateLiveReading(deviceId, prev));
    }, INTERVAL_MS);

    return () => clearInterval(interval);
  }, [deviceId]);

  return reading;
}
