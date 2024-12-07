"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import {
  HiBookOpen,
  HiFire,
  HiHeart,
  HiLink,
  HiOutlineClock,
  HiOutlineHeart,
  HiOutlineHome,
  HiPower,
  HiSpeakerWave,
  HiSun,
} from "react-icons/hi2";
import Wheel from "@uiw/react-color-wheel";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useDebouncedCallback } from "use-debounce";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import Timer from "@/components/timer";
import ElasticSlider from "@/components/ui/elastic-slider";
import { LuRainbow } from "react-icons/lu";
import useController, { Mode } from "@/lib/hooks/useController";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Input } from "@/components/ui/input";

const WHITE_TONES = [
  {
    displayColor: "#fefae0",
    color: { h: 60, s: 100, v: 100, a: 1 },
    rgbw: { r: 0, g: 0, b: 0, w: 255 },
  },
  {
    displayColor: "#bde0fe",
    rgbw: { r: 254, g: 250, b: 224, w: 0 },
    color: { h: 208, s: 97, v: 87, a: 1 },
  },
];

const SCENES = [
  {
    name: "Love",
    icon: <HiHeart className="text-xl" />,
    id: Mode.LOVE,
  },
  {
    name: "Candle",
    icon: <HiFire className="text-xl" />,
    id: Mode.CANDLE,
  },
  {
    name: "Rainbow",
    icon: <LuRainbow className="text-xl" />,
    id: Mode.RAINBOW,
  },
];

const getStatus = async (id: string) => {
  const response = await fetch(`/api/device/${id}/status`);
  return response.json();
};

export default function Device({ params: { id } }: { params: { id: string } }) {
  const [brightness, setBrightness] = useState(50);
  const [hsva, setHsva] = useState({ h: 214, s: 43, v: 90, a: 1 });
  const [isOn, setIsOn] = useState(false);
  const controller = useController({ id });

  const debouncedBrightness = useDebouncedCallback((value) => {
    controller.setBrightness(value);
  }, 100);

  const debouncedColor = useDebouncedCallback((color) => {
    controller.setColor(color);
  }, 200);

  useEffect(() => {
    const sync = async () => {
      const { brightness, color, timestamp, isOn } = await getStatus(id);

      setBrightness(brightness);
      setIsOn(isOn);
    };
    sync();
  }, [id]);

  return (
    <>
      <nav className="flex justify-between items-center p-5 relative">
        <Link
          href="/"
          className={cn(
            buttonVariants({ size: "icon", variant: "ghost" }),
            "scale-100 active:scale-95 transition-transform"
          )}
        >
          <HiOutlineHome className="text-2xl" />
          {/* <HiLink className="text-2xl" /> */}
        </Link>
        <div>
          <div className="relative inset-0 flex items-center justify-center -top-28">
            <div className="rounded-full w-52 h-52 blur-3xl absolute dark:bg-neutral-300/60"></div>
          </div>
          <h1 className="text-xs border-border border px-2 py-0.5 rounded-full bg-neutral-900 flex items-center gap-1">
            {/* <div className="w-2 h-2 bg-green-400 rounded-full"></div> */}
            Glowb
          </h1>
        </div>
        <Drawer>
          <DrawerTrigger asChild>
            <Button
              size={"icon"}
              variant={"ghost"}
              className="scale-100 active:scale-95 transition-transform"
            >
              <HiLink className="text-2xl" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Connection</DrawerTitle>
              <DrawerDescription>
                {controller.local.isAvailable
                  ? "A Local connection is available"
                  : "No local connection available, using remote"}
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4">
              <Input placeholder="Device name" />
            </div>
            <DrawerFooter>
              <Button>Save</Button>
              <DrawerClose>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </nav>
      <main className="h-full flex flex-col justify-between">
        <div></div>
        <div className="bg-neutral-900 rounded-t-[2rem] p-5 flex justify-between flex-col shadow-2xl">
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
                  onChange={(color) => {
                    const newColor = { ...hsva, ...color.hsva };
                    setHsva(newColor);
                    debouncedColor({ ...color.rgb, w: 0 });
                  }}
                />
              </TabsContent>
              <TabsContent value="white" className="flex justify-center">
                <RadioGroup className="flex gap-8 pt-10">
                  {WHITE_TONES.map((tone) => (
                    <div
                      key={tone.displayColor}
                      onClick={() => {
                        setHsva(tone.color);
                        debouncedColor(tone.rgbw);
                      }}
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
                        className="w-full h-full rounded-full shadow-lg shadow-neutral-200/40 dark:shadow-neutral-500/40 block peer-data-[state=checked]:scale-125 scale-100 transition-transform"
                      ></Label>
                    </div>
                  ))}
                </RadioGroup>
              </TabsContent>
              <TabsContent value="scenes" className="flex justify-center">
                <div className="grid grid-cols-2 gap-4">
                  {SCENES.map((scene, i) => (
                    <Button
                      key={i}
                      size={"lg"}
                      onClick={() => controller.setMode(scene.id)}
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
            <ElasticSlider
              value={brightness}
              onValueChange={(b) => {
                setBrightness(b);
                debouncedBrightness(b);
              }}
            />
            <div className="flex justify-center items-center gap-3">
              <div className="hidden">
                <Button
                  size={"lg"}
                  className="w-10 h-10 px-2 rounded-full"
                  variant="outline"
                >
                  <HiOutlineHeart className="w-4 h-4" />
                </Button>
              </div>
              <Button
                size={"lg"}
                onClick={() => controller.togglePower()}
                className="px-2 w-16 h-16 rounded-full"
              >
                <HiPower className="w-8 h-8" />
              </Button>
              <div className="hidden">
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button
                      size={"lg"}
                      className="w-10 h-10 px-2 rounded-full"
                      variant="outline"
                    >
                      <HiOutlineClock className="w-4 h-4" />
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <div className="mx-auto w-full max-w-sm">
                      <Timer id={id} />
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
