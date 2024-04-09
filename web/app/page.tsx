import { HiArrowRight } from "react-icons/hi2";

export default function Home() {
  return (
    <main className="flex justify-center h-screen p-12">
      <div className="relative flex-col max-w-screen-md flex">
        <h1 className="text-5xl font-extrabold relative">Glowb💡</h1>
        <p className="mt-2 text-muted-foreground">
          Glowb is an ESP32-powered smart lamp designed in the form of a glowing
          globe, ideal for bedside use. It offers adjustable lighting and smart
          connectivity.
        </p>
        <h2 className="text-2xl font-bold mt-10">Devices</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          To link a device, scan the QR code on the device or enter the device
          ID
        </p>
      </div>
    </main>
  );
}
