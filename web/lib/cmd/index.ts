import { create, parse, send } from "./parse";

export enum CommandType {
  ON,
  OFF,
  PING,
  TOGGLE_POWER,
  BRIGHTNESS,
  COLOR,
  BEGIN_MODE_RANGE,
  RAINBOW_MODE,
  CANDLE_MODE,
  LOVE_MODE,
  NO_MODE,
  END_MODE_RANGE,
}

export interface Command {
  version: number;
  value: number;
  type: CommandType;
  r: number;
  g: number;
  b: number;
  w: number;
}

const commandUtils = { create, parse, send };
export default commandUtils;
