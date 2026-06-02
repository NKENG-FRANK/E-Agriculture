#include <Wire.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_GFX.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "ILB.h"
#include "IWC.h"
#include "IWA.h"

// ========== OLED Display Settings ==========
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_ADDRESS 0x3C
#define OLED_RESET -1

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ========== WiFi Settings ==========
const char* ssid = "BUY YOURS";
const char* password = "make-money$";

// ========== MQTT Settings ==========
const char* mqtt_broker = "broker.emqx.io";
const int mqtt_port = 1883;
const char* mqtt_topic = "esp32/plant-section-1/sensor/data";
const char* client_id = "section-1";

// ========== All 3 Sensors ==========
ILB lightSensor;
IWC soilSensor;
IWA weatherSensor;

WiFiClient espClient;
PubSubClient mqttClient(espClient);

// ========== Variables ==========
float uvi = 0, lux = 0;
float soilMoisture = 0;
float temperature = 0, humidity = 0;
int rawTouchValue = 0;

// Timing variables
unsigned long lastMQTTTime = 0;
unsigned long lastReadTime = 0;
unsigned long lastScreenSwitch = 0;

// Screen slideshow control
int currentScreen = 0;  // 0 = Status Screen, 1 = Data Screen
const unsigned long screenInterval = 30000;  // Switch every 4 seconds

// ========== Setup ==========
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=== Complete Weather + Soil + Light System ===");
  
  // Initialize I2C
  Wire.begin();
  
  // Initialize OLED
  Serial.println("Initializing OLED...");
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS)) {
    Serial.println("OLED allocation failed!");
  } else {
    Serial.println("OLED initialized!");
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("Initializing...");
    display.display();
    delay(1000);
  }
  
  // Initialize ALL sensors
  Serial.println("\nInitializing sensors...");
  
  if (lightSensor.begin()) {
    Serial.println("  Light sensor OK");
  } else {
    Serial.println("  Light sensor FAILED");
  }
  
  if (soilSensor.begin()) {
    Serial.println("  Soil sensor OK");
  } else {
    Serial.println("  Soil sensor FAILED");
  }
  
  if (weatherSensor.begin()) {
    Serial.println("  Weather sensor OK");
  } else {
    Serial.println("  Weather sensor FAILED");
  }
  
  // Connect to WiFi & MQTT
  connectWiFi();
  connectMQTT();
  
  delay(2000);
}

// ========== Connect WiFi ==========
void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("✓ WiFi Connected!");
    Serial.print("  IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("✗ WiFi Failed!");
  }
}

// ========== Connect MQTT ==========
void connectMQTT() {
  Serial.print("Connecting to MQTT...");
  mqttClient.setServer(mqtt_broker, mqtt_port);
  
  if (mqttClient.connect(client_id)) {
    Serial.println(" ✓ Connected!");
  } else {
    Serial.println(" ✗ Failed!");
  }
}

// ========== Read All Sensors ==========
void readSensors() {
  Serial.println("\n--- Reading Sensors ---");
  
  // Light sensor
  if (lightSensor.getData(uvi, lux)) {
    Serial.printf("  Light: UVI=%.2f, Lux=%.0f\n", uvi, lux);
  } else {
    Serial.println("  Light sensor error");
  }
  
  // Soil sensor
  if (soilSensor.getData(soilMoisture)) {
    Serial.printf("  Soil: %.0f%%\n", soilMoisture);
  } else {
    Serial.println("  Soil sensor error");
  }
  rawTouchValue = touchRead(T2);
  
  // Weather sensor
  if (weatherSensor.getData(temperature, humidity)) {
    Serial.printf("  Weather: %.1f°C, %.0f%% RH\n", temperature, humidity);
  } else {
    Serial.println("  Weather sensor error");
  }
}

// ========== Send MQTT Data ==========
void sendMQTTData() {
  if (!mqttClient.connected()) {
    Serial.println("MQTT not connected!");
    return;
  }
  
  StaticJsonDocument<512> doc;
  
  doc["device"] = "plant 1";
  doc["timestamp"] = millis();
  doc["uvi"] = uvi;
  doc["lux"] = lux;
  doc["soil_moisture"] = soilMoisture;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["wifi_rssi"] = WiFi.RSSI();
  
  // Status strings
  if (uvi < 3) doc["uv_status"] = "LOW";
  else if (uvi < 6) doc["uv_status"] = "MODERATE";
  else if (uvi < 8) doc["uv_status"] = "HIGH";
  else doc["uv_status"] = "EXTREME";
  
  if (soilMoisture < 30) doc["soil_status"] = "DRY";
  else if (soilMoisture < 60) doc["soil_status"] = "MOIST";
  else doc["soil_status"] = "WET";
  
  char jsonBuffer[512];
  serializeJson(doc, jsonBuffer);
  
  if (mqttClient.publish(mqtt_topic, jsonBuffer)) {
    Serial.println("\n--- MQTT Sent ---");
    Serial.println(jsonBuffer);
  } else {
    Serial.println("\n✗ MQTT Publish Failed!");
  }
}

// ========== SCREEN 1: WiFi & MQTT Status ==========
void displayStatusScreen() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  
  // Title
  display.setCursor(0, 0);
  display.println("=== SYSTEM STATUS ===");
  display.drawLine(0, 10, SCREEN_WIDTH, 10, SSD1306_WHITE);
  
  // WiFi Status
  display.setCursor(0, 20);
  display.print("WiFi: ");
  if (WiFi.status() == WL_CONNECTED) {
    display.print("CONNECTED");
    display.setCursor(0, 30);
    display.print("Signal: ");
    display.print(WiFi.RSSI());
    display.println(" dBm");
  } else {
    display.print("DISCONNECTED");
    display.setCursor(0, 30);
    display.print("Check network");
  }
  
  // MQTT Status
  display.setCursor(0, 50);
  display.print("MQTT: ");
  if (mqttClient.connected()) {
    display.print("CONNECTED");
    display.setCursor(90, 50);
    display.print("broker.emqx.io");
  } else {
    display.print("DISCONNECTED");
  }
  
  // Page indicator
  display.setCursor(SCREEN_WIDTH - 20, SCREEN_HEIGHT - 8);
  display.print("1/2");
  
  display.display();
}

// ========== SCREEN 2: All Sensor Data ==========
void displayDataScreen() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  
  // Title
  display.setCursor(0, 0);
  display.println("=== SENSOR DATA ===");
  display.drawLine(0, 10, SCREEN_WIDTH, 10, SSD1306_WHITE);
  
  // Temperature & Humidity
  display.setCursor(0, 16);
  display.print("Temp: ");
  display.print(temperature, 1);
  display.print("C");
  
  display.setCursor(70, 16);
  display.print("Hum: ");
  display.print(humidity, 0);
  display.print("%");
  
  // Soil Moisture (with bar)
  display.setCursor(0, 28);
  display.print("Soil: ");
  display.print((int)soilMoisture);
  display.print("%");
  
  // Soil moisture bar
  int barWidth = map(constrain(soilMoisture, 0, 100), 0, 100, 0, SCREEN_WIDTH - 40);
  display.fillRect(50, 30, barWidth, 5, SSD1306_WHITE);
  display.drawRect(50, 30, SCREEN_WIDTH - 40, 5, SSD1306_WHITE);
  
  // Soil status
  display.setCursor(0, 40);
  if (soilMoisture < 30) {
    display.print("Status: DRY - Water needed!");
  } else if (soilMoisture < 60) {
    display.print("Status: MOIST - Good");
  } else {
    display.print("Status: WET - Reduce water");
  }
  
  // Light & UV
  display.setCursor(0, 52);
  display.print("Lux: ");
  if (lux >= 1000) {
    display.print(lux / 1000, 1);
    display.print("k");
  } else {
    display.print((int)lux);
  }
  display.print(" lx");
  
  display.setCursor(80, 52);
  display.print("UV: ");
  display.print(uvi, 1);
  
  // Page indicator
  display.setCursor(SCREEN_WIDTH - 20, SCREEN_HEIGHT - 8);
  display.print("2/2");
  
  display.display();
}

// ========== Simple Update Display with Slideshow ==========
void updateDisplay() {
  // Check if OLED is working
  static bool oledWorking = true;
  
  if (!oledWorking) {
    if (display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS)) {
      oledWorking = true;
    } else {
      return;
    }
  }
  
  // Switch screens every 'screenInterval' milliseconds
  if (millis() - lastScreenSwitch >= screenInterval) {
    lastScreenSwitch = millis();
    currentScreen = (currentScreen + 1) % 2;  // Toggle between 0 and 1
  }
  
  // Display current screen
  if (currentScreen == 0) {
    displayStatusScreen();
  } else {
    displayDataScreen();
  }
}

// ========== Test OLED Function ==========
void testOLED() {
  Serial.println("Testing OLED...");
  
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS)) {
    Serial.println("OLED not found!");
    return;
  }
  
  display.clearDisplay();
  display.setTextSize(2);
  display.setCursor(20, 25);
  display.println("OK!");
  display.display();
  Serial.println("OLED test passed!");
  delay(2000);
}

// ========== Main Loop ==========
void loop() {
  // Reconnect if needed
  if (WiFi.status() == WL_CONNECTED && !mqttClient.connected()) {
    connectMQTT();
  }
  
  if (mqttClient.connected()) {
    mqttClient.loop();
  }
  
  unsigned long currentTime = millis();
  
  // Read sensors every 2 seconds
  if (currentTime - lastReadTime >= 2000) {
    lastReadTime = currentTime;
    readSensors();
  }
  
  // Update display slideshow (changes every 4 seconds)
  updateDisplay();
  
  // Send MQTT every 5 seconds
  if (currentTime - lastMQTTTime >= 5000 && WiFi.status() == WL_CONNECTED) {
    lastMQTTTime = currentTime;
    sendMQTTData();
  }
}