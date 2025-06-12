import { useCallback, useEffect, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import mqtt, { MqttClient } from "mqtt";
import cmd, { CommandType } from "@/lib/cmd";

export enum Mode {
  NONE,
  RAINBOW,
  CANDLE,
  LOVE,
}

const parseMessage = (message: string) => {
  try {
    return JSON.parse(message);
  } catch (error) {
    return null;
  }
};

const togglePower = (id: string) => {
  fetch(`/api/device/${id}/toggle`, {
    method: "POST",
  });
};

const setDeviceBrightness = (brightness: number, id: string) => {
  fetch(`/api/device/${id}/brightness`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ brightness }),
  });
};

const setColor = (
  color: { r: number; g: number; b: number; w: number },
  id: string
) => {
  fetch(`/api/device/${id}/color`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...color,
    }),
  });
};

const setMode = (mode: Mode, id: string) => {
  fetch(`/api/device/${id}/mode`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mode,
    }),
  });
};

export default function useController({
  preferRemoteControl = false,
  id,
  host,
}: {
  preferRemoteControl?: boolean;
  id?: string;
  host?: string;
}) {
  const deviceId = id || "default-device-id";

  const [client, setClient] = useState<MqttClient | null>(null);

  useEffect(() => {
    const connect = () => {
      setClient(mqtt.connect("ws://broker.hivemq.com:8000/mqtt"));
    };

    console.log(client);
    if (client) {
      client.on("connect", () => {
        console.log("Connected to MQTT broker");
      });
      client.on("error", (err) => {
        console.error("Connection error: ", err);
        client.end();
      });
    } else {
      connect();
    }
  }, [client, setClient]);

  const handleSetMode = useCallback(
    async (mode: Mode) => {
      const modes = {
        [Mode.NONE]: CommandType.NO_MODE,
        [Mode.RAINBOW]: CommandType.RAINBOW_MODE,
        [Mode.CANDLE]: CommandType.CANDLE_MODE,
        [Mode.LOVE]: CommandType.LOVE_MODE,
      };

      if (!client) {
        console.error("MQTT client is not connected");
        return;
      }

      await cmd.send(client, deviceId, {
        version: 1,
        type: modes[mode], // Assuming 0 is the type for mode
        value: 0,
        r: 0,
        g: 0,
        b: 0,
        w: 0,
      });

      // setMode(mode, deviceId);
    },
    [deviceId, client]
  );

  const handleTogglePower = useCallback(() => {
    // togglePower(deviceId);

    if (!client) {
      console.error("MQTT client is not connected");
      return;
    }

    cmd.send(client, deviceId, {
      type: CommandType.TOGGLE_POWER,
    });
  }, [client, deviceId]);

  const handleSetBrightness = useCallback(
    (brightness: number) => {
      if (!client) {
        console.error("MQTT client is not connected");
        return;
      }

      cmd.send(client, deviceId, {
        type: CommandType.BRIGHTNESS,
        value: brightness,
      });
    },
    [client, deviceId]
  );

  const handleSetColor = useCallback(
    (color: { r: number; g: number; b: number; w: number }) => {
      if (!client) {
        console.error("MQTT client is not connected");
        return;
      }

      cmd.send(client, deviceId, {
        type: CommandType.COLOR,
        r: color.r,
        g: color.g,
        b: color.b,
        w: color.w,
      });
      // setColor(color, deviceId);
    },
    [client, deviceId]
  );

  return {
    local: {
      isConnected: false,
      isAvailable: false,
      readyState: false,
    },
    setMode: handleSetMode,
    togglePower: handleTogglePower,
    setBrightness: handleSetBrightness,
    setColor: handleSetColor,
    deviceId,
  };
}
