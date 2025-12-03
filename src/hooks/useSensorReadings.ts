import { useQuery } from "@tanstack/react-query";
import { generateMockReadings, mockLatestReadings, useLiveReadings } from "@/lib/mockData";

export interface SensorReading {
  id: string;
  device_id: string;
  timestamp: string;
  pm25: number;
  pm10: number;
  pm1: number;
  nh3: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null;  // Carbon Monoxide (ppm) - replaced VOC
  temperature: number | null;
  humidity: number | null;
}

export const useSensorReadings = (deviceId: string, hours: number = 24) => {
  const { data: readings, refetch } = useQuery({
    queryKey: ["sensor-readings", deviceId, hours],
    queryFn: async () => {
      return generateMockReadings(deviceId);
    },
    enabled: !!deviceId,
  });

  return { readings: readings || [], refetch };
};

export const useSensorReadingsByDateRange = (
  deviceId: string,
  startDate: Date | null,
  endDate: Date | null
) => {
  const { data: readings, refetch } = useQuery({
    queryKey: ["sensor-readings-range", deviceId, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      return generateMockReadings(deviceId);
    },
    enabled: !!deviceId && !!startDate && !!endDate,
  });

  return { readings: readings || [], refetch };
};

export const useLatestReading = (deviceId: string) => {
  // Use live readings for real-time updates
  const liveReading = useLiveReadings(deviceId);
  
  const { data: staticReading, refetch } = useQuery({
    queryKey: ["latest-reading", deviceId],
    queryFn: async () => {
      return mockLatestReadings[deviceId] || null;
    },
    enabled: !!deviceId && !liveReading,
  });

  return { reading: liveReading || staticReading, refetch };
};
