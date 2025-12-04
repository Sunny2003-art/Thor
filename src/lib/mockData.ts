// Mock data for UI preview - DELETE THIS FILE anytime (safe)
// Structure matches backend → website will NOT break

import { Device } from "@/hooks/useDevices";
import { SensorReading } from "@/hooks/useSensorReadings";
import { useState, useEffect } from "react";

// -----------------------------------------------------
// NODE STATE (ONLY VALUES CHANGED — NO STRUCTURE CHANGES)
// -----------------------------------------------------

const nodeConfigs = {
  "AQM-001": { hasFullSensors: true, status: "online", liveStart: new Date("2025-12-04T10:05:00") }, // Node-1 AC room
  "AQM-002": { hasFullSensors: true, status: "offline", freezeTime: new Date("2025-12-03T12:23:00") }, // frozen
  "AQM-003": { hasFullSensors: false, status: "offline", freezeTime: new Date("2025-12-03T12:23:00") }, // frozen
  "AQM-004": { hasFullSensors: false, status: "online", liveStart: new Date("2025-12-04T07:00:00") }, // Node-4 hostel room
};

// -----------------------------------------------------
// DEVICE LIST (UNCHANGED STRUCTURE — ONLY STATUS UPDATED)
// -----------------------------------------------------

export const mockDevices: Device[] = [
  { id: "1", device_id: "AQM-001", name: "Node-1", location: "Room", status: "online", battery: 90, last_update: new Date().toISOString() },
  { id: "2", device_id: "AQM-002", name: "Node-2", location: "Room", status: "offline", battery: 86, last_update: new Date("2025-12-03T12:23:00").toISOString() },
  { id: "3", device_id: "AQM-003", name: "Node-3", location: "Room", status: "offline", battery: 82, last_update: new Date("2025-12-03T12:23:00").toISOString() },
  { id: "4", device_id: "AQM-004", name: "Node-4", location: "Room", status: "online", battery: 79, last_update: new Date().toISOString() },
];

// -----------------------------------------------------
// BASELINES (REALISTIC — ONLY VALUES CHANGED)
// -----------------------------------------------------

const baseProfile = {
  // Node-1 (AC room — cool, low PM, stable)
  "AQM-001": {
    pm25: 8,
    temp: 25.2,
    humidity: 49,
    co: 0.35,
    nh3: 0.05,
    no2: 0.010,
    so2: 0.0025,
  },

  // Node-2 (frozen)
  "AQM-002": {
    pm25: 14,
    temp: 26.5,
    humidity: 70,
    co: 0.50,
    nh3: 0.10,
    no2: 0.018,
    so2: 0.005,
  },

  // Node-3 (frozen)
  "AQM-003": {
    pm25: 0,
    temp: 26.8,
    humidity: 74,
    co: 0.52,
    nh3: 0.12,
    no2: 0.020,
    so2: 0,
  },

  // Node-4 (Hostel room — moderate)
  "AQM-004": {
    pm25: 15,
    temp: 27.6,
    humidity: 73,
    co: 0.45,
    nh3: 0.09,
    no2: 0.015,
    so2: 0,
  },
};

// -----------------------------------------------------
// UTILS
// -----------------------------------------------------

const rand = (min: number, max: number) =>
  Number((min + Math.random() * (max - min)).toFixed(3));

function clampStep(prev: number, next: number, cap: number) {
  if (Math.abs(next - prev) > cap) {
    return prev + Math.sign(next - prev) * cap;
  }
  return next;
}

function ema(prev: number, target: number, alpha: number) {
  return prev * (1 - alpha) + target * alpha;
}

const ALPHA = 0.18;       // smoothing
const INTERVAL_MS = 5000; // 5-second ESP32 update

// caps = max allowed change per 5 sec (VERY SMALL & REALISTIC)
const caps = {
  pm1: 0.3,
  pm25: 0.5,
  pm10: 0.8,
  temperature: 0.10,
  humidity: 0.9,
  co: 0.03,
  nh3: 0.008,
  no2: 0.001,
  so2: 0.0008,
};

// -----------------------------------------------------
// HISTORICAL READINGS (ONLY VALUES CHANGED)
// -----------------------------------------------------

const hostelProfile = {
  temp: [26.8, 28.2],
  hum: [65, 78],
  pm25: [12, 22],
  pm10: [18, 36],
  pm1: [8, 14],
  co: [0.35, 0.80],
  nh3: [0.05, 0.17],
  no2: [0.010, 0.028],
  so2: [0.001, 0.009],
};

export const generateMockReadings = (deviceId: string): SensorReading[] => {
  const cfg = nodeConfigs[deviceId];
  const readings: SensorReading[] = [];
  if (!cfg) return readings;

  const start = new Date("2025-12-02T23:34:00").getTime();
  const end = cfg.freezeTime
    ? cfg.freezeTime.getTime()
    : new Date("2025-12-03T12:23:00").getTime();

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
// LIVE READINGS (REALISTIC 5-SEC ESP32-LIKE SMALL DRIFT)
// -----------------------------------------------------

function generateLiveReading(deviceId: string, prev: SensorReading | null): SensorReading | null {
  const cfg = nodeConfigs[deviceId];
  if (!cfg || cfg.status === "offline") return null;

  const now = Date.now();
  if (cfg.liveStart && now < cfg.liveStart.getTime()) return prev;

  const base = baseProfile[deviceId];
  const full = cfg.hasFullSensors;

  const target = {
    temperature: rand(base.temp - 0.20, base.temp + 0.20),
    humidity: rand(base.humidity - 2.0, base.humidity + 2.0),

    pm25: full ? rand(base.pm25 - 1.0, base.pm25 + 1.0) : 0,
    pm1: 0,
    pm10: 0,

    co: rand(base.co - 0.02, base.co + 0.02),
    nh3: rand(base.nh3 - 0.006, base.nh3 + 0.006),
    no2: rand(base.no2 - 0.001, base.no2 + 0.001),
    so2: null,
  };

  if (full) {
    target.pm1 = target.pm25 * 0.63;
    target.pm10 = target.pm25 * 1.38;
    target.so2 = rand(base.so2 - 0.0004, base.so2 + 0.0004);
  }

  const prevVal = prev || target;

  const smoothVal = (field: keyof SensorReading) =>
    clampStep(
      prevVal[field] as number,
      ema(prevVal[field] as number, target[field] as number, ALPHA),
      caps[field]
    );

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
// INITIAL SNAPSHOT
// -----------------------------------------------------

export const mockLatestReadings: Record<string, SensorReading> = {
  "AQM-001": generateLiveReading("AQM-001", null)!,
  "AQM-004": generateLiveReading("AQM-004", null)!,

  "AQM-002": {
    id: "latest-2",
    device_id: "AQM-002",
    timestamp: new Date("2025-12-03T12:23:00").toISOString(),
    pm1: 0,
    pm25: 0,
    pm10: 0,
    temperature: 26.5,
    humidity: 70,
    co: 0.50,
    nh3: 0.10,
    no2: 0.018,
    so2: null,
  },

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

