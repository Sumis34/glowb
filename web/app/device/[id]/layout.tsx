export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="dark">
      <div className="dark:bg-neutral-950">
        <div className="h-[100dvh] w-screen overflow-hidden flex flex-col text-foreground container max-w-screen-sm p-0">
          {children}
        </div>
      </div>
    </div>
  );
}
