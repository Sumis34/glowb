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
import {
  HiLink,
  HiOutlineHome,
} from "react-icons/hi2";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const name = "";
  return (
    <div className="dark">
      <div className="h-[100dvh] flex flex-col dark:bg-neutral-950 text-foreground">
        <nav className="flex justify-between items-center p-5">
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
          <h1 className="font-extrabold text-xl">Glowb</h1>
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
