"use client";

import { useLocalStorage } from "@uidotdev/usehooks";
import { Card, CardContent, CardHeader } from "./ui/card";
import { HiX } from "react-icons/hi";
import { Button } from "./ui/button";
import Link from "next/link";

export interface Device {
  id: string;
  name: string;
}

export type DeviceStore = Record<string, Device>;

export default function Devices() {
  const [devices, setDevices] = useLocalStorage<DeviceStore | null>(
    "devices",
    null
  );

  return (
    <>
      <div className="flex gap-2 flex-col mt-4">
        {devices ? (
          Object.entries(devices).map(([id, device]) => {
            return (
              <Card key={device.id}>
                <Link href={`/device/${device.id}`}>
                  <CardHeader className="p-3 pb-0">
                    <div className="flex justify-between">
                      <h4 className="text-lg font-bold">{device.name}</h4>
                      <Button size={"icon"} variant={"outline"}>
                        <HiX />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-muted-foreground">{device.id}</p>
                  </CardContent>
                </Link>
              </Card>
            );
          })
        ) : (
          <p>No devices</p>
        )}
      </div>
    </>
  );
}
