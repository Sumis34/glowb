import { useCallback, useEffect, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";

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
  const [socketUrl] = useState(`ws://${host ?? "192.168.1.121"}:81`);

  const [deviceId, setDeviceId] = useState(id);

  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl, {
    onOpen: () => sendMessage(JSON.stringify({ type: "PING" })),
  });

  const [allowLocalControl, setAllowLocalControl] = useState(true);

  const wsIsReady = readyState === ReadyState.OPEN;

  const useRemote =
    (preferRemoteControl || !wsIsReady) && deviceId && allowLocalControl;

  const handleSetMode = useCallback(
    (mode: Mode) => {
      if (useRemote) {
        return setMode(mode, deviceId);
      }

      sendMessage(
        JSON.stringify({
          type: "MODE",
          value: mode,
        })
      );
    },
    [sendMessage, useRemote, deviceId]
  );

  const handleTogglePower = useCallback(() => {
    if (useRemote) {
      return togglePower(deviceId);
    }

    sendMessage(
      JSON.stringify({
        type: "TOGGLE_POWER",
      })
    );
  }, [sendMessage, useRemote, deviceId]);

  const handleSetBrightness = useCallback(
    (brightness: number) => {
      if (useRemote) {
        return setDeviceBrightness(brightness, deviceId);
      }

      sendMessage(
        JSON.stringify({
          type: "BRIGHTNESS",
          value: brightness,
        })
      );
    },
    [sendMessage, useRemote, deviceId]
  );

  const handleSetColor = useCallback(
    (color: { r: number; g: number; b: number; w: number }) => {
      if (useRemote) {
        return setColor(color, deviceId);
      }

      sendMessage(
        JSON.stringify({
          type: "COLOR",
          value: color,
        })
      );
    },
    [sendMessage, useRemote, deviceId]
  );

  useEffect(() => {
    const message = parseMessage(lastMessage?.data);

    switch (message?.type) {
      case "PONG":
        if (id && id !== message?.message) {
          console.log("Device ID mismatch detected - disabling local control");
          setAllowLocalControl(false);
        } else {
          setDeviceId(message?.message);
        }
        break;
      default:
        break;
    }
  }, [lastMessage, id]);

  return {
    local: {
      isConnected: wsIsReady,
      isAvailable: wsIsReady && allowLocalControl,
      readyState,
    },
    setMode: handleSetMode,
    togglePower: handleTogglePower,
    setBrightness: handleSetBrightness,
    setColor: handleSetColor,
    deviceId,
  };
}
