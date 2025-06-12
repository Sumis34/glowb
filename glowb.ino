#include <Adafruit_NeoPixel.h>
#include <ESPmDNS.h>
#include <MQTT.h>
#include <WebSocketsClient.h>
#include <WebSocketsServer.h>
#include <WiFiManager.h>

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

enum CommandType : uint8_t {
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
    END_MODE_RANGE
};

struct CommandMessage {
    uint8_t version;
    CommandType type;
    uint8_t value;       // For brightness or other numeric values
    uint8_t r, g, b, w;  // For color values
};

Adafruit_NeoPixel strip = Adafruit_NeoPixel(NUM_PIXELS, LED_PIN, NEO_RGBW + NEO_KHZ800);

String hostname = "glowb3";
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

unsigned long lastStatusUpdate = 0;
unsigned long statusInterval = 5000;

// mqtt
WiFiClient net;
MQTTClient mqtt;

WebSocketsServer wsServer = WebSocketsServer(81);

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

void prepareForMode() {
    oldR = r;
    oldG = g;
    oldB = b;
    oldW = w;
    oldMode = mode;
}

void mqttCallback(MQTTClient* client, char topic[], char bytes[], int length) {
    if (length < sizeof(CommandMessage)) {
        Serial.print(length);
        Serial.println(" bytes received, expected at least " + String(sizeof(CommandMessage)) + " bytes");
        Serial.println("Received payload too short");
        return;
    }

    CommandMessage* msg = (CommandMessage*)bytes;

    switch (msg->type) {
        case ON:
            isOn = true;
            break;
        case OFF:
            isOn = false;
            break;
        case COLOR:
            r = msg->r;
            g = msg->g;
            b = msg->b;
            w = msg->w;
            break;
        case BRIGHTNESS:
            brightness = msg->value;
            if (brightness > 255) {
                brightness = 255;
            } else if (brightness < 0) {
                brightness = 0;
            }
            break;
        case TOGGLE_POWER:
            toggleOn();
            break;
        case LOVE_MODE:
            prepareForMode();
            lastLoveClick = millis();
            loveActive = true;
            mode = LOVE;
            break;
        case RAINBOW_MODE:
            prepareForMode();
            mode = RAINBOW;
            break;
        case CANDLE_MODE:
            prepareForMode();
            mode = CANDLE;
            break;
        default:
            Serial.println("Unknown command type");
            break;
    }
}

void connect() {
    String clientId = "glowb-client-" + String(ESP.getEfuseMac(), HEX);
    while (!mqtt.connect(clientId.c_str(), "user", "pass")) {
        Serial.print("...");
    }
    mqtt.subscribe("/glowb/device/" + String(ESP.getEfuseMac(), HEX) + "/cmd");
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
    // ws.begin("192.168.1.127", 5005, "/ws?id=" + macAddress);

    // PROD MODE
    // ws.beginSSL("glowb-api.on.shiper.app", 443, "/ws?id=" + macAddress);

    mqtt.begin("broker.hivemq.com", net);
    mqtt.onMessageAdvanced(mqttCallback);
    connect();

    // if (!MDNS.begin(hostname)) {
    //     Serial.println("Failed to start mDNS");
    // }
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

    if (!mqtt.connected()) {
        digitalWrite(BUTTON_LED_PIN, HIGH);
        connect();
    } else {
        digitalWrite(BUTTON_LED_PIN, LOW);
    }

    if (millis() - lastStatusUpdate > statusInterval) {
        // sendStatus();
        lastStatusUpdate = millis();
    }

    // Serial.println(digitalRead(BUTTON_PIN));
    mqtt.loop();
    strip.show();
}