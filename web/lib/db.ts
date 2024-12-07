import Dexie, { EntityTable } from "dexie";

interface Device {
  id: number;
  mac?: string;
  name?: string;
}

const db = new Dexie("Glowb") as Dexie & {
  devices: EntityTable<
    Device,
    "id" // primary key "id" (for the typings only)
  >;
};

db.version(1).stores({
  devices: "++id, &name, mac",
});

export { db };
