"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import useController from "@/lib/hooks/useController";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { LuLoader2 } from "react-icons/lu";

export default function Home() {
  const controller = useController({});

  console.log(controller);

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
        </div>
      </div>
    </main>
  );
}
