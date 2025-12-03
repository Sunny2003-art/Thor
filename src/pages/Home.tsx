import { Layout } from "@/components/Layout";
import { DeviceCard } from "@/components/DeviceCard";
import { useDevices } from "@/hooks/useDevices";
import { useLatestReading } from "@/hooks/useSensorReadings";

function DeviceCardWithData({ device }: { device: any }) {
  const { reading } = useLatestReading(device.device_id);

  const deviceData = {
    deviceId: device.device_id,
    name: device.name,
    location: device.location,
    status: device.status,
    lastSeen: device.last_update,
    pm25: reading?.pm25 || 0,
    pm10: reading?.pm10 || 0,
    temp: reading?.temperature || 0,
    humidity: reading?.humidity || 0,
  };

  return <DeviceCard device={deviceData} />;
}

export default function Home() {
  const { devices } = useDevices();
  const onlineCount = devices.filter((d) => d.status === "online").length;

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Device Overview</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {onlineCount} of {devices.length} devices online
          </p>
        </div>

        {devices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-base sm:text-lg">
              No devices found. Add your first device to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {devices.map((device) => (
              <DeviceCardWithData key={device.device_id} device={device} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
