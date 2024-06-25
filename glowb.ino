#include <Adafruit_NeoPixel.h>
#include <WebSocketsClient.h>
#include <WiFiManager.h>

#include "ArduinoJson.h"

#define LED_PIN 27
#define BUTTON_PIN 26
#define BUTTON_LED_PIN 15
#define MIC_PIN 25
#define NUM_PIXELS 109

enum Mode {
    NONE,
    BLINK,
    FADE,
    RAINBOW,
    MIC,
    CANDLE,
    LOVE,
    MODE_COUNT
};

Adafruit_NeoPixel strip = Adafruit_NeoPixel(NUM_PIXELS, LED_PIN, NEO_RGBW + NEO_KHZ800);

String hostname = "glowb";
const String endpoint = "glowb.noekrebs.ch";
int brightness = 20;
bool isOn = true;
uint8_t r = 0;
uint8_t g = 0;
uint8_t b = 0;
uint8_t w = 100;

// Previous values of the color to restore in case of destructive mode change
uint8_t oldR = 0;
uint8_t oldG = 0;
uint8_t oldB = 0;
uint8_t oldW = 0;

Mode mode = NONE;
Mode oldMode = NONE;

unsigned long lastLoveClick = 0;
bool loveActive = false;

// Rainbow
int rainbowColorOffset = 0;
unsigned long lastRainbowUpdate = 0;
int rainbowInterval = 100;

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

                // Safe color values before changing mode
                oldR = r;
                oldG = g;
                oldB = b;
                oldW = w;
                oldMode = mode;

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
                } else if (selectedMode == LOVE) {
                    lastLoveClick = millis();
                    loveActive = true;
                    mode = LOVE;
                } else if (selectedMode == MIC) {
                    mode = MIC;
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

void love() {
    long fadeInDuration = 200;
    long maxDuration = 1000 + fadeInDuration;
    long currentDuration = millis() - lastLoveClick;
    long rValue;

    if (currentDuration < fadeInDuration) {
        // Fast fade-in phase
        float normalizedTime = (float)currentDuration / fadeInDuration;
        normalizedTime = constrain(normalizedTime, 0.0, 1.0);
        normalizedTime = sqrt(normalizedTime);
        rValue = constrain(map(normalizedTime * fadeInDuration, 0, fadeInDuration, 0, 255), 0, 255);
    } else {
        // Slow fade-out phase
        float normalizedTime = (float)(currentDuration - fadeInDuration) / (maxDuration - fadeInDuration);
        normalizedTime = constrain(normalizedTime, 0.0, 1.0);
        normalizedTime = sqrt(normalizedTime);
        rValue = constrain(map(normalizedTime * (maxDuration - fadeInDuration), 0, (maxDuration - fadeInDuration), 255, 0), 0, 255);
    }

    w = 0;
    r = rValue;
    g = 0;
    b = 0;

    strip.fill(strip.Color(g, r, b, w));

    if (currentDuration >= maxDuration) {
        w = oldW;
        r = oldR;
        g = oldG;
        b = oldB;
        loveActive = false;
        mode = oldMode;
    }
}

void rainbow() {
    unsigned long currentMillis = millis();

    if (currentMillis - lastRainbowUpdate >= rainbowInterval) {
        lastRainbowUpdate = currentMillis;
        for (int i = 0; i < NUM_PIXELS; i += 10) {
            int pixelHue = (i * 65536L / NUM_PIXELS / 10 + rainbowColorOffset) % 65536L;
            uint32_t color = strip.ColorHSV(pixelHue);
            for (int j = 0; j < 10 && (i + j) < NUM_PIXELS; j++) {
                strip.setPixelColor(i + j, color);
            }
        }
        rainbowColorOffset = (rainbowColorOffset + 256) % 65536L;
        strip.show();
    }
}

const int sampleWindow = 50;  // Sample window width in mS (50 mS = 20Hz)      // Preamp output pin connected to A0
unsigned int sample;

void micMode() {
    unsigned long startMillis = millis();  // Start of sample window
    unsigned int peakToPeak = 0;           // peak-to-peak level

    unsigned int signalMax = 0;
    unsigned int signalMin = 1024;

    // collect data for 50 mS and then plot data
    while (millis() - startMillis < sampleWindow) {
        sample = analogRead(MIC_PIN);
        if (sample < 1024)  // toss out spurious readings
        {
            if (sample > signalMax) {
                signalMax = sample;  // save just the max levels
            } else if (sample < signalMin) {
                signalMin = sample;  // save just the min levels
            }
        }
    }
    peakToPeak = signalMax - signalMin;  // max - min = peak-peak amplitude
    Serial.println(peakToPeak);
    strip.fill(strip.Color(0, 0, 0, peakToPeak));
}

void buttonSinglePress() {
    mode = static_cast<Mode>((mode + 1) % MODE_COUNT);
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

    ws.begin(endpoint, 5005, "/ws?id=" + macAddress);

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
        buttonSinglePress();
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

    if (loveActive) {
        love();
    }

    if (isOn) {
        switch (mode) {
            case CANDLE:
                for (int i = 0; i < strip.numPixels(); i++) {
                    int flicker = random(0, 255);
                    strip.setPixelColor(i, strip.Color(0, 0, 0, flicker));
                    strip.show();
                }
                break;
            case MIC:
                micMode();
                break;
            case LOVE:
                // Love mode is handled in the main loop to allow activation if led's are off
                break;
            case RAINBOW:
                rainbow();
                break;
            default:
                strip.fill(strip.Color(g, r, b, w));
                break;
        }
        strip.setBrightness(brightness);
    } else if (!loveActive) {
        mode = NONE;
        strip.clear();
    }

    if (ws.isConnected()) {
        digitalWrite(BUTTON_LED_PIN, LOW);
    } else {
        digitalWrite(BUTTON_LED_PIN, HIGH);
    }

    // Serial.println(digitalRead(BUTTON_PIN));
    ws.loop();
    strip.show();
}