import { MqttClient } from "mqtt";
import { Command } from ".";

const COMMAND_LENGTH = 7;

const create = async (options: Command) => {
  const cmd = Buffer.alloc(COMMAND_LENGTH);

  cmd.writeUInt8(options.version, 0);
  cmd.writeUInt8(options.type, 1);
  cmd.writeUInt8(options.value, 2);
  cmd.writeUInt8(options.r, 3);
  cmd.writeUInt8(options.g, 4);
  cmd.writeUInt8(options.b, 5);
  cmd.writeUInt8(options.w, 6);

  return cmd;
};

const parse = (buffer: Buffer): Command => {
  if (buffer.length !== COMMAND_LENGTH) {
    throw new Error("Invalid command length");
  }

  return {
    version: buffer.readUInt8(0),
    type: buffer.readUInt8(1),
    value: buffer.readUInt8(2),
    r: buffer.readUInt8(3),
    g: buffer.readUInt8(4),
    b: buffer.readUInt8(5),
    w: buffer.readUInt8(6),
  };
};

const send = async (
  mqtt: MqttClient,
  deviceId: string,
  command: Partial<Command> & Pick<Command, "type">
) => {
  const defaultCommand: Command = {
    version: 1,
    type: command.type,
    value: command.value || 0,
    r: command.r || 0,
    g: command.g || 0,
    b: command.b || 0,
    w: command.w || 0,
  };

  const cmdBuffer = await create(defaultCommand);
  const topic = `/glowb/device/${deviceId}/cmd`;

  return new Promise<void>((resolve, reject) => {
    mqtt.publish(topic, cmdBuffer, { qos: 1 }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export { create, parse, send };
