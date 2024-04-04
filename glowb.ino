#include <WiFiManager.h>

void setup()
{
    WiFi.mode(WIFI_STA);
    Serial.begin(115200);
    WiFiManager wm;

    bool res = wm.autoConnect("Glowb Setup");

    if (!res)
    {
        Serial.println("Failed to connect");
        // ESP.restart();
    }
    else
    {
        // if you get here you have connected to the WiFi
        Serial.println("connected...yeey :)");
    }
}

void loop()
{
    // put your main code here, to run repeatedly:
}