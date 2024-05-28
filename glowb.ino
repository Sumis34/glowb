#include <Adafruit_NeoPixel.h>
#include <WebSocketsClient.h>
#include <WiFiManager.h>

#include "ArduinoJson.h"

#define LED_PIN 27
#define BUTTON_PIN 26
#define BUTTON_LED_PIN 15
#define MIC_PIN 25

enum Mode {
    NONE,
    BLINK,
    FADE,
    RAINBOW,
    MIC,
    CANDLE
};

Adafruit_NeoPixel strip = Adafruit_NeoPixel(109, LED_PIN, NEO_RGBW + NEO_KHZ800);

String hostname = "glowb";
int brightness = 20;
bool isOn = true;
uint8_t r = 0;
uint8_t g = 0;
uint8_t b = 0;
uint8_t w = 100;
Mode mode = NONE;

const uint8_t size = JSON_OBJECT_SIZE(40);

WebSocketsClient ws;
StaticJsonDocument<size> data;
StaticJsonDocument<size> res;

void fadeIn() {
    for (int i = 0; i < 256; i++) {
        strip.setBrightness(i);
        strip.show();
        delay(10);
    }
}

void fadeOut() {
    for (int i = 255; i >= 0; i--) {
        strip.setBrightness(i);
        strip.show();
        delay(10);
    }
}

void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
    String resString;
    switch (type) {
        case WStype_DISCONNECTED:

            break;
        case WStype_CONNECTED:
            res["type"] = "ack";
            res["message"] = "connected";

            serializeJson(res, resString);
            ws.sendTXT(resString);
            break;
        case WStype_TEXT:
            deserializeJson(data, payload);

            if (data["type"] == "ON") {
                isOn = true;
            } else if (data["type"] == "OFF") {
                isOn = false;
            } else if (data["type"] == "TOGGLE_POWER") {
                isOn = !isOn;
                res["type"] = "ACK_TOGGLE_POWER";
                res["message"] = "Power toggled";

                serializeJson(res, resString);
                // send message to server
                ws.sendTXT(resString);
            } else if (data["type"] == "BRIGHTNESS") {
                brightness = data["value"];

                res["type"] = "ACK_BRIGHTNESS";
                res["message"] = "Set brightness to " + String(brightness);

                serializeJson(res, resString);
                ws.sendTXT(resString);
            } else if (data["type"] == "COLOR") {
                r = data["r"];
                g = data["g"];
                b = data["b"];
                w = data["w"];

                res["type"] = "ACK_COLOR";

                serializeJson(res, resString);
                ws.sendTXT(resString);
            } else if (data["type"] == "MODE") {
                Mode selectedMode = data["value"];

                if (selectedMode == mode) {
                    mode = NONE;
                    res["type"] = "ACK_MODE";
                    res["message"] = "Mode was active, turned of";
                } else if (selectedMode == BLINK) {
                    mode = BLINK;
                } else if (selectedMode == FADE) {
                    mode = FADE;
                } else if (selectedMode == RAINBOW) {
                    mode = RAINBOW;
                } else if (selectedMode == CANDLE) {
                    mode = CANDLE;
                } else {
                    res["type"] = "ERROR";
                    res["message"] = "Invalid mode";
                }

                serializeJson(res, resString);
                ws.sendTXT(resString);
            } else if (data["type"] == "mic") {
                // mode = MIC;
            } else if (data["type"] == "status") {
                res["type"] = "status";
                res["isOn"] = isOn;
                res["brightness"] = brightness;
                res["r"] = r;
                res["g"] = g;
                res["b"] = b;
                res["w"] = w;

                serializeJson(res, resString);

                // send message to server
                ws.sendTXT(resString);
            } else {
                res["type"] = "error";
                res["message"] = "Invalid type";

                serializeJson(res, resString);

                // send message to server
                ws.sendTXT(resString);
            }

            break;
        case WStype_ERROR:
            break;
    }
}

uint8_t btnPrev;
unsigned long pressStartTime = 0;
unsigned long longPressDuration = 1000;
bool longPressHandled = false;

void setup() {
    WiFi.mode(WIFI_STA);
    WiFi.setHostname(hostname.c_str());
    Serial.begin(115200);
    WiFiManager wm;

    pinMode(2, OUTPUT);
    pinMode(BUTTON_LED_PIN, OUTPUT);
    pinMode(BUTTON_PIN, INPUT_PULLUP);
    pinMode(LED_PIN, OUTPUT);
    pinMode(MIC_PIN, INPUT);

    strip.begin();

    btnPrev = digitalRead(BUTTON_PIN);
    // wm.resetSettings();

    bool res = wm.autoConnect("Glowb Setup");

    if (!res) {
        Serial.println("Failed to connect");
        // ESP.restart();
    } else {
        // if you get here you have connected to the WiFi
        Serial.println("connected...yeey :)");
    }

    String macAddress = String(ESP.getEfuseMac(), HEX);

    ws.begin("192.168.1.127", 5005, "/ws?id=" + macAddress);

    // event handler
    ws.onEvent(webSocketEvent);

    // try ever 5000 again if connection has failed
    ws.setReconnectInterval(5000);
}

void loop() {
    bool btnState = digitalRead(BUTTON_PIN);

    if (btnState == LOW && btnPrev == HIGH) {  // Button press detected
        pressStartTime = millis();             // Record the time when the button is pressed
        longPressHandled = false;
    }

    if (btnState == LOW && btnPrev == LOW) {  // Button is being held down
        unsigned long pressDuration = millis() - pressStartTime;

        if (pressDuration >= longPressDuration && !longPressHandled) {  // Long press detected
            Serial.println("Button long pressed");
            Serial.println(isOn);

            isOn = !isOn;

            longPressHandled = true;
            Serial.println(pressDuration);
        }
    }

    if (btnState == HIGH && btnPrev == LOW) {  // Button release detected
        pressStartTime = 0;                    // Reset the press start time
    }

    btnPrev = btnState;  // Save the current button state for the next loop

    if (isOn) {
        switch (mode) {
            case CANDLE:
                for (int i = 0; i < strip.numPixels(); i++) {
                    int flicker = random(0, 255);
                    strip.setPixelColor(i, strip.Color(0, 0, 0, flicker));
                    strip.show();
                }
                break;

            default:
                strip.fill(strip.Color(g, r, b, w));
                break;
        }
        strip.setBrightness(brightness);
    } else {
        mode = NONE;
        strip.clear();
    }

    // Serial.println(digitalRead(BUTTON_PIN));
    ws.loop();
    strip.show();
}