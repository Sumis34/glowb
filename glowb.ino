#include <Adafruit_NeoPixel.h>
#include <WebSocketsClient.h>
#include <WebSocketsServer.h>
#include <WiFiManager.h>

#include "ArduinoJson.h"

#define LED_PIN 27
#define BUTTON_PIN 26
#define BUTTON_LED_PIN 15
#define MIC_PIN 25
#define NUM_PIXELS 109
#define USE_SERIAL Serial

enum Mode {
    NONE,
    RAINBOW,
    CANDLE,
    LOVE,
    MODE_COUNT
};

Adafruit_NeoPixel strip = Adafruit_NeoPixel(NUM_PIXELS, LED_PIN, NEO_RGBW + NEO_KHZ800);

String hostname = "glowb2";
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

// Status update
unsigned long lastStatusUpdate = 0;
unsigned long statusInterval = 5000;

// Websocket
const uint8_t size = JSON_OBJECT_SIZE(40);
unsigned long lastPingReceived = 0;

WebSocketsClient ws;
WebSocketsServer wsServer = WebSocketsServer(81);
StaticJsonDocument<size> data;
StaticJsonDocument<size> res;

void setClock() {
    configTime(0, 0, "europe.pool.ntp.org");

    USE_SERIAL.print(F("Waiting for NTP time sync: "));
    time_t nowSecs = time(nullptr);
    while (nowSecs < 8 * 3600 * 2) {
        delay(500);
        USE_SERIAL.print(F("."));
        yield();
        nowSecs = time(nullptr);
    }

    USE_SERIAL.println();
    struct tm timeinfo;
    gmtime_r(&nowSecs, &timeinfo);
    USE_SERIAL.print(F("Current time: "));
    USE_SERIAL.print(asctime(&timeinfo));
}

void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
    String resString;
    String resText;
    switch (type) {
        case WStype_DISCONNECTED:
            USE_SERIAL.printf("[WSc] Disconnected!\n");
            break;
        case WStype_CONNECTED:
            res["type"] = "ack";
            res["message"] = "connected";

            USE_SERIAL.printf("[WSc] Connected to url: %s\n", payload);

            serializeJson(res, resString);
            ws.sendTXT(resString);
            break;
        case WStype_TEXT:
            resText = webSocketPayloadHandler(payload);
            ws.sendTXT(resText);
            break;
        case WStype_ERROR:
            USE_SERIAL.printf("[WSc] Error: %s\n", payload);
            break;
    }
}

void webSocketServerEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
    String resText;
    switch (type) {
        case WStype_DISCONNECTED:
            USE_SERIAL.printf("[%u] Disconnected!\n", num);
            break;
        case WStype_CONNECTED: {
            IPAddress ip = wsServer.remoteIP(num);
            USE_SERIAL.printf("[%u] Connected from %d.%d.%d.%d url: %s\n", num, ip[0], ip[1], ip[2], ip[3], payload);
            wsServer.sendTXT(num, "Connected");
        } break;
        case WStype_TEXT:
            USE_SERIAL.printf("[%u] Got text");
            resText = webSocketPayloadHandler(payload);
            wsServer.sendTXT(num, resText);
            break;
        case WStype_ERROR:
        case WStype_FRAGMENT_TEXT_START:
        case WStype_FRAGMENT_BIN_START:
        case WStype_FRAGMENT:
        case WStype_FRAGMENT_FIN:
            break;
    }
}

String webSocketPayloadHandler(uint8_t* payload) {
    String resString;
    deserializeJson(data, payload);

    if (data["type"] == "ON") {
        isOn = true;
    } else if (data["type"] == "OFF") {
        isOn = false;
    } else if (data["type"] == "PING") {
        res["type"] = "PONG";
        res["message"] = String(ESP.getEfuseMac(), HEX);;
        serializeJson(res, resString);
        lastPingReceived = millis();
    } else if (data["type"] == "TOGGLE_POWER") {
        toggleOn();
        res["type"] = "ACK_TOGGLE_POWER";
        res["message"] = "Power toggled";

        serializeJson(res, resString);
    } else if (data["type"] == "BRIGHTNESS") {
        brightness = data["value"];

        res["type"] = "ACK_BRIGHTNESS";
        res["message"] = "Set brightness to " + String(brightness);

        serializeJson(res, resString);
    } else if (data["type"] == "COLOR") {
        if (!isOn) {
            toggleOn();
        }

        r = data["r"];
        g = data["g"];
        b = data["b"];
        w = data["w"];

        res["type"] = "ACK_COLOR";

        serializeJson(res, resString);
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
        } else if (selectedMode == RAINBOW) {
            mode = RAINBOW;
        } else if (selectedMode == CANDLE) {
            mode = CANDLE;
        } else if (selectedMode == LOVE) {
            lastLoveClick = millis();
            loveActive = true;
            mode = LOVE;
        } else {
            res["type"] = "ERROR";
            res["message"] = "Invalid mode";
        }

        serializeJson(res, resString);
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
    }
    return resString;
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

void sendStatus() {
    StaticJsonDocument<JSON_OBJECT_SIZE(40)> statusRes;
    String statusResString;

    statusRes["type"] = "STATUS";
    statusRes["isOn"] = isOn;
    statusRes["brightness"] = brightness;
    statusRes["mode"] = mode;
    statusRes["r"] = r;
    statusRes["g"] = g;
    statusRes["b"] = b;
    statusRes["w"] = w;

    serializeJson(statusRes, statusResString);
    ws.sendTXT(statusResString);
}

void buttonSinglePress() {
    mode = static_cast<Mode>((mode + 1) % MODE_COUNT);
}

uint8_t btnPrev;
unsigned long pressStartTime = 0;
unsigned long longPressDuration = 1000;
bool longPressHandled = false;

unsigned long veryLongPressDuration = 5000;
bool veryLongPressHandled = false;

bool fadeIn = false;
bool fadeOut = false;
unsigned long fadeStartTime = 0;
int fadeDuration = 700;
int currentBrightness = 0;

void toggleOn() {
    isOn = !isOn;
    if (isOn) {
        fadeIn = true;
        fadeOut = false;
        fadeStartTime = millis();
    } else {
        fadeOut = true;
        fadeIn = false;
        fadeStartTime = millis();
    }
}

void setup() {
    WiFi.mode(WIFI_STA);
    Serial.begin(115200);
    WiFiManager wm;

    pinMode(2, OUTPUT);
    pinMode(BUTTON_LED_PIN, OUTPUT);
    pinMode(BUTTON_PIN, INPUT_PULLUP);
    pinMode(LED_PIN, OUTPUT);
    pinMode(MIC_PIN, INPUT);

    strip.begin();

    strip.fill(strip.Color(0, 0, 25, 0));
    strip.show();

    btnPrev = digitalRead(BUTTON_PIN);
    // wm.resetSettings();

    bool res = wm.autoConnect("Glowb Setup");

    if (!res) {
        Serial.println("Failed to connect");
        // ESP.restart();
    } else {
        // if you get here you have connected to the WiFi
        strip.fill(strip.Color(0, 0, 0, 0));
        Serial.println("connected...yeey :)");
    }

    String macAddress = String(ESP.getEfuseMac(), HEX);

    // setClock();

    // DEV MODE
    ws.begin("192.168.1.127", 5005, "/ws?id=" + macAddress);

    // PROD MODE
    // ws.beginSSL("glowb-api.on.shiper.app", 443, "/ws?id=" + macAddress);

    // Websocket server for local control
    wsServer.begin();
    wsServer.onEvent(webSocketServerEvent);

    // event handler
    ws.onEvent(webSocketEvent);

    lastPingReceived = millis();

    // try ever 5000 again if connection has failed
    ws.setReconnectInterval(5000);
    ws.enableHeartbeat(10000, 3000, 2);
}

void loop() {
    bool btnState = digitalRead(BUTTON_PIN);

    if (btnState == LOW && btnPrev == HIGH) {  // Button press detected
        pressStartTime = millis();             // Record the time when the button is pressed
        longPressHandled = false;
        veryLongPressHandled = false;
        buttonSinglePress();
    }

    if (btnState == LOW && btnPrev == LOW) {  // Button is being held down
        unsigned long pressDuration = millis() - pressStartTime;

        if (pressDuration >= longPressDuration && !longPressHandled) {  // Long press detected
            Serial.println("Button long pressed");
            Serial.println(isOn);

            toggleOn();

            longPressHandled = true;
            Serial.println(pressDuration);
        }

        if (pressDuration >= veryLongPressDuration && !veryLongPressHandled) {  // Very long press detected
            Serial.println("Button very long pressed");
            Serial.println(isOn);

            WiFiManager wm;
            wm.resetSettings();
            ESP.restart();

            veryLongPressHandled = true;
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

    // Handle fade-in and fade-out using sine curve
    if (fadeIn || fadeOut) {
        unsigned long elapsedTime = millis() - fadeStartTime;
        float brightnessLevel = brightness / 255.0;
        float scaledFadeDuration = fadeDuration * brightnessLevel;
        float progress = (float)elapsedTime / scaledFadeDuration;  // Calculate progress as a percentage (0.0 to 1.0)

        if (fadeIn) {
            currentBrightness = int(brightness * sin(progress * (PI / 2)));  // Scale sine curve (0 to brightness)
            if (elapsedTime >= scaledFadeDuration) {                         // End of fade-in
                fadeIn = false;
                currentBrightness = brightness;
            }
        } else if (fadeOut) {
            currentBrightness = int(brightness * sin((1.0 - progress) * (PI / 2)));  // Reverse sine curve
            if (elapsedTime >= scaledFadeDuration) {                                 // End of fade-out
                fadeOut = false;
                strip.clear();
                currentBrightness = brightness;
            }
        }
        strip.setBrightness(currentBrightness);
    } else {
        currentBrightness = brightness;
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
        strip.setBrightness(currentBrightness);
    } else if (!loveActive) {
        mode = NONE;

        if (!fadeOut && !fadeIn)
            strip.clear();
    }

    if (ws.isConnected()) {
        digitalWrite(BUTTON_LED_PIN, LOW);
    } else {
        digitalWrite(BUTTON_LED_PIN, HIGH);
    }

    if (millis() - lastStatusUpdate > statusInterval) {
        sendStatus();
        lastStatusUpdate = millis();
    }

    // Serial.println(digitalRead(BUTTON_PIN));
    ws.loop();
    wsServer.loop();
    strip.show();
}