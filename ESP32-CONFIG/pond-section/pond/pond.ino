#include <Wire.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_GFX.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "ILB.h"
#include "IWA.h"
#include "IWB.h"

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
const char* mqtt_topic = "fishpond/monitor/data";
const char* client_id = "FishPond_Monitor_001";

// ========== Sensors ==========
ILB lightSensor;
IWA weatherSensor;
IWB pressureSensor;

WiFiClient espClient;
PubSubClient mqttClient(espClient);

// ========== Data Variables ==========
float lux = 0;
float airTemp = 0;
float humidity = 0;
float barometricPressure = 0;
float waterTemp = 0;

// ========== Timing ==========
unsigned long lastReadTime = 0;
unsigned long lastMQTTTime = 0;
unsigned long lastDisplayUpdate = 0;
unsigned long lastScreenSwitch = 0;
int currentScreen = 0;

// ========== Setup ==========
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=== FISH POND MONITOR ===");
  
  Wire.begin();
  
  // Initialize OLED
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS)) {
    Serial.println("OLED not found!");
  } else {
    Serial.println("OLED initialized");
  }
  
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("FISH POND");
  display.println("Initializing...");
  display.display();
  
  // Initialize Light Sensor
  Serial.println("\nInitializing Light Sensor...");
  if (lightSensor.begin()) {
    Serial.println("  Light sensor OK");
  } else {
    Serial.println("  Light sensor FAILED!");
  }
  
  // Initialize Weather Sensor
  Serial.println("Initializing Weather Sensor...");
  if (weatherSensor.begin()) {
    Serial.println("  Weather sensor OK");
  } else {
    Serial.println("  Weather sensor FAILED!");
  }
  
  // Initialize Pressure Sensor
  Serial.println("Initializing Pressure Sensor...");
  if (pressureSensor.begin()) {
    Serial.println("  Pressure sensor OK");
  } else {
    Serial.println("  Pressure sensor FAILED!");
  }
  
  // Connect to WiFi
  connectWiFi();
  connectMQTT();
  
  Serial.println("\n✓ System Ready!");
  
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("POND READY!");
  display.display();
  delay(2000);
}

void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi Connected!");
    Serial.print("  IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n✗ WiFi Failed!");
  }
}

void connectMQTT() {
  Serial.print("Connecting to MQTT...");
  mqttClient.setServer(mqtt_broker, mqtt_port);
  
  if (mqttClient.connect(client_id)) {
    Serial.println(" ✓ Connected!");
  } else {
    Serial.println(" ✗ Failed!");
  }
}

// ========== REFRESH SENSORS - FORCED READS ==========
void readSensors() {
  // ===== LIGHT SENSOR (ILB) - FORCED REFRESH =====
  float uvi_temp1, uvi_temp2;
  
  // Method 1: Read twice to force fresh data
  lightSensor.getData(uvi_temp1, lux);
  delay(50);
  lightSensor.getData(uvi_temp2, lux);
  
  // Take the second reading (usually fresher)
  lux = lux;
  
  // Also try reading raw values if available (debug)
  Serial.printf("  Light raw UVI: %.2f / %.2f\n", uvi_temp1, uvi_temp2);
  
  // ===== WEATHER SENSOR (IWA) =====
  weatherSensor.getData(airTemp, humidity);
  
  // ===== PRESSURE SENSOR (IWB) =====
  double pres, presTemp;
  pressureSensor.getData(pres, presTemp);
  barometricPressure = (float)pres;
  
  // Calculate estimated water temperature
  waterTemp = airTemp - 2.5;
  if (waterTemp < 0) waterTemp = 0;
  
  // Debug output
  Serial.println("\n--- FISH POND READINGS ---");
  Serial.printf("  Light: %.0f lx\n", lux);
  Serial.printf("  Air Temp: %.1f C | Water Est: %.1f C\n", airTemp, waterTemp);
  Serial.printf("  Humidity: %.0f %%\n", humidity);
  Serial.printf("  Pressure: %.1f hPa\n", barometricPressure);
}

void sendMQTTData() {
  if (!mqttClient.connected()) {
    connectMQTT();
    return;
  }
  
  StaticJsonDocument<256> doc;
  
  doc["lux"] = lux;
  doc["air_temp"] = airTemp;
  doc["water_temp_est"] = waterTemp;
  doc["humidity"] = humidity;
  doc["pressure"] = barometricPressure;
  doc["timestamp"] = millis();
  
  char buffer[256];
  serializeJson(doc, buffer);
  
  if (mqttClient.publish(mqtt_topic, buffer)) {
    Serial.println("\n✓ MQTT Data Sent");
    Serial.println(buffer);
  } else {
    Serial.println("\n✗ MQTT Send Failed!");
  }
}

// ========== OLED DISPLAY SCREENS ==========

void displayPondScreen() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  
  display.setCursor(0, 0);
  display.println("=== FISH POND ===");
  display.drawLine(0, 10, SCREEN_WIDTH, 10, SSD1306_WHITE);
  
  display.setCursor(0, 18);
  display.print("Water: ");
  display.print(waterTemp, 1);
  display.println(" C");
  
  display.setCursor(0, 30);
  display.print("Pressure: ");
  display.print(barometricPressure, 0);
  display.println(" hPa");
  
  display.setCursor(0, 42);
  display.print("Light: ");
  if (lux >= 1000) {
    display.print(lux / 1000, 1);
    display.print("k");
  } else {
    display.print((int)lux);
  }
  display.println(" lx");
  
  display.setCursor(0, 54);
  display.print("Humidity: ");
  display.print(humidity, 0);
  display.println("%");
  
  display.display();
}

void displayStatusScreen() {
  display.clearDisplay();
  display.setTextSize(1);
  
  display.setCursor(0, 0);
  display.println("=== SYSTEM STATUS ===");
  display.drawLine(0, 10, SCREEN_WIDTH, 10, SSD1306_WHITE);
  
  display.setCursor(0, 20);
  display.print("WiFi: ");
  display.println(WiFi.status() == WL_CONNECTED ? "CONNECTED" : "DISCONNECTED");
  
  display.setCursor(0, 32);
  display.print("MQTT: ");
  display.println(mqttClient.connected() ? "CONNECTED" : "DISCONNECTED");
  
  display.setCursor(0, 44);
  display.print("Air Temp: ");
  display.print(airTemp, 1);
  display.println(" C");
  
  display.setCursor(0, 56);
  display.print("Press: ");
  display.print(barometricPressure, 0);
  display.println(" hPa");
  
  display.display();
}

void updateDisplay() {
  if (millis() - lastScreenSwitch >= 4000) {
    lastScreenSwitch = millis();
    currentScreen = (currentScreen + 1) % 2;
  }
  
  if (currentScreen == 0) {
    displayPondScreen();
  } else {
    displayStatusScreen();
  }
}

// ========== MAIN LOOP ==========
void loop() {
  if (WiFi.status() == WL_CONNECTED && !mqttClient.connected()) {
    connectMQTT();
  }
  
  if (mqttClient.connected()) {
    mqttClient.loop();
  }
  
  unsigned long now = millis();
  
  // Read sensors every 2 seconds (FORCED REFRESH)
  if (now - lastReadTime >= 2000) {
    lastReadTime = now;
    readSensors();
  }
  
  // Update display every 500ms
  if (now - lastDisplayUpdate >= 500) {
    lastDisplayUpdate = now;
    updateDisplay();
  }
  
  // Send MQTT every 10 seconds
  if (now - lastMQTTTime >= 10000 && WiFi.status() == WL_CONNECTED) {
    lastMQTTTime = now;
    sendMQTTData();
  }
  
  delay(50);
}