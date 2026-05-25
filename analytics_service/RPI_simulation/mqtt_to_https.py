import json
import requests
import paho.mqtt.client as mqtt

# ── Config ────────────────────────────────────────────────────────────────────

MQTT_BROKER   = "35.172.255.228"       # MQTTx broker address (localhost if on the same RPi)
MQTT_PORT     = 1883
MQTT_TOPIC    =[
    ( "esp32/plant-section-1/sensor/data" ,     "plant 1"),
    ("maxiq/plant2",     "plant 2"),
    ("maxiq/plant3",     "plant 3"),
    ("maxiq/poultry1",   "poultry 1"),
    ("maxiq/aquaculture1", "aquaculture 1"),
]

TOPIC_DEVICE_MAP = {topic: device for topic, device in MQTT_TOPIC}

      # Topic the MAXIQ kit publishes to — adjust if different

BACKEND_URL   = "http://192.168.137.1:8000/ingest"  # Replace with your server's IP/domain
VERIFY_SSL    = True   # Set to False only during local dev with self-signed certs

# ── Callbacks ─────────────────────────────────────────────────────────────────

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"[MQTT] Connected. Subscribing to '{MQTT_TOPIC}'...")
        for topic,device in MQTT_TOPIC:
            client.subscribe(topic)
            print(f"{topic} is subscribed by device {device}")
    else:
        print(f"[MQTT] Connection failed with code {rc}")


def on_message(client, userdata, msg):
    """Called on every incoming MQTT message. Parses JSON and POSTs to backend."""
    topic=msg.topic
    try:
        payload = json.loads(msg.payload.decode("utf-8"))
        print(f"[MQTT] Received: {payload}")
    except json.JSONDecodeError as e:
        print(f"[MQTT] ⚠️  Failed to parse JSON on {topic}: {e}")
        return

    try:
        response = requests.post(
            BACKEND_URL,
            json=payload,
            timeout=5,
            verify=VERIFY_SSL,
        )
        result = response.json()
        print(f"[HTTP] POST {response.status_code} → id={result.get('id')} anomalies={result.get('anomalies')}")
    except requests.exceptions.ConnectionError:
        print(f"[HTTP] ⚠️  Could not reach backend at {BACKEND_URL}")
    except requests.exceptions.Timeout:
        print("[HTTP] ⚠️  Request timed out")
    except Exception as e:
        print(f"[HTTP] ⚠️  Unexpected error: {e}")


# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message

    print(f"[MQTT] Connecting to broker at {MQTT_BROKER}:{MQTT_PORT}...")
    client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)

    # Blocking loop — keeps the script alive and processes MQTT events
    client.loop_forever()