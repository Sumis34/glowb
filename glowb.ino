#include <WiFiManager.h>
#include <esp_websocket_client.h>

#include "cJSON.h"

String hostname = "glowb";

const esp_websocket_client_config_t config = {
    .uri = "ws://192.168.1.127:5005/ws?id=glowb",
};

esp_websocket_client_handle_t client;

void initWs() {
    client = esp_websocket_client_init(&config);
    esp_websocket_register_events(
        client,
        WEBSOCKET_EVENT_ANY,
        reinterpret_cast<esp_event_handler_t>(websocket_event_handler),
        NULL);
    esp_websocket_client_start(client);
}

void websocket_event_handler(void *anonParams, esp_event_base_t base, long int event_id, void *event_data) {
    static const char *TAG = "WEBSOCKET";
    esp_websocket_event_data_t *data = (esp_websocket_event_data_t *)event_data;
    switch (event_id) {
        case WEBSOCKET_EVENT_CONNECTED:
            ESP_LOGI(TAG, "WEBSOCKET_EVENT_CONNECTED");
            // conn_state = WS_CONNECTED;
            break;
        case WEBSOCKET_EVENT_DISCONNECTED:
            ESP_LOGI(TAG, "WEBSOCKET_EVENT_DISCONNECTED");
            // max7219_draw_text_7seg(&dev, 0, "DISCNCTD");
            break;
        case WEBSOCKET_EVENT_DATA:
            ESP_LOGI(TAG, "WEBSOCKET_EVENT_DATA");
            ESP_LOGI(TAG, "Received opcode=%d", data->op_code);
            if (data->op_code == 0x08 && data->data_len == 2) {
                ESP_LOGW(TAG, "Received closed message with code=%d", 256 * data->data_ptr[0] + data->data_ptr[1]);
            } else {
                ESP_LOGI(TAG, "Received=%.*s", data->data_len, (char *)data->data_ptr);
            }
            ESP_LOGI(TAG, "Total payload length=%d, data_len=%d, current payload offset=%d", data->payload_len, data->data_len, data->payload_offset);
            break;
        case WEBSOCKET_EVENT_ERROR:
            ESP_LOGE(TAG, "WEBSOCKET_EVENT_ERROR");
            break;
    }
}

void setup() {
    WiFi.mode(WIFI_STA);
    WiFi.setHostname(hostname.c_str());
    Serial.begin(115200);
    WiFiManager wm;

    // wm.resetSettings();

    bool res = wm.autoConnect("Glowb Setup");

    if (!res) {
        Serial.println("Failed to connect");
        // ESP.restart();
    } else {
        // if you get here you have connected to the WiFi
        Serial.println("connected...yeey :)");
    }

    initWs();
}

void loop() {
    delay(1000);
    esp_websocket_client_send_text(client, "Hello, world!", strlen("Hello, world!"), portMAX_DELAY);
    Serial.println("Sent message");
    // put your main code here, to run repeatedly:
}