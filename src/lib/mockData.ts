// Mock data for UI preview - DELETE THIS FILE when ready for production
// Structure identical to backend → removing this file will NOT break the site

import { Device } from "@/hooks/useDevices";
import { SensorReading } from "@/hooks/useSensorReadings";
import { useState, useEffect } from "react";

// -----------------------------------------------------
// NODE CONFIG
// -----------------------------------------------------

const nodeConfigs = {
  "AQM-001": { hasFullSensors: true, status: "online" },
  "AQM-002": { hasFullSensors: true, status: "online" },           // FIXED: Node-2 is online
  "AQM-003": { hasFullSensors: false, status: "offline", freezeTime: new Date("2025-12-02T15:00:00") },
  "AQM-004": { hasFullSensors: false, status: "online" },
};

// -----------------------------------------------------
// DEVICES (unchanged structure)
// -----------------------------------------------------

export const mockDevices: Device[] = [
  {
    id: "1",
    device_id: "AQM-001",
    name: "Node-1",
    location: "Kerala, Calicut",
    status: "online",
    battery: 88,
    last_update: new Date().toISOString(),
  },
  {
    id: "2",
    device_id: "AQM-002",
    name: "Node-2",
    location: "Kerala, Calicut",
    status: "online",                    // FIXED
    battery: 93,
    last_update: new Date().toISOString(),  // FIXED
  },
  {
    id: "3",
    device_id: "AQM-003",
    name: "Node-3",
    location: "Kerala, Calicut",
    status: "offline",                   // stays offline
    battery: 51,
    last_update: new Date("2025-12-02T15:00:00").toISOString(),
  },
  {
    id: "4",
    device_id: "AQM-004",
    name: "Node-4",
    location: "Kerala, Calicut",
    status: "online",
    battery: 77,
    last_update: new Date().toISOString(),
  },
];

// -----------------------------------------------------
// REALISTIC SENSOR PROFILE (Calicut hostel room baseline)
// -----------------------------------------------------

const profile = {
  pm25: 28,
  temp: 26,
  humidity: 96,
  co: 0.9,
  nh3: 0.17,
  no2: 0.028,
  so2: 0.011,
};

// -----------------------------------------------------
// Natural fluctuations
// -----------------------------------------------------

const smooth = (base: number, amp: number, s: number) =>
  base + Math.sin(s) * amp;

// -----------------------------------------------------
// Historical Date Range
// -----------------------------------------------------

const START = new Date("2025-12-02T12:47:00").getTime();
const END = new Date("2025-12-02T23:32:00").getTime();

// -----------------------------------------------------
// Historical Readings
// -----------------------------------------------------

export const generateMockReadings = (deviceId: string): SensorReading[] => {
  const readings: SensorReading[] = [];
  const cfg = nodeConfigs[deviceId];
  const endTime = cfg.freezeTime ? cfg.freezeTime.getTime() : END;

  let i = 0;

  for (let t = START; t <= endTime; t += 2 * 60 * 1000) {
    const s = i * 0.12;

    const temperature = smooth(profile.temp, 0.4, s);
    const humidity = Math.min(98, Math.max(90, profile.humidity - (temperature - 26) * 1.5));

    const co = smooth(profile.co, 0.08, s);
    const nh3 = smooth(profile.nh3, 0.03, s + 1.1);
    const no2 = smooth(profile.no2, 0.006, s + 1.8);
    const so2 = cfg.hasFullSensors ? smooth(profile.so2, 0.004, s + 2.3) : null;

    let pm25 = 0, pm1 = 0, pm10 = 0;

    if (cfg.hasFullSensors) {
      pm25 = smooth(profile.pm25, 6, s + 2.7);
      pm1 = pm25 * 0.62;
      pm10 = pm25 * 1.42;
    }

    readings.push({
      id: `reading-${deviceId}-${i}`,
      device_id: deviceId,
      timestamp: new Date(t).toISOString(),
      pm1: Number(pm1.toFixed(1)),
      pm25: Number(pm25.toFixed(1)),
      pm10: Number(pm10.toFixed(1)),
      temperature: Number(temperature.toFixed(1)),
      humidity: Number(humidity.toFixed(0)),
      co: Number(co.toFixed(2)),
      nh3: Number(nh3.toFixed(3)),
      no2: Number(no2.toFixed(4)),
      so2: so2 !== null ? Number(so2.toFixed(4)) : null,
    });

    i++;
  }

  return readings;
};

// -----------------------------------------------------
// LIVE reading (2 seconds)
// -----------------------------------------------------

function live(deviceId: string, tick: number): SensorReading | null {
  const cfg = nodeConfigs[deviceId];
  if (!cfg || cfg.status === "offline") return null;

  const s = tick * 0.1;

  const temperature = smooth(profile.temp, 0.25, s);
  const humidity = Math.min(98, Math.max(90, profile.humidity - (temperature - 26) * 1.4));

  const co = smooth(profile.co, 0.07, s + 0.3);
  const nh3 = smooth(profile.nh3, 0.025, s + 1.6);
  const no2 = smooth(profile.no2, 0.005, s + 2.1);
  const so2 = cfg.hasFullSensors ? smooth(profile.so2, 0.003, s + 2.7) : null;

  let pm25 = 0, pm1 = 0, pm10 = 0;

  if (cfg.hasFullSensors) {
    pm25 = smooth(profile.pm25, 4.5, s + 3.3);
    pm1 = pm25 * 0.63;
    pm10 = pm25 * 1.38;
  }

  return {
    id: `live-${deviceId}-${Date.now()}`,
    device_id: deviceId,
    timestamp: new Date().toISOString(),
    pm1: Number(pm1.toFixed(1)),
    pm25: Number(pm25.toFixed(1)),
    pm10: Number(pm10.toFixed(1)),
    temperature: Number(temperature.toFixed(1)),
    humidity: Number(humidity.toFixed(0)),
    co: Number(co.toFixed(2)),
    nh3: Number(nh3.toFixed(3)),
    no2: Number(no2.toFixed(4)),
    so2: so2 !== null ? Number(so2.toFixed(4)) : null,
  };
}

// -----------------------------------------------------
// static latest readings (fallback)
// -----------------------------------------------------

export const mockLatestReadings: Record<string, SensorReading> = {
  "AQM-001": {
    id: "latest-1",
    device_id: "AQM-001",
    timestamp: new Date().toISOString(),
    pm1: 18.5,
    pm25: 29.8,
    pm10: 42.1,
    temperature: 26.1,
    humidity: 96,
    co: 0.91,
    nh3: 0.17,
    no2: 0.028,
    so2: 0.011,
  },
  "AQM-002": {
    id: "latest-2",
    device_id: "AQM-002",
    timestamp: new Date().toISOString(),     // FIXED: live timestamp
    pm1: 19.1,
    pm25: 31.0,
    pm10: 43.8,
    temperature: 26.3,
    humidity: 95,
    co: 0.94,
    nh3: 0.19,
    no2: 0.030,
    so2: 0.012,
  },
  "AQM-003": {
    id: "latest-3",
    device_id: "AQM-003",
    timestamp: new Date("2025-12-02T15:00:00").toISOString(),
    pm1: 0,
    pm25: 0,
    pm10: 0,
    temperature: 25.9,
    humidity: 97,
    co: 0.81,
    nh3: 0.12,
    no2: 0.020,
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
    co: 1.02,
    nh3: 0.18,
    no2: 0.030,
    so2: null,
  },
};

// -----------------------------------------------------
// LIVE HOOK
// -----------------------------------------------------

export function useLiveReadings(deviceId: string): SensorReading | null {
  const [r, setR] = useState<SensorReading | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const cfg = nodeConfigs[deviceId];
    if (!cfg || cfg.status === "offline") {
      setR(mockLatestReadings[deviceId] || null);
      return;
    }

    setR(live(deviceId, tick));

    const interval = setInterval(() => {
      setTick(t => {
        const next = t + 1;
        const L = live(deviceId, next);
        if (L) setR(L);
        return next;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [deviceId]);

  return r;
}

