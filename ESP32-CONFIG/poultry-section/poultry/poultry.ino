#include <Wire.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_GFX.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "ILB.h"
#include "IWA.h"
#include "IIA.h"

// ========== OLED Display Settings ==========
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

// Try both addresses if 0x3C doesn't work
#define OLED_ADDRESS 0x3C
// #define OLED_ADDRESS 0x3D

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ========== WiFi Settings ==========
const char* ssid = "BUY YOURS";
const char* password = "make-money$";

// ========== MQTT Settings ==========
const char* mqtt_broker = "broker.emqx.io";
const int mqtt_port = 1883;
const char* mqtt_topic = "poultry/monitor/data";
const char* client_id = "Poultry_Monitor_001";

// ========== Sensors ==========
ILB lightSensor;
IWA weatherSensor;
IIA motionSensor;

WiFiClient espClient;
PubSubClient mqttClient(espClient);

// ========== Data Variables ==========
float lux = 0;
float temperature = 0;
float humidity = 0;
float flockActivity = 0;

// ========== Activity Tracking ==========
float activityHistory[30];
int historyIndex = 0;
float baselineActivity = 0;

// ========== Timing ==========
unsigned long lastReadTime = 0;
unsigned long lastMQTTTime = 0;
unsigned long lastDisplayUpdate = 0;
unsigned long lastScreenSwitch = 0;
int currentScreen = 0;

// OLED working flag
bool oledWorking = false;

// ========== Setup ==========
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=== POULTRY MONITOR ===");
  
  Wire.begin();
  
  // Initialize OLED with error handling
  Serial.println("Initializing OLED...");
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS)) {
    Serial.println("OLED not found at 0x3C");
    Serial.println("Check wiring! Continuing without OLED...");
    oledWorking = false;
  } else {
    Serial.println("OLED initialized successfully!");
    oledWorking = true;
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.println("POULTRY MONITOR");
    display.println("Initializing...");
    display.display();
  }
  
  // Initialize sensors
  Serial.println("\nInitializing sensors...");
  
  if (lightSensor.begin()) {
    Serial.println("  Light sensor OK");
    // Force initial read
    float dummy;
    lightSensor.getData(dummy, lux);
  } else {
    Serial.println("  Light sensor FAILED");
  }
  
  if (weatherSensor.begin()) {
    Serial.println("  Weather sensor OK");
  } else {
    Serial.println("  Weather sensor FAILED");
  }
  
  if (motionSensor.begin(RANGE_2G, 25)) {
    Serial.println("  Motion sensor OK");
  } else {
    Serial.println("  Motion sensor FAILED");
  }
  
  // Connect to WiFi
  connectWiFi();
  connectMQTT();
  
  // Establish baseline
  establishBaseline();
  
  Serial.println("\n✓ System Ready!");
  
  if (oledWorking) {
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("READY!");
    display.display();
  }
  
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

void establishBaseline() {
  Serial.println("Establishing activity baseline (30 sec)...");
  
  if (oledWorking) {
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("Calibrating...");
    display.println("Please wait 30 sec");
    display.display();
  }
  
  float sum = 0;
  float x, y, z, magnitude;
  
  for (int i = 0; i < 30; i++) {
    delay(1000);
    motionSensor.getData(x, y, z);
    magnitude = sqrt(x*x + y*y + z*z);
    sum += magnitude;
    Serial.print(".");
    
    if (oledWorking && i % 5 == 0) {
      display.fillRect(0, 30, (i * 128 / 30), 8, SSD1306_WHITE);
      display.display();
    }
  }
  
  baselineActivity = sum / 30;
  Serial.printf("\nBaseline activity: %.3f g\n", baselineActivity);
}

void readSensors() {
  // Read Light Sensor
  float uvi_temp;
  lightSensor.getData(uvi_temp, lux);
  
  // Read Weather Sensor
  weatherSensor.getData(temperature, humidity);
  
  // Read Motion Sensor
  float accelX, accelY, accelZ;
  motionSensor.getData(accelX, accelY, accelZ);
  float magnitude = sqrt(accelX*accelX + accelY*accelY + accelZ*accelZ);
  float currentActivity = abs(magnitude - baselineActivity);
  
  // Update activity history
  activityHistory[historyIndex] = currentActivity;
  historyIndex = (historyIndex + 1) % 30;
  
  float sum = 0;
  for (int i = 0; i < 30; i++) {
    sum += activityHistory[i];
  }
  flockActivity = sum / 30;
  
  // Debug output
  Serial.println("\n--- SENSOR READINGS ---");
  Serial.printf("  Lux: %.0f\n", lux);
  Serial.printf("  Temperature: %.1f C\n", temperature);
  Serial.printf("  Humidity: %.0f %%\n", humidity);
  Serial.printf("  Flock Activity: %.3f g\n", flockActivity);
}

void sendMQTTData() {
  if (!mqttClient.connected()) {
    connectMQTT();
    return;
  }
  
  StaticJsonDocument<256> doc;
  
  doc["lux"] = lux;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["flock_activity"] = flockActivity;
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

void displayDataScreen() {
  if (!oledWorking) return;
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  
  display.setCursor(0, 0);
  display.println("=== POULTRY DATA ===");
  display.drawLine(0, 10, SCREEN_WIDTH, 10, SSD1306_WHITE);
  
  display.setCursor(0, 14);
  display.print("Light: ");
  if (lux >= 1000) {
    display.print(lux / 1000, 1);
    display.print("k");
  } else {
    display.print((int)lux);
  }
  display.println(" lx");
  
  display.setCursor(0, 26);
  display.print("Temp: ");
  display.print(temperature, 1);
  display.println(" C");
  
  display.setCursor(0, 38);
  display.print("Humidity: ");
  display.print(humidity, 0);
  display.println("%");
  
  display.setCursor(0, 50);
  display.print("Activity: ");
  display.print(flockActivity, 3);
  display.println(" g");
  
  display.display();
}

void displayStatusScreen() {
  if (!oledWorking) return;
  
  display.clearDisplay();
  display.setTextSize(1);
  
  display.setCursor(0, 0);
  display.println("=== SYSTEM STATUS ===");
  display.drawLine(0, 10, SCREEN_WIDTH, 10, SSD1306_WHITE);
  
  display.setCursor(0, 16);
  display.print("WiFi: ");
  display.println(WiFi.status() == WL_CONNECTED ? "CONNECTED" : "DISCONNECTED");
  
  if (WiFi.status() == WL_CONNECTED) {
    display.setCursor(0, 26);
    display.print("IP: ");
    display.println(WiFi.localIP());
  }
  
  display.setCursor(0, 40);
  display.print("MQTT: ");
  display.println(mqttClient.connected() ? "CONNECTED" : "DISCONNECTED");
  
  display.setCursor(0, 54);
  display.print("Lux: ");
  display.print((int)lux);
  
  display.display();
}

void updateDisplay() {
  if (!oledWorking) return;
  
  if (millis() - lastScreenSwitch >= 4000) {
    lastScreenSwitch = millis();
    currentScreen = (currentScreen + 1) % 2;
  }
  
  if (currentScreen == 0) {
    displayDataScreen();
  } else {
    displayStatusScreen();
  }
}

void loop() {
  if (WiFi.status() == WL_CONNECTED && !mqttClient.connected()) {
    connectMQTT();
  }
  
  if (mqttClient.connected()) {
    mqttClient.loop();
  }
  
  unsigned long now = millis();
  
  if (now - lastReadTime >= 2000) {
    lastReadTime = now;
    readSensors();
  }
  
  if (now - lastDisplayUpdate >= 500) {
    lastDisplayUpdate = now;
    updateDisplay();
  }
  
  if (now - lastMQTTTime >= 10000 && WiFi.status() == WL_CONNECTED) {
    lastMQTTTime = now;
    sendMQTTData();
  }
  
  delay(50);
}