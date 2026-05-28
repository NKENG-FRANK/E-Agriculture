# ── Fixed Anomaly Thresholds ──────────────────────────────────────────────────
# Edit these constants to adjust what counts as an anomaly per sensor.
# All values are inclusive bounds — a reading AT the boundary IS an anomaly.

THRESHOLDS = {
    "temperature": {
        "min": 0.0,    # °C — below freezing
        "max": 40.0,   # °C — heat stress threshold
    },
    "humidity": {
        "min": 20.0,   # % — dangerously dry air
        "max": 90.0,   # % — risk of fungal disease
    },
    "soil_moisture": {
        "min": 10.0,   # raw % — severe drought stress
        "max": 95.0,   # raw % — waterlogged / root rot risk
    },
    "lux": {
        "min": 500.0,      # lux — too dark for photosynthesis
        "max": 100_000.0,  # lux — excessive / sensor saturation
    },
}