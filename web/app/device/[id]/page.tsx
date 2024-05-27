"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import {
  HiAcademicCap,
  HiBolt,
  HiBookOpen,
  HiHandRaised,
  HiHeart,
  HiPower,
  HiSun,
} from "react-icons/hi2";
import Wheel from "@uiw/react-color-wheel";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const WHITE_TONES = [
  {
    displayColor: "#fefae0",
    color: { h: 60, s: 100, v: 100, a: 1 },
  },
  {
    displayColor: "#bde0fe",
    color: { h: 208, s: 97, v: 87, a: 1 },
  },
];

const SCENES = [
  {
    name: "Love",
    icon: <HiHeart className="text-xl" />,
    id: "love",
  },
  {
    name: "Concentrate",
    icon: <HiAcademicCap className="text-xl" />,
    id: "concentrate",
  },
  {
    name: "Energize",
    icon: <HiBolt className="text-xl" />,
    id: "energize",
  },
  {
    name: "Reading",
    icon: <HiBookOpen className="text-xl" />,
    id: "reading",
  },
];

const sendColor = (
  color: { h: number; s: number; v: number; a: number },
  id: string
) => {
  fetch(`/api/device/${id}/color`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(color),
  });
};

const togglePower = (id: string) => {
  fetch(`/api/device/${id}/toggle`, {
    method: "POST",
  });
};

export default function Device({ params: { id } }: { params: { id: string } }) {
  const [brightness, setBrightness] = useState(50);
  const [hsva, setHsva] = useState({ h: 214, s: 43, v: 90, a: 1 });

  return (
    <main className="h-full flex flex-col justify-between">
      <div></div>
      <div className="bg-white rounded-t-[2rem] p-5 flex justify-between flex-col shadow-2xl">
        <Tabs defaultValue="white" className="h-full">
          <div className="flex justify-center">
            <TabsList>
              <TabsTrigger value="color">Color</TabsTrigger>
              <TabsTrigger value="white">White</TabsTrigger>
              <TabsTrigger value="scenes">Scenes</TabsTrigger>
            </TabsList>
          </div>
          <div className="pt-10 h-72">
            <TabsContent value="color" className="flex justify-center">
              <Wheel
                color={hsva}
                onChange={(color) => setHsva({ ...hsva, ...color.hsva })}
              />
            </TabsContent>
            <TabsContent value="white" className="flex justify-center">
              <RadioGroup className="flex gap-8 pt-10">
                {WHITE_TONES.map((tone) => (
                  <div
                    key={tone.displayColor}
                    onClick={() => setHsva(tone.color)}
                    className="w-20 h-20"
                  >
                    <RadioGroupItem
                      value={tone.displayColor}
                      id={tone.displayColor}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={tone.displayColor}
                      style={{ backgroundColor: tone.displayColor }}
                      className="w-full h-full rounded-full shadow-lg shadow-gray-200/40 block peer-data-[state=checked]:scale-125 scale-100 transition-transform"
                    ></Label>
                  </div>
                ))}
              </RadioGroup>
            </TabsContent>
            <TabsContent value="scenes" className="flex justify-center">
              <div className="grid grid-cols-2 gap-4">
                {SCENES.map((scene) => (
                  <Button
                    key={scene.id}
                    size={"lg"}
                    variant={"secondary"}
                    className="flex flex-col items-start gap-2 p-4 rounded-[0.5rem] w-full h-20 scale-100 active:scale-95 transition-transform"
                  >
                    {scene.icon}
                    <span className="font-bold">{scene.name}</span>
                  </Button>
                ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>
        <div className="flex flex-col gap-10 justify-center">
          <BrightnessSlider onValueChange={setBrightness} value={brightness} />
          <div className="flex justify-center">
            <Button
              size={"lg"}
              onClick={() => togglePower(id)}
              className="px-2 w-16 h-16 rounded-full"
            >
              <HiPower className="w-8 h-8" />
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

const BrightnessSlider = ({
  onValueChange,
  value,
}: {
  onValueChange: (b: number) => void;
  value: number;
}) => (
  <div className="px-10 flex items-center gap-2 w-full">
    <HiSun className="text-2xl" />
    <Slider
      onValueChange={(v) => onValueChange(v[0])}
      defaultValue={[value]}
      max={100}
      min={5}
      step={1}
    />
    <span className="text-sm text-muted-foreground tabular-nums w-5">
      {value}%
    </span>
  </div>
);
