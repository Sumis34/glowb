import { HiX } from "react-icons/hi";
import { Button } from "./ui/button";
import {
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { useState } from "react";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const ACTIONS = [
  {
    action: "on",
    label: "Turn on",
  },
  {
    action: "off",
    label: "Turn off",
  },
];

export default function Timer({ id }: { id: string }) {
  const [selectedAction, setSelectedAction] = useState(ACTIONS[0].action);
  const [time, setTime] = useState("07:00");
  const [days, setDays] = useState<number[]>([]);

  const send = async () => {
    await fetch(`/api/device/${id}/schedule`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: selectedAction,
        time,
        days,
      }),
    });
  };

  const actions = [
    {
      action: "on",
      time: "07:00",
      actionLabel: "Turn on",
      days: [0, 1, 2, 3, 4, 5, 6],
    },
    {
      action: "on",
      time: "07:00",
      actionLabel: "Turn on",
      days: [0, 1, 2, 3, 4, 5, 6],
    },
    {
      action: "on",
      actionLabel: "Turn on",
      time: "07:00",
      days: [0, 1, 2, 3, 4, 5, 6],
    },
    {
      action: "on",
      actionLabel: "Turn on",
      time: "07:00",
      days: [0, 1, 2, 3, 4, 5, 6],
    },
    {
      action: "on",
      actionLabel: "Turn on",
      time: "07:00",
      days: [0, 1, 2, 3, 4, 5, 6],
    },
    {
      action: "on",
      actionLabel: "Turn on",
      time: "07:00",
      days: [0, 1, 2],
    },
  ];

  return (
    <div>
      <DrawerHeader>
        <DrawerTitle>Schedule</DrawerTitle>
        <DrawerDescription>Schedule your lights</DrawerDescription>
      </DrawerHeader>
      <div className="border border-border shadow-sm rounded-lg p-3">
        <div className="grid grid-cols-2 gap-3 ">
          <div>
            <Label>Action</Label>
            <Select
              value={selectedAction}
              onValueChange={(v) => setSelectedAction(v)}
            >
              {" "}
              <SelectTrigger>
                <SelectValue placeholder="Select an Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {ACTIONS.map((action, i) => (
                    <SelectItem key={i} value={action.action}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Time</Label>
            <Input
              value={time}
              onChange={(e) => setTime(e.target.value)}
              type="time"
            />
          </div>
        </div>
        <div className="grid grid-cols-4 py-2 grid-rows-2 gap-2">
          {DAYS.map((d, i) => (
            <div key={d} className="flex gap-2">
              <Checkbox
                className="w-6 h-6"
                onCheckedChange={(checked) => {
                  if (checked) {
                    setDays([...days, i]);
                  } else {
                    setDays(days.filter((day) => day !== i));
                  }
                }}
                id={d}
              />
              <Label htmlFor={d} className="text-sm font-normal">
                {d}
              </Label>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button variant="default" onClick={send}>
            Add
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
        {actions.map((action, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 rounded-lg gap-4"
          >
            <div className="">
              <div className="font-bold">
                <span>{action.actionLabel}</span> at <span>{action.time}</span>
              </div>
              {DAYS.map((day, i) => (
                <span
                  key={i}
                  className={`border border-border rounded-lg px-1.5 py-1 text-xs mr-1 ${
                    action.days.includes(i)
                      ? "bg-primary text-white"
                      : "bg-neutral-200"
                  }`}
                >
                  {day}
                </span>
              ))}
            </div>
            <Button variant="outline">
              <HiX />
            </Button>
          </div>
        ))}
      </div>
      <DrawerFooter>
        {/* <Button>Submit</Button> */}
        <DrawerClose asChild>
          <Button variant="outline">Close</Button>
        </DrawerClose>
      </DrawerFooter>
    </div>
  );
}
