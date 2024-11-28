import { HiArrowRight } from "react-icons/hi2";

export default function Home() {
  return (
    <main className="flex justify-center min-h-screen p-12">
      <div className="relative flex-col max-w-screen-md flex">
        <h1 className="text-5xl font-extrabold relative">Glowb💡</h1>
        <p className="mt-2 text-muted-foreground">
          Glowb is an ESP32-powered smart lamp designed in the form of a glowing
          globe, ideal for bedside use. It offers adjustable lighting and smart
          connectivity.
        </p>
        <h2 className="text-2xl font-bold mt-10">Devices</h2>
        <p className="mt-1 text-muted-foreground">
          To link a device, scan the QR code on the device or enter the device
          ID in the url bar. /device/:id
        </p>
        <h2 className="text-2xl font-bold mt-5">Instructions</h2>
        <h3 className="text-lg font-bold mt-2">
          Short Press the Power Button
        </h3>
        <p className="text-muted-foreground text-sm">
          Switch the lamp mode. The lamp will cycle through the modes.
        </p>
        <h3 className="text-lg font-bold mt-2">
          Long Press the Power Button (1 seconds)
        </h3>
        <p className="text-muted-foreground text-sm">
          Turn the lamp on or off. 
        </p>
        <h3 className="text-lg font-bold mt-2">
          Long Press the Power Button (5 seconds)
        </h3>
        <p className="text-muted-foreground text-sm">
          Rest the WiFi settings. 
        </p>
        <h2 className="text-2xl font-bold mt-10">Help</h2>
        <p className="mt-2 text-muted-foreground">
          These are common errors faced with the Glowb
        </p>
        <h3 className="text-lg font-bold mt-2">
          Lamp is only lighting up blue
        </h3>
        <p className="text-muted-foreground text-sm">
          This means the lamp is currently not connected to a WiFi Network. To
          Setup a connection connect your phone to the WiFi Network created by
          the Glowb and visit 192.168. 4.1 in your browser.
        </p>
        <h3 className="text-lg font-bold mt-2">
          The Power Button Lights up Red.
        </h3>
        <p className="text-muted-foreground text-sm">
          This means the lamp is currently not connected to a Glowb Server it can only be controlled by the physical button on the lamp.
        </p>
      </div>
    </main>
  );
}
