// Mock data for UI preview - DELETE THIS FILE anytime (safe)
// Structure matches backend 100% → cannot break website

import { Device } from "@/hooks/useDevices";
import { SensorReading } from "@/hooks/useSensorReadings";
import { useState, useEffect } from "react";

// -----------------------------------------------------
// NODE ONLINE/OFFLINE OVERRIDE
// -----------------------------------------------------
const mockOnlineState: Record<string, boolean> = {
  "AQM-001": true,   // Node-1: ONLINE
  "AQM-002": false,  // Node-2: OFFLINE (frozen)
  "AQM-003": false,  // Node-3: OFFLINE (frozen)
  "AQM-004": true,   // Node-4: ONLINE
};

// -----------------------------------------------------
// NODE CONFIG
// -----------------------------------------------------
const nodeConfigs = {
  "AQM-001": { hasFullSensors: true, status: "online" },
  "AQM-002": { hasFullSensors: true, status: "offline", freezeTime: new Date("2025-12-03T12:23:00") },
  "AQM-003": { hasFullSensors: false, status: "offline", freezeTime: new Date("2025-12-03T12:23:00") },
  "AQM-004": { hasFullSensors: false, status: "online" },
};

// -----------------------------------------------------
// DEVICE LIST
// -----------------------------------------------------
export const mockDevices: Device[] = [
  { id: "1", device_id: "AQM-001", name: "Node-1", location: "Kerala, Calicut", status: "online", battery: 85, last_update: new Date().toISOString() },
  { id: "2", device_id: "AQM-002", name: "Node-2", location: "Kerala, Calicut", status: "offline", battery: 82, last_update: new Date("2025-12-03T12:23:00").toISOString() },
  { id: "3", device_id: "AQM-003", name: "Node-3", location: "Kerala, Calicut", status: "offline", battery: 80, last_update: new Date("2025-12-03T12:23:00").toISOString() },
  { id: "4", device_id: "AQM-004", name: "Node-4", location: "Kerala, Calicut", status: "online", battery: 79, last_update: new Date().toISOString() },
];

// -----------------------------------------------------
// BASE PROFILES (REALISTIC)
// -----------------------------------------------------

// Node-1 = AC ROOM (very stable, low PM)
const acRoom = {
  pm25: 10, temp: 25.1, humidity: 50,
  co: 0.40, nh3: 0.07, no2: 0.013, so2: 0.004,
};

// Node-4 = HOSTEL ROOM (moderate PM, more humidity)
const hostelRoom = {
  pm25: 20, temp: 27.2, humidity: 72,
  co: 0.48, nh3: 0.11, no2: 0.019, so2: 0.006,
};

// Node-2 (offline frozen) hostel data baseline
const hostelFrozen = {
  pm25: 18, temp: 27.0, humidity: 74,
  co: 0.50, nh3: 0.12, no2: 0.020, so2: 0.007,
};

const baseProfile = {
  "AQM-001": acRoom,
  "AQM-002": hostelFrozen,
  "AQM-003": hostelFrozen,
  "AQM-004": hostelRoom,
};

// -----------------------------------------------------
// UTILS (clamp + smoothing) ★ REQUIRED ★
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

const rand = (min: number, max: number) =>
  Number((min + Math.random() * (max - min)).toFixed(3));

// -----------------------------------------------------
// HISTORICAL (only 1-minute hostel data for Node-2 & Node-3)
// -----------------------------------------------------
export const generateMockReadings = (deviceId: string): SensorReading[] => {
  const readings: SensorReading[] = [];
  const cfg = nodeConfigs[deviceId];
  if (!cfg) return readings;

  const profile = baseProfile[deviceId];
  const full = cfg.hasFullSensors;

  const START = new Date("2025-12-02T23:34:00").getTime();
  const END = cfg.freezeTime ? cfg.freezeTime.getTime() : START + 600000;

  for (let t = START; t <= END; t += 60000) {
    readings.push({
      id: `r-${deviceId}-${t}`,
      device_id: deviceId,
      timestamp: new Date(t).toISOString(),

      temperature: rand(profile.temp - 0.6, profile.temp + 0.6),
      humidity: Math.round(rand(profile.humidity - 4, profile.humidity + 4)),

      pm1: full ? rand(profile.pm25 * 0.6, profile.pm25 * 0.7) : 0,
      pm25: full ? rand(profile.pm25 - 2, profile.pm25 + 2) : 0,
      pm10: full ? rand(profile.pm25 * 1.3, profile.pm25 * 1.5) : 0,

      co: rand(profile.co - 0.05, profile.co + 0.05),
      nh3: rand(profile.nh3 - 0.01, profile.nh3 + 0.01),
      no2: rand(profile.no2 - 0.003, profile.no2 + 0.003),
      so2: full ? rand(profile.so2 - 0.001, profile.so2 + 0.001) : null,
    });
  }

  return readings;
};

// -----------------------------------------------------
// LIVE ENGINE (EVERY 5 SEC, REALISTIC MQ SENSORS)
// -----------------------------------------------------

const INTERVAL_MS = 5000;
const ALPHA = 0.18;

const caps = {
  pm1: 0.4,
  pm25: 0.6,
  pm10: 0.8,
  temperature: 0.12,
  humidity: 0.7,
  co: 0.03,
  nh3: 0.01,
  no2: 0.001,
  so2: 0.0008,
};

function liveReading(deviceId: string, prev: SensorReading | null): SensorReading | null {
  if (!mockOnlineState[deviceId]) return null;

  const cfg = nodeConfigs[deviceId];
  const base = baseProfile[deviceId];
  const full = cfg.hasFullSensors;

  const target = {
    temperature: rand(base.temp - 0.3, base.temp + 0.3),
    humidity: rand(base.humidity - 3, base.humidity + 3),

    pm25: rand(base.pm25 - 1.2, base.pm25 + 1.2),
    pm1: full ? 0 : 0,
    pm10: full ? 0 : 0,

    co: rand(base.co - 0.03, base.co + 0.03),
    nh3: rand(base.nh3 - 0.01, base.nh3 + 0.01),
    no2: rand(base.no2 - 0.0015, base.no2 + 0.0015),
    so2: full ? rand(base.so2 - 0.0008, base.so2 + 0.0008) : null,
  };

  if (full) {
    target.pm1 = target.pm25 * 0.63;
    target.pm10 = target.pm25 * 1.38;
  }

  const prevVal = prev || target;

  const smoothVal = (key: keyof SensorReading) =>
    clampStep(
      prevVal[key] as number,
      ema(prevVal[key] as number, target[key] as number, ALPHA),
      caps[key]
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
// LATEST (initial)
// -----------------------------------------------------
export const mockLatestReadings: Record<string, SensorReading> = {
  "AQM-001": liveReading("AQM-001", null)!,
  "AQM-002": {
    id: "latest-2",
    device_id: "AQM-002",
    timestamp: new Date("2025-12-03T12:23:00").toISOString(),
    pm1: 11.2,
    pm25: 18.4,
    pm10: 25.9,
    temperature: 27.0,
    humidity: 74,
    co: 0.50,
    nh3: 0.12,
    no2: 0.020,
    so2: 0.007,
  },
  "AQM-003": {
    id: "latest-3",
    device_id: "AQM-003",
    timestamp: new Date("2025-12-03T12:23:00").toISOString(),
    pm1: 0,
    pm25: 0,
    pm10: 0,
    temperature: 26.8,
    humidity: 75,
    co: 0.51,
    nh3: 0.11,
    no2: 0.020,
    so2: null,
  },
  "AQM-004": liveReading("AQM-004", null)!,
};

// -----------------------------------------------------
// LIVE HOOK (EVERY 5 SEC)
// -----------------------------------------------------
export function useLiveReadings(deviceId: string): SensorReading | null {
  const [reading, setReading] = useState<SensorReading | null>(mockLatestReadings[deviceId]);

  useEffect(() => {
    if (!mockOnlineState[deviceId]) return;

    const interval = setInterval(() => {
      setReading(prev => liveReading(deviceId, prev));
    }, INTERVAL_MS);

    return () => clearInterval(interval);
  }, [deviceId]);

  return reading;
}
