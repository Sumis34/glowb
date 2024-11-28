import { Button, buttonVariants } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { HiLink, HiOutlineHome } from "react-icons/hi2";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const name = "";
  return (
    <div className="dark">
      <div className="h-[100dvh] w-screen overflow-hidden flex flex-col dark:bg-neutral-950 text-foreground">
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
                  Connection and device settings
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
        <div>
          <h2 className="text-center text-3xl font-extrabold">{name}</h2>
        </div>
        {children}
      </div>
    </div>
  );
}
