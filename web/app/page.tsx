"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import useController from "@/lib/hooks/useController";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { LuLoader2 } from "react-icons/lu";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export default function Home() {
  const controller = useController({});

  const devices = useLiveQuery(() => db.devices.toArray(), []);

  return (
    <main className="flex justify-center min-h-screen p-12 bg-neutral-200">
      <div className="container max-w-screen-lg flex justify-center items-center">
        <div className="bg-neutral-50 border border-neutral-300 max-w-96 w-full p-3 rounded-2xl flex items-center justify-center flex-col">
          <div className="mb-3">
            <div className="rounded-full w-16 aspect-square bg-neutral-200 border-neutral-300 border translate-y-2"></div>
            <div className="rounded-[5px] w-16 h-4 bg-neutral-400 relative border-neutral-500 border flex items-center px-1"></div>
          </div>
          <h1 className="font-extrabold">Glowb</h1>
          <div className="text-sm mb-3">Wireless smart lamp</div>
          <div className="bg-neutral-200 w-full p-3 border border-neutral-300 rounded-xl flex flex-col">
            {!controller.local.isAvailable && (
              <div className="text-sm flex items-center">
                <LuLoader2 className="animate-spin mr-2" />
                Searching
              </div>
            )}
            {controller.local.isAvailable && (
              <div className="text-sm flex justify-between items-center">
                <div>
                  <div>
                    <div>Glowb One</div>
                    <p className="text-muted-foreground">
                      {controller.deviceId}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/device/${controller.deviceId}`}
                  className={cn(buttonVariants())}
                >
                  Connect
                </Link>
              </div>
            )}
          </div>
          {devices && devices.length > 0 && (
            <>
              <h2 className="mt-5 font-bold text-sm">Recent Connections</h2>
              <div className="mt-2 w-full space-y-3">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="bg-neutral-200 w-full p-3 border border-neutral-300 rounded-xl flex flex-col"
                  >
                    {" "}
                    <div className="text-sm flex justify-between items-center">
                      <div>
                        <div>
                          <div>Glowb One</div>
                          <p className="text-muted-foreground">{device.mac}</p>
                        </div>
                      </div>
                      <Link
                        href={`/device/${device.mac}`}
                        className={cn(buttonVariants())}
                      >
                        Connect
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
