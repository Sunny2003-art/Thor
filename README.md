# Fault-Tolerant Air Quality Monitoring and Prediction Using Heterogeneous Sensors
Project: Fault-Tolerant Air Quality Monitoring and Prediction Using Heterogeneous Sensors
Author: N. Prajna Deepankar
Guide: Dr. Ranjith Ravindranathan Nair
Institute: NIT Calicut

Overview
This project builds a fault‑aware, real‑time air quality monitoring system using ESP32, PMS7003, MQ‑7/135/136, DHT22, DS3231 RTC, and SD card. It detects sensor faults at the edge, attaches a fault_mask and confidence score to every data sample, and uses a ConvLSTM model for AQI forecasting. A Flask + MongoDB dashboard visualizes live data and predictions.

Hardware (Perfboard implementation)
- ESP32 DevKit V1
- LM2596 buck converter (12V → 5V) + 1000µF / 0.1µF decoupling
- ADS1115 16‑bit ADC (powered at 5V, I²C with 4.7kΩ pull‑ups to 3.3V)
- PMS7003 (UART, checksum validation)
- MQ‑7, MQ‑135, MQ‑136 (analog via ADS1115)
- DHT22 (GPIO4, 10kΩ pull‑up)
- DS3231 RTC (I²C)
- SD card module (SPI)
- 12V adapter (2A) or 2×18650 battery backup with SPDT switch

Firmware Features
- 60s deterministic sampling (millis() scheduler, no delay())
- Oversampling + median filter for MQ sensors
- Rs/R₀ calculation → ML‑ready ratio
- 8‑bit fault_mask (ADC stuck, PMS fail, DHT fail, SD fail, RTC fail, voltage out of range)
- Confidence score = 1.0 – (fault_count × 0.1), min 0.3
- SD card first → WiFi sync (retry queue, batch upload)
- Watchdog timer (30s) and rail voltage monitor

ML Model
- ConvLSTM2D (30‑day sequences, 7 pollutants: PM2.5, PM10, NO2, CO, SO2, O3, NH3)
- Trained on 26‑city CPCB data (2015‑2020), uses fault_mask/confidence when available
- Average MAE = 8.77, RMSE = 10.55 → 21% better than LSTM
- Fault‑rate analysis: graceful degradation up to 50% missing data
- Ablation study: fault recovery reduces MAE by 30%

Dashboard
- Flask + MongoDB backend
- Live AQI, PM, gases, temp, humidity
- Health indicators (fault_mask decoded), confidence meter
- Historical trends, CSV export

Hardware Test
- Assemble circuit on perfboard following the schematic in the thesis.
- Upload firmware (provided separately) using Arduino IDE / PlatformIO.
- Check serial monitor for sensor readings and fault_mask.

Publication
Presented at ET2ECN 2026 (SVNIT Surat), to be published in Springer LNEE (Scopus).

📧 Contact
prajnadeepankarnelapuri@gmail.com 
