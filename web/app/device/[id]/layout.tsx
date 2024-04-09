import { Button } from "@/components/ui/button";
import { HiCog, HiOutlineCog6Tooth } from "react-icons/hi2";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const name = "Nadine❤️";
  return (
    <div className="h-screen flex flex-col">
      <nav className="flex justify-between items-center p-5">
        <h1 className="font-extrabold text-xl">{name}</h1>
        <Button size={"icon"} variant={"secondary"}>
          <HiOutlineCog6Tooth className="text-2xl" />
        </Button>
      </nav>
      {children}
    </div>
  );
}
