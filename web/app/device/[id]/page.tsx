"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { HiPower, HiSun } from "react-icons/hi2";

export default function Device({ params: { id } }: { params: { id: string } }) {
  const [brightness, setBrightness] = useState(50);

  return (
    <main className="h-full flex flex-col justify-between">
      <div className=" p-5">
        <h1>Device {id}</h1>
      </div>
      <div className="bg-white rounded-t-[2rem] h-3/4 p-5 flex justify-between flex-col shadow-xl">
        <Tabs defaultValue="white">
          <div className="flex justify-center">
            <TabsList>
              <TabsTrigger value="color">Color</TabsTrigger>
              <TabsTrigger value="white">White</TabsTrigger>
              <TabsTrigger value="scenes">Scenes</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="color">
            <div className="px-10 flex items-center gap-2">
              <HiSun className="text-2xl" />
              <Slider
                onValueChange={(v) => setBrightness(v[0])}
                defaultValue={[50]}
                max={100}
                min={5}
                step={1}
              />
              <span className="text-sm text-muted-foreground tabular-nums w-5">
                {brightness}%
              </span>
            </div>
          </TabsContent>
          <TabsContent value="white"></TabsContent>
        </Tabs>
        <div className="flex justify-center">
          <Button size={"lg"} className="px-2 w-12 h-12 rounded-full">
            <HiPower className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </main>
  );
}
