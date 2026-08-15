"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import useController from "@/lib/hooks/useController";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { LuLoader } from "react-icons/lu";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const controller = useController({});
  const [code, setCode] = useState("");

  const router = useRouter();

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
                <LuLoader className="animate-spin mr-2" />
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
          <Separator className="my-3" />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/device/${code}`);
            }}
            className="flex w-full gap-2"
          >
            <Input
              className="w-full"
              placeholder="ad9113fd615"
              value={code}
              required
              onChange={(e) => setCode(e.target.value)}
            />
            <Button>Link</Button>
          </form>
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
