#include <WebSocketsClient.h>
#include <WiFiManager.h>

#include "ArduinoJson.h"

String hostname = "glowb";

const uint8_t size = JSON_OBJECT_SIZE(5);

WebSocketsClient ws;
StaticJsonDocument<size> data;
StaticJsonDocument<size> res;

void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
    String resString;
    ws.sendTXT("got event");
    switch (type) {
        case WStype_DISCONNECTED:

            break;
        case WStype_CONNECTED:

            // send message to server when Connected
            ws.sendTXT("Connected");
            break;
        case WStype_TEXT:

            deserializeJson(data, payload);

            res["type"] = "ack";
            res["message"] = data["message"];

            serializeJson(res, resString);

            // send message to server
            ws.sendTXT(resString);

            digitalWrite(2, HIGH);
            delay(500);
            digitalWrite(2, LOW);

            break;
        case WStype_ERROR:
            break;
    }
}

void setup() {
    WiFi.mode(WIFI_STA);
    WiFi.setHostname(hostname.c_str());
    Serial.begin(115200);
    WiFiManager wm;

    pinMode(2, OUTPUT);

    // wm.resetSettings();

    bool res = wm.autoConnect("Glowb Setup");

    if (!res) {
        Serial.println("Failed to connect");
        // ESP.restart();
    } else {
        // if you get here you have connected to the WiFi
        Serial.println("connected...yeey :)");
    }

    ws.begin("192.168.1.127", 5005, "/ws?id=glowb2");

    // event handler
    ws.onEvent(webSocketEvent);

    // try ever 5000 again if connection has failed
    ws.setReconnectInterval(5000);
}

void loop() {
    ws.loop();
}