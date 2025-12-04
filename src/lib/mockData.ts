// Mock data for UI preview - DELETE THIS FILE anytime (safe)
// Structure matches backend → website will NOT break

import { Device } from "@/hooks/useDevices";
import { SensorReading } from "@/hooks/useSensorReadings";
import { useState, useEffect } from "react";

// -----------------------------------------------------
// NODE CONFIG
// -----------------------------------------------------

const nodeConfigs = {
  "AQM-001": { hasFullSensors: true, status: "online", liveStart: new Date("2025-12-04T09:40:00") }, // Node-1 AC room
  "AQM-002": { hasFullSensors: true, status: "offline", freezeTime: new Date("2025-12-03T00:12:00") }, // frozen
  "AQM-003": { hasFullSensors: false, status: "offline", freezeTime: new Date("2025-12-03T00:12:00") }, // frozen
  "AQM-004": { hasFullSensors: false, status: "online", liveStart: new Date("2025-12-04T09:40:00") }, // Node-4 hostel
};

// -----------------------------------------------------
// DEVICES LIST (UNCHANGED STRUCTURE)
// -----------------------------------------------------

export const mockDevices: Device[] = [
  { id: "1", device_id: "AQM-001", name: "Node-1", location: "Room", status: "online", battery: 92, last_update: new Date().toISOString() },
  { id: "2", device_id: "AQM-002", name: "Node-2", location: "Room", status: "offline", battery: 86, last_update: new Date("2025-12-03T00:12:00").toISOString() },
  { id: "3", device_id: "AQM-003", name: "Node-3", location: "Room", status: "offline", battery: 80, last_update: new Date("2025-12-03T00:12:00").toISOString() },
  { id: "4", device_id: "AQM-004", name: "Node-4", location: "Room", status: "online", battery: 78, last_update: new Date().toISOString() },
];

// -----------------------------------------------------
// BASE PROFILES (REALISTIC VALUES)
// -----------------------------------------------------

// Node-1 → AC room with 15 people (clean, low-moderate, stable)
const acRoom = {
  pm25: 12,
  temp: 25.6,
  humidity: 52,
  co: 0.28,
  nh3: 0.04,
  no2: 0.010,
  so2: 0.0015,
};

// Hostel room → moderate, realistic for Node 2/3/4
const hostel = {
  pm25: 26,
  temp: 27.8,
  humidity: 72,
  co: 0.52,
  nh3: 0.11,
  no2: 0.020,
  so2: 0.0007,
};

const baseProfile = {
  "AQM-001": acRoom,
  "AQM-002": hostel,
  "AQM-003": hostel,
  "AQM-004": hostel,
};

// -----------------------------------------------------
// UTILS FOR REALISTIC MICRO-DRIFT (NO JUMPS)
// -----------------------------------------------------

const rand = (min: number, max: number) =>
  Number((min + Math.random() * (max - min)).toFixed(4));

function clampStep(prev: number, next: number, cap: number) {
  const diff = next - prev;
  if (Math.abs(diff) > cap) return prev + Math.sign(diff) * cap;
  return next;
}

function ema(prev: number, target: number, alpha: number) {
  return prev * (1 - alpha) + target * alpha;
}

const ALPHA = 0.18;
const INTERVAL_MS = 5000; // 5 sec ESP32 interval

// Max allowed drift per reading (VERY small)
const caps = {
  pm1: 0.12,
  pm25: 0.20,
  pm10: 0.26,
  temperature: 0.06,
  humidity: 0.8,
  co: 0.01,
  nh3: 0.006,
  no2: 0.0006,
  so2: 0.0005,
};

// -----------------------------------------------------
// HISTORICAL READINGS (REALISTIC HOSTEL DATA)
// -----------------------------------------------------

const hostelProfile = {
  temp: [26.5, 29.0],
  hum: [60, 85],
  pm25: [15, 35],
  pm10: [25, 55],
  pm1: [10, 20],
  co: [0.35, 0.75],
  nh3: [0.05, 0.20],
  no2: [0.010, 0.030],
  so2: [0.0003, 0.0015],
};

export const generateMockReadings = (deviceId: string): SensorReading[] => {
  const cfg = nodeConfigs[deviceId];
  const readings: SensorReading[] = [];
  if (!cfg) return readings;

  const start = new Date("2025-12-02T11:38:00").getTime();
  const end = cfg.freezeTime ? cfg.freezeTime.getTime() : new Date("2025-12-04T09:39:55").getTime();

  for (let t = start; t <= end; t += 60_000) {
    const full = cfg.hasFullSensors;

    readings.push({
      id: `r-${deviceId}-${t}`,
      device_id: deviceId,
      timestamp: new Date(t).toISOString(),

      temperature: rand(hostelProfile.temp[0], hostelProfile.temp[1]),
      humidity: rand(hostelProfile.hum[0], hostelProfile.hum[1]),

      pm1: full ? rand(hostelProfile.pm1[0], hostelProfile.pm1[1]) : 0,
      pm25: full ? rand(hostelProfile.pm25[0], hostelProfile.pm25[1]) : 0,
      pm10: full ? rand(hostelProfile.pm10[0], hostelProfile.pm10[1]) : 0,

      co: rand(hostelProfile.co[0], hostelProfile.co[1]),
      nh3: rand(hostelProfile.nh3[0], hostelProfile.nh3[1]),
      no2: rand(hostelProfile.no2[0], hostelProfile.no2[1]),
      so2: full ? rand(hostelProfile.so2[0], hostelProfile.so2[1]) : null,
    });
  }

  return readings;
};

// -----------------------------------------------------
// LIVE READINGS (REALISTIC MICRO-FLUCTUATION)
// -----------------------------------------------------

function generateLiveReading(deviceId: string, prev: SensorReading | null): SensorReading | null {
  const cfg = nodeConfigs[deviceId];
  if (!cfg || cfg.status === "offline") return null;

  const now = Date.now();
  if (cfg.liveStart && now < cfg.liveStart.getTime()) return prev;

  const base = baseProfile[deviceId];
  const full = cfg.hasFullSensors;

  const target = {
    temperature: rand(base.temp - 0.15, base.temp + 0.15),
    humidity: rand(base.humidity - 2, base.humidity + 2),

    pm25: full ? rand(base.pm25 - 1, base.pm25 + 1) : 0,
    pm1: 0,
    pm10: 0,

    co: rand(base.co - 0.015, base.co + 0.015),
    nh3: rand(base.nh3 - 0.004, base.nh3 + 0.004),
    no2: rand(base.no2 - 0.0005, base.no2 + 0.0005),
    so2: full ? rand(base.so2 - 0.0003, base.so2 + 0.0003) : null,
  };

  if (full) {
    target.pm1 = target.pm25 * 0.62;
    target.pm10 = target.pm25 * 1.32;
  }

  const prevVal = prev || target;

  const smooth = (field: keyof SensorReading) =>
    clampStep(
      prevVal[field] as number,
      ema(prevVal[field] as number, target[field] as number, ALPHA),
      caps[field]
    );

  return {
    id: `live-${deviceId}-${Date.now()}`,
    device_id: deviceId,
    timestamp: new Date().toISOString(),

    pm1: Number(smooth("pm1").toFixed(2)),
    pm25: Number(smooth("pm25").toFixed(2)),
    pm10: Number(smooth("pm10").toFixed(2)),

    temperature: Number(smooth("temperature").toFixed(2)),
    humidity: Number(smooth("humidity").toFixed(0)),

    co: Number(smooth("co").toFixed(3)),
    nh3: Number(smooth("nh3").toFixed(3)),
    no2: Number(smooth("no2").toFixed(4)),
    so2: full ? Number(smooth("so2").toFixed(4)) : null,
  };
}

// -----------------------------------------------------
// INITIAL SNAPSHOT
// -----------------------------------------------------

export const mockLatestReadings: Record<string, SensorReading> = {
  "AQM-001": generateLiveReading("AQM-001", null)!,
  "AQM-004": generateLiveReading("AQM-004", null)!,

  "AQM-002": {
    id: "latest-2",
    device_id: "AQM-002",
    timestamp: new Date("2025-12-03T00:12:00").toISOString(),
    pm1: 16,
    pm25: 28,
    pm10: 41,
    temperature: 27.8,
    humidity: 74,
    co: 0.52,
    nh3: 0.11,
    no2: 0.020,
    so2: 0.0007,
  },

  "AQM-003": {
    id: "latest-3",
    device_id: "AQM-003",
    timestamp: new Date("2025-12-03T00:12:00").toISOString(),
    pm1: 0,
    pm25: 0,
    pm10: 0,
    temperature: 27.9,
    humidity: 75,
    co: 0.53,
    nh3: 0.12,
    no2: 0.021,
    so2: null,
  },
};

// -----------------------------------------------------
// LIVE HOOK
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
