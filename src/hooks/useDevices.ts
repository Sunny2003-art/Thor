import { useQuery } from "@tanstack/react-query";
import { mockDevices } from "@/lib/mockData";

export interface Device {
  id: string;
  device_id: string;
  name: string;
  location: string;
  status: string;
  battery: number;
  last_update: string;
}

export const useDevices = () => {
  const { data: devices, refetch } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      return mockDevices;
    },
  });

  return { devices: devices || [], refetch };
};
